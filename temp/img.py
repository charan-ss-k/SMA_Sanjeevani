import os
import cv2  # OpenCV for image processing
import numpy as np  # For array operations
import pytesseract # OCR to read text
import ollama # The AI Brain
import tkinter as tk
from tkinter import filedialog
import matplotlib.pyplot as plt
import matplotlib.image as mpimg

# Optional: lightweight OCR alternative (easier than PaddleOCR)
try:
    import easyocr
    HAVE_EASYOCR = True
except ImportError:
    HAVE_EASYOCR = False

# ==========================================
# 1. CONFIGURATION
# ==========================================
# ⚠️ CRITICAL: Make sure this path matches where you installed Tesseract!
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

MODEL_NAME = "mistral"

def preprocess_image_multiple_methods(image_path):
    """
    Try multiple preprocessing strategies and return all variants.
    Handles reflective surfaces, blister packs, prescriptions, bottles.
    """
    # Load image
    img = cv2.imread(image_path)
    
    if img is None:
        raise ValueError(f"Could not load image from {image_path}")
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    results = []

    # METHOD 1: Mild denoise + grayscale (let Tesseract handle threshold)
    mild_denoise = cv2.fastNlMeansDenoising(gray, None, h=8, templateWindowSize=7, searchWindowSize=21)
    results.append(('Gray Denoised', mild_denoise))

    # METHOD 2: CLAHE + OTSU (balanced, avoids over-thresholding foil packs)
    clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(8, 8))
    clahe_img = clahe.apply(mild_denoise)
    blurred = cv2.GaussianBlur(clahe_img, (3, 3), 0)
    _, otsu = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    results.append(('CLAHE OTSU', otsu))

    # METHOD 3: CLAHE + Adaptive Mean (gentler for uneven lighting)
    adaptive = cv2.adaptiveThreshold(
        clahe_img, 255,
        cv2.ADAPTIVE_THRESH_MEAN_C,
        cv2.THRESH_BINARY,
        21, 10
    )
    results.append(('CLAHE Adaptive Mean', adaptive))

    # METHOD 4: Inverted OTSU (for dark text on bright foil)
    inverted = cv2.bitwise_not(otsu)
    results.append(('Inverted OTSU', inverted))

    return results

def select_image():
    root = tk.Tk()
    root.withdraw() 
    file_path = filedialog.askopenfilename(
        title="Select Medicine Image (Tablet/Prescription/Bottle)",
        filetypes=[("Image Files", "*.jpg;*.jpeg;*.png;*.webp;*.bmp;*.tiff")]
    )
    return file_path

