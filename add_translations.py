#!/usr/bin/env python3
# Script to add missing translation keys to all language sections

import re

# The translations to add for each language
translations = {
    'tamil': {
        'handwrittenPrescriptionAnalyzer': 'எழுதப்பட்ட பரிந்துரை பகுப்பாய்வு கருவி',
        'uploadHandwrittenPrescription': 'உங்கள் கையால் எழுதப்பட்ட பரிந்துரையின் ஒரு புகைப்படத்தை பதிவேற்றவும். எங்கள் AI இதை பகுப்பாய்வு செய்து மருந்து பெயர்கள், மருந்து அளவு மற்றும் அதிர்வெண்களை பிரித்தெடுக்கும்.',
        'dragImageHere': 'பரிந்துரை படத்தை இங்கே இழுக்கவும் அல்லது பதிவேற்ற க்লிக் செய்யவும்',
        'supportedFormats': 'ஆதரிக்கப்பட்டது: JPG, PNG, WebP, BMP, TIFF (அதிகபட்ச 10MB)',
        'analyzingPrescription': 'உங்கள் பரிந்துரையை பகுப்பாய்வு செய்கிறது...',
        'processingPipeline': 'செயலாக்கம்: படம் → OCR → AI பகுப்பாய்வு',
        'recognizedTextOCR': 'அங்கீகாரம் செய்யப்பட்ட உரை (OCR)',
        'decipheredMedicines': 'மறைவுக்கல்களை விளக்கிய மருந்துகள்',
        'importantWarnings': 'முக்கியமான எச்சரிக்கைகள்',
        'processingPipelineLabel': 'செயலாக்க குழாய்',
        'preprocessing': 'முன் செயலாக்கம்',
        'htrTrOCR': 'HTR (TrOCR)',
        'llmDeciphering': 'LLM விளக்கம்',
    },
    'kannada': {
        'handwrittenPrescriptionAnalyzer': 'ಹಸ್ತಲಿಖಿತ ಪ್ರೆಸ್ಕ್ರಿಪ್ಷನ್ ವಿಶ್ಲೇಷಕ',
        'uploadHandwrittenPrescription': 'ನಿಮ್ಮ ಹಸ್ತಲಿಖಿತ ಪ್ರೆಸ್ಕ್ರಿಪ್ಷನ್ನ ಫೋಟೋವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ. ನಮ್ಮ AI ಇದನ್ನು ವಿಶ್ಲೇಷಿಸಿ ಔಷಧಿ ಹೆಸರುಗಳು, ಖುರಾಕು ಮತ್ತು ಆವೃತ್ತಿಗಳನ್ನು ಬೇರ್ಪಡಿಸುತ್ತದೆ.',
        'dragImageHere': 'ಪ್ರೆಸ್ಕ್ರಿಪ್ಷನ್ ಚಿತ್ರವನ್ನು ಇಲ್ಲಿ ಎಳೆಯಿರಿ ಅಥವಾ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ',
        'supportedFormats': 'ಬೆಂಬಲಿತ: JPG, PNG, WebP, BMP, TIFF (ಗರಿಷ್ಠ 10MB)',
        'analyzingPrescription': 'ನಿಮ್ಮ ಪ್ರೆಸ್ಕ್ರಿಪ್ಷನ್ ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...',
        'processingPipeline': 'ಪ್ರಕ್ರಿಯೆ: ಚಿತ್ರ → OCR → AI ವಿಶ್ಲೇಷಣ',
        'recognizedTextOCR': 'ಗುರುತಿಸಿದ ಪಠ್ಯ (OCR)',
        'decipheredMedicines': 'ವಿಚಿತ್ರವಾದ ಔಷಧಿಗಳು',
        'importantWarnings': 'ಪ್ರಮುಖ ಸೂಚನೆಗಳು',
        'processingPipelineLabel': 'ಪ್ರಕ್ರಿಯೆ ಪೈಪ್‌ಲೈನ್',
        'preprocessing': 'ಪೂರ್ವ ಪ್ರಕ್ರಿಯೆ',
        'htrTrOCR': 'HTR (TrOCR)',
        'llmDeciphering': 'LLM ವಿವೃತಿ',
    },
    'malayalam': {
        'handwrittenPrescriptionAnalyzer': 'കൈയെഴുത്തായി എഴുതിയ പ്രെസ്ക്രിപ്ഷൻ വിശകലനകാരൻ',
        'uploadHandwrittenPrescription': 'നിങ്ങളുടെ കൈയെഴുത്തായി എഴുതിയ പ്രെസ്ക്രിപ്ഷനിന്റെ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക. ഞങ്ങളുടെ AI ഇത് വിശകലനം ചെയ്ത് ഔഷധ പേരുകൾ, അളവുകൾ, ഫ്രീക്വൻസികൾ എന്നിവ വേർതിരിച്ചെടുക്കും.',
        'dragImageHere': 'പ്രെസ്ക്രിപ്ഷൻ ചിത്രം ഇവിടെ വലിച്ചിടുക അല്ലെങ്കിൽ അപ്‌ലോഡ് ചെയ്യാൻ ക്ലിക്ക് ചെയ്യുക',
        'supportedFormats': 'പിന്തുണയ്ക്കപ്പെടുന്നത്: JPG, PNG, WebP, BMP, TIFF (പരമാവധി 10MB)',
        'analyzingPrescription': 'നിങ്ങളുടെ പ്രെസ്ക്രിപ്ഷൻ വിശകലനം ചെയ്യുന്നു...',
        'processingPipeline': 'പ്രോസെസ്സിംഗ്: ചിത്രം → OCR → AI വിശകലനം',
        'recognizedTextOCR': 'അംഗീകൃത ടെക്സ്റ്റ് (OCR)',
        'decipheredMedicines': 'വിവരിച്ച മരുന്നുകൾ',
        'importantWarnings': 'പ്രധാനപ്പെട്ട മുന്നറിപ്പുകൾ',
        'processingPipelineLabel': 'പ്രോസെസ്സിംഗ് പൈപ്പ്‌ലൈൻ',
        'preprocessing': 'പ്രീപ്രോസെസ്സിംഗ്',
        'htrTrOCR': 'HTR (TrOCR)',
        'llmDeciphering': 'LLM വ്യാഖ്യാനം',
    },
    'bengali': {
        'handwrittenPrescriptionAnalyzer': 'হাতে লেখা প্রেসক্রিপশন বিশ্লেষণ সরঞ্জাম',
        'uploadHandwrittenPrescription': 'আপনার হাতে লেখা প্রেসক্রিপশনের একটি ফটো আপলোড করুন। আমাদের AI এটি বিশ্লেষণ করবে এবং ওষুধের নাম, ডোজ এবং ফ্রিকোয়েন্সি বের করবে।',
        'dragImageHere': 'প্রেসক্রিপশন ছবি এখানে টেনে আনুন অথবা আপলোড করতে ক্লিক করুন',
        'supportedFormats': 'সমর্থিত: JPG, PNG, WebP, BMP, TIFF (সর্বাধিক 10MB)',
        'analyzingPrescription': 'আপনার প্রেসক্রিপশন বিশ্লেষণ করা হচ্ছে...',
        'processingPipeline': 'প্রক্রিয়া: ছবি → OCR → AI বিশ্লেষণ',
        'recognizedTextOCR': 'স্বীকৃত পাঠ (OCR)',
        'decipheredMedicines': 'বোঝা যায় এমন ওষুধ',
        'importantWarnings': 'গুরুত্বপূর্ণ সতর্কতা',
        'processingPipelineLabel': 'প্রক্রিয়া পাইপলাইন',
        'preprocessing': 'প্রাথমিক প্রক্রিয়া',
        'htrTrOCR': 'HTR (TrOCR)',
        'llmDeciphering': 'LLM অর্থ নির্ণয়',
    },
    'gujarati': {
        'handwrittenPrescriptionAnalyzer': 'હસ્તલેખિત પ્રિસ્ક્રિપ્શન વિશ્લેષણ સાધન',
        'uploadHandwrittenPrescription': 'તમારી હસ્તલેખિત પ્રિસ્ક્રિપ્શનનો ફોટો અપલોડ કરો. આমારું AI તેનું વિશ્લેષણ કરશે અને દવાનાં નામ, માત્રા અને આવર્તન બહાર કાઢશે.',
        'dragImageHere': 'પ્રિસ્ક્રિપ્શન ઈમેજ અહીં ખેંચો અથવા અપલોડ કરવા માટે ક્લિક કરો',
        'supportedFormats': 'સમર્થિત: JPG, PNG, WebP, BMP, TIFF (સર્વાધિક 10MB)',
        'analyzingPrescription': 'તમારી પ્રિસ્ક્રિપ્શનનું વિશ્લેષણ કરવામાં આવી રહ્યું છે...',
        'processingPipeline': 'પ્રક્રિયા: ઈમેજ → OCR → AI વિશ્લેષણ',
        'recognizedTextOCR': 'ઓળખાયેલ ટેક્સ્ટ (OCR)',
        'decipheredMedicines': 'સમજી શકાય તેવી દવાઓ',
        'importantWarnings': 'મહત્વપૂર્ણ ચેતવણીઓ',
        'processingPipelineLabel': 'પ્રક્રિયા પાઇપલાઇન',
        'preprocessing': 'પૂર્વ પ્રક્રિયા',
        'htrTrOCR': 'HTR (TrOCR)',
        'llmDeciphering': 'LLM અર્થઘટન',
    },
    'marathi': {
        'handwrittenPrescriptionAnalyzer': 'हाতानेलिहिलेले प्रेसक्रिप्शन विश्लेषण साधन',
        'uploadHandwrittenPrescription': 'तुमच्या हातानेलिहिलेल्या प्रेसक्रिप्शनचा फोटो अपलोड करा. आमचे AI याचे विश्लेषण करेल आणि औषध नावे, डोज आणि वारंवारता काढून टाकेल.',
        'dragImageHere': 'प्रेसक्रिप्शन इमेज येथे ड्रॅग करा किंवा अपलोड करण्यासाठी क्लिक करा',
        'supportedFormats': 'समर्थित: JPG, PNG, WebP, BMP, TIFF (कमाल 10MB)',
        'analyzingPrescription': 'तुमची प्रेसक्रिप्शन विश्लेषण केली जात आहे...',
        'processingPipeline': 'प्रक्रिया: इमेज → OCR → AI विश्लेषण',
        'recognizedTextOCR': 'मान्यताप्राप्त मजकूर (OCR)',
        'decipheredMedicines': 'समजलेली औषधे',
        'importantWarnings': 'महत्वाचे सावधानी',
        'processingPipelineLabel': 'प्रक्रिया पाइपलाइन',
        'preprocessing': 'पूर्व प्रक्रिया',
        'htrTrOCR': 'HTR (TrOCR)',
        'llmDeciphering': 'LLM व्याख्या',
    }
}

def add_translations_to_file():
    with open('prescriptionTranslations.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # For each language, find the section and add the translations
    for lang, trans_dict in translations.items():
        # Find the language section
        pattern = f'{lang}: {{(.*?)}},\\n\\n  '
        match = re.search(pattern, content, re.DOTALL)
        
        if match:
            # Find the last line of the language section (before the closing })
            section_start = match.start()
            section_content = match.group(1)
            
            # Create the translation entries
            trans_text = ''
            for key, value in trans_dict.items():
                trans_text += f"    {key}: '{value}',\n"
            
            # Add a comment header
            comment = "\n    // Handwritten Prescription Analyzer\n"
            
            # Replace the last line in the section
            # Find where to insert (before the closing },)
            insert_pattern = f"{lang}: {{(.*?)\\n  }},"
            replacement = f"{lang}: {{\\1\n{comment}{trans_text}  }},"
            
            content = re.sub(insert_pattern, replacement, content, count=1, flags=re.DOTALL)
    
    with open('prescriptionTranslations.js', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Translations added successfully!")

if __name__ == '__main__':
    import os
    os.chdir('d:\\GitHub 2\\SMA_Sanjeevani\\frontend\\src\\data')
    add_translations_to_file()