def identify_medicine():
    print(f"\n🚀 Connecting to Local Ollama ({MODEL_NAME})...")
    
    while True:
        print("\n📸 Please select an image file (check the popup window)...")
        image_path = select_image()
        
        if not image_path:
            print("❌ No file selected. Exiting.")
            break
            
        print(f"🤔 Analyzing: {os.path.basename(image_path)}...")
        
        try:
            # --- STEP 1: READ TEXT (OCR) ---
            print("1️⃣  Reading text with Tesseract (OCR)...")
            print("   🔧 Trying multiple preprocessing strategies...")
            
            # Get multiple preprocessing variants
            preprocessed_images = preprocess_image_multiple_methods(image_path)
            
            # Try different Tesseract PSM modes
            psm_modes = [
                ('Auto', 3),      # Fully automatic page segmentation
                ('Single Block', 6),  # Assume uniform block of text
                ('Single Line', 7),   # Treat as single text line
                ('Sparse Text', 11)   # Sparse text, find as much as possible
            ]
            
            best_text = ""
            best_length = 0
            best_method = ""
            best_image = preprocessed_images[0][1]
            all_texts = []
            
            # Try all combinations and pick the best result
            for method_name, processed_img in preprocessed_images:
                for psm_name, psm_mode in psm_modes:
                    try:
                        config = f'--oem 3 --psm {psm_mode}'
                        text = pytesseract.image_to_string(processed_img, config=config)
                        text = " ".join(text.split())  # Clean whitespace
                        all_texts.append(text)
                        
                        # Pick the result with most extracted text
                        if len(text) > best_length:
                            best_length = len(text)
                            best_text = text
                            best_method = f"{method_name} + PSM {psm_mode} ({psm_name})"
                            best_image = processed_img
                    except:
                        pass
            
            # --- Optional EasyOCR pass (often better on packaging) ---
            if HAVE_EASYOCR:
                try:
                    global _easyocr_reader
                    if '_easyocr_reader' not in globals():
                        _easyocr_reader = easyocr.Reader(['en'], gpu=False)

                    for candidate in [cv2.imread(image_path), best_image]:
                        if candidate is None:
                            continue
                        # Ensure 3-channel for EasyOCR
                        if len(candidate.shape) == 2:
                            candidate_rgb = cv2.cvtColor(candidate, cv2.COLOR_GRAY2RGB)
                        else:
                            candidate_rgb = candidate

                        text_list = _easyocr_reader.readtext(candidate_rgb, detail=0, paragraph=True)
                        text = " ".join(text_list)
                        text = " ".join(text.split())
                        all_texts.append(text)
                        if len(text) > best_length:
                            best_length = len(text)
                            best_text = text
                            best_method = "EasyOCR"
                            best_image = candidate
                except Exception as e:
                    print(f"   ⚠️ EasyOCR unavailable or failed: {e}")

            clean_text = best_text
            clean_img = best_image  # Display the best-performing variant
            
            print(f"   ✅ Best result: {best_method}")
            print(f"   📄 Extracted text ({len(clean_text)} chars)")
            print(f"   Preview: {clean_text[:100]}...")
            
            # Combine all unique text for comprehensive analysis
            combined_text = " | ".join(set([t for t in all_texts if len(t) > 10]))
            
            if len(clean_text) < 5:
                print("⚠️ OCR Warning: Could not find clear text. Result might be poor.")
                print("   💡 Try: Better lighting, higher resolution image, or clearer photo.")

            # --- STEP 2: ANALYZE TEXT (AI) ---
            print(f"2️⃣  Sending text to {MODEL_NAME} for comprehensive pharmaceutical analysis...")

            prompt = f"""
Identify the medicine from this OCR text and provide concise information based on your medical knowledge:

OCR TEXT: "{clean_text}"
VARIANTS: {combined_text[:300]}

Provide brief, factual information in this exact format:

**MEDICINE:** [Brand] ([Generic Name]) - [Category]
**COMPOSITION:** [Active ingredient(s) with strength]
**FORM:** [Tablet/Capsule/Syrup/etc.]

**SAFE DAILY DOSAGE:**
• Adults (18-65): [dose] every [hours], max [amount]/day
• Elderly (65+): [dose or "Same as adults"]
• Children (12-17): [dose] or "Not recommended"
• Children (6-11): [dose] or "Not recommended"
• Children (2-5): [dose] or "Not recommended"
• Infants (<2): [dose] or "Not recommended"

**PRIMARY USE:** [Brief description]
**MAX DAILY LIMIT:** [amount]
**OVERDOSE RISK:** [Brief warning]
**AVOID IF:** [Key contraindications]

Keep it concise - no essays, just essential facts.
"""
            
            # Send to Ollama
            response = ollama.chat(
                model=MODEL_NAME,
                messages=[{'role': 'user', 'content': prompt}]
            )
            
            # --- STEP 3: DISPLAY REPORT ---
            print("\n" + "="*70)
            print("💊 MEDICINE SAFETY & DOSAGE VALIDATION REPORT")
            print("="*70)
            print(response['message']['content'])
            print("="*70)
            print("\n⚠️  DISCLAIMER: This is AI-assisted analysis. Always consult a")
            print("   healthcare professional before taking any medication.\n")
            
            # Show Original and Preprocessed Images
            fig, axes = plt.subplots(1, 2, figsize=(12, 5))
            
            # Original Image
            original = mpimg.imread(image_path)
            axes[0].imshow(original)
            axes[0].axis('off')
            axes[0].set_title("Original Image", fontweight='bold')
            
            # Preprocessed Image
            axes[1].imshow(clean_img, cmap='gray')
            axes[1].axis('off')
            axes[1].set_title("After Noise Removal & Enhancement", fontweight='bold')
            
            fig.suptitle("Medicine Analysis - OCR + Phi-3.5 AI", 
                        color='teal', fontweight='bold', fontsize=14)
            plt.tight_layout()
            plt.show()
            
        except Exception as e:
            print(f"❌ Error: {e}")
            print("💡 Tip: 1. Is Tesseract installed? 2. Is Ollama running?")

        # Ask to continue
        cont = input("\nScan another? (y/n): ").lower()
        if cont != 'y':
            break

if __name__ == "__main__":
    # Check if Ollama is running
    try:
        ollama.list()
        identify_medicine()
    except:
        print("⚠️ ERROR: Ollama is not running.")
        print("👉 Please open the 'Ollama' application on your computer first.")
