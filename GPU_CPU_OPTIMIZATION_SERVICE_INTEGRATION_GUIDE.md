# GPU/CPU OPTIMIZATION - SERVICE INTEGRATION GUIDE

## Quick Start for Other Services

This guide explains how to add GPU/CPU optimization to any service that uses deep learning models.

---

## Step 1: Import Device Manager

Add these imports to your service file:

```python
from app.core.device_manager import (
    get_ocr_device_config,      # For OCR engines
    get_torch_device,            # For PyTorch models
    DeviceManager               # For device info
)
```

---

## Step 2: Update Model Initialization

### For OCR Engines (EasyOCR, PaddleOCR)

**Pattern:**
```python
# 1. Get device config
device_config = get_ocr_device_config()
use_gpu = device_config['use_gpu']
device_type = device_config['device']

# 2. Log initialization
self.logger.info(f"🔤 Initializing Engine on {device_type.upper()}...")

# 3. Pass gpu flag to OCR engine
self._engine = SomeOCREngine(use_gpu=use_gpu)

# 4. Log result
if use_gpu:
    self.logger.info(f"✅ Engine initialized on GPU")
else:
    self.logger.info("✅ Engine initialized on CPU")
```

**Examples:**

```python
# EasyOCR
device_config = get_ocr_device_config()
self._reader = easyocr.Reader(['en'], gpu=device_config['use_gpu'])

# PaddleOCR
device_config = get_ocr_device_config()
self._paddle = PaddleOCR(use_gpu=device_config['use_gpu'])

# Tesseract (CPU-only, no changes needed)
self._text = pytesseract.image_to_string(image)
```

### For PyTorch Models

**Pattern:**
```python
# 1. Get device
device = get_torch_device()

# 2. Load model
model = MyModel.from_pretrained('model-name')

# 3. Move to device
if device:
    model = model.to(device)

# 4. Log
self.logger.info(f"✅ Model on {device}")
```

**Example:**
```python
device = get_torch_device()
model = VisionTransformer.from_pretrained('google/vit-base-patch16-224')
model = model.to(device)  # Moves to GPU or CPU as needed
```

---

## Step 3: Update Inference Code

### For Tensor Operations

Move tensors to the device:

```python
# During inference
device = get_torch_device()

# Prepare input
input_tensor = torch.randn(1, 3, 224, 224)

# Move to device
if device:
    input_tensor = input_tensor.to(device)

# Run model
with torch.no_grad():
    output = model(input_tensor)

# Move output back to CPU if needed
output = output.cpu()
```

### For OCR Engines

No changes needed - the engine handles device internally once configured during init.

---

## Real-World Examples

### Example 1: Image Classification Service

**Before (CPU-only):**
```python
class ImageClassifier:
    def __init__(self):
        self.model = torchvision.models.resnet50(pretrained=True)
        # Model stuck on CPU
    
    def classify(self, image):
        image_tensor = self._preprocess(image)
        # Tensor on CPU, model on CPU = no problem but slow
        output = self.model(image_tensor)
        return output
```

**After (GPU-aware):**
```python
from app.core.device_manager import get_torch_device

class ImageClassifier:
    def __init__(self):
        device = get_torch_device()
        self.model = torchvision.models.resnet50(pretrained=True)
        
        # Move to GPU if available
        if device:
            self.model = self.model.to(device)
        
        self.device = device
        self.logger.info(f"✅ ResNet50 on {self.device}")
    
    def classify(self, image):
        image_tensor = self._preprocess(image)
        
        # Move tensor to device
        if self.device:
            image_tensor = image_tensor.to(self.device)
        
        # Model and tensor on same device = GPU-optimized
        with torch.no_grad():
            output = self.model(image_tensor)
        
        # Move output back to CPU for return
        return output.cpu()
```

**Impact:** 5-10x faster on GPU systems

---

### Example 2: Medical Image Analysis

**Before (CPU-only):**
```python
class MedicalImageAnalyzer:
    def __init__(self):
        self.model = self._load_medical_model()
        # No device specification = CPU
        
    def analyze(self, image):
        tensor = self._prepare_tensor(image)
        result = self.model(tensor)  # CPU inference
        return result
```

**After (GPU-aware):**
```python
from app.core.device_manager import get_torch_device

class MedicalImageAnalyzer:
    def __init__(self):
        device = get_torch_device()
        self.model = self._load_medical_model()
        
        # Move to GPU for medical analysis speedup
        if device:
            self.model = self.model.to(device)
        
        self.device = device
        self.logger.info(f"🏥 Medical model on {device}")
    
    def analyze(self, image):
        tensor = self._prepare_tensor(image)
        
        # Move tensor to same device
        if self.device:
            tensor = tensor.to(self.device)
        
        with torch.no_grad():
            result = self.model(tensor)
        
        return result.cpu()
```

**Impact:** Critical operations 3-8x faster

---

### Example 3: Text Extraction Service

**Before:**
```python
class TextExtractor:
    def __init__(self):
        self.ocr = easyocr.Reader(['en'], gpu=False)
        # Always CPU
    
    def extract(self, image):
        return self.ocr.readtext(image)
```

**After:**
```python
from app.core.device_manager import get_ocr_device_config

class TextExtractor:
    def __init__(self):
        device_config = get_ocr_device_config()
        self.ocr = easyocr.Reader(
            ['en'],
            gpu=device_config['use_gpu']
        )
        
        device = device_config['device']
        self.logger.info(f"📄 EasyOCR on {device.upper()}")
    
    def extract(self, image):
        return self.ocr.readtext(image)
```

**Impact:** 5-10x faster on GPU

---

## Common Patterns

### Pattern 1: Single Model with Multiple Inferences

```python
from app.core.device_manager import get_torch_device

class MyService:
    def __init__(self):
        device = get_torch_device()
        self.model = MyModel()
        self.model = self.model.to(device)  # Setup once
        self.device = device
    
    def process_batch(self, items):
        results = []
        for item in items:
            tensor = self._prepare(item)
            tensor = tensor.to(self.device)  # Move each input
            
            with torch.no_grad():
                output = self.model(tensor)
            
            results.append(output.cpu())
        
        return results
```

### Pattern 2: Conditional GPU Features

```python
from app.core.device_manager import DeviceManager

class AdvancedService:
    def __init__(self):
        info = DeviceManager.detect_device()
        
        if info['use_gpu']:
            # Load high-res model only on GPU
            self.model = HighResModel()
        else:
            # Use lighter model on CPU
            self.model = LightModel()
```

### Pattern 3: Auto Fallback

```python
from app.core.device_manager import get_torch_device

class RobustService:
    def __init__(self):
        self.device = get_torch_device()
        self.model = MyModel()
        
        try:
            self.model = self.model.to(self.device)
        except RuntimeError as e:
            self.logger.warning(f"GPU failed: {e}, using CPU")
            self.device = torch.device('cpu')
            self.model = self.model.to(self.device)
```

---

## Services Ready for Optimization

These services can be updated using the patterns above:

1. **Document Analysis Services**
   - Use: get_torch_device()
   - Pattern: Move model to device

2. **Image Processing Services**
   - Use: get_torch_device()
   - Pattern: Move model and tensors to device

3. **LLM Services (Ollama)**
   - Use: DeviceManager.get_use_gpu()
   - Pattern: Pass GPU flag to Ollama

4. **Video Processing Services**
   - Use: get_torch_device()
   - Pattern: Stream processing on device

---

## Testing Your Integration

### Test Script Template

```python
import sys
from app.core.device_manager import DeviceManager, get_torch_device

def test_your_service():
    print("Testing service with GPU/CPU detection...")
    
    # Show device info
    info = DeviceManager.detect_device()
    print(f"Using: {info['device'].upper()}")
    
    # Initialize service
    service = YourService()
    
    # Test inference
    test_input = create_test_input()
    result = service.process(test_input)
    
    print(f"✅ Service works on {info['device'].upper()}")
    return True
```

### Verification Checklist

- [ ] Service imports device manager
- [ ] Model moved to device during init
- [ ] Tensors moved to device during inference
- [ ] Works on CPU system
- [ ] Works on GPU system (if available)
- [ ] Logging shows device selection
- [ ] No errors on device mismatch

---

## Troubleshooting

### "CUDA out of memory"
- **Solution**: Reduce batch size or model size
- **Code**: Check tensor.size() before model

### "Expected tensor on device X but got Y"
- **Solution**: Add `.to(device)` before model call
- **Code**: `tensor = tensor.to(self.device)`

### "No GPU available" on GPU system
- **Solution**: Install GPU PyTorch version
- **Code**: `pip install torch --index-url https://download.pytorch.org/whl/cu118`

### Model loaded but inference on CPU
- **Solution**: Check if model.to(device) was called
- **Code**: `self.model = self.model.to(device)`

---

## Performance Monitoring

Add timing to verify GPU acceleration:

```python
import time
from app.core.device_manager import get_torch_device

device = get_torch_device()
model = MyModel().to(device)

# Warm up
for _ in range(3):
    model(test_input.to(device))

# Benchmark
start = time.time()
for _ in range(100):
    model(test_input.to(device))
elapsed = time.time() - start

print(f"100 inferences: {elapsed:.2f}s on {device}")
print(f"Per inference: {elapsed/100*1000:.2f}ms")
```

Expected speedups:
- GPU: 10-50ms per inference
- CPU: 100-500ms per inference

---

## Summary

### Quick Integration Steps
1. Import: `from app.core.device_manager import get_torch_device`
2. Init: `device = get_torch_device()`
3. Move: `model = model.to(device)`
4. Infer: `tensor = tensor.to(device); result = model(tensor)`
5. Log: `self.logger.info(f"Model on {device}")`

### Result
✅ 3-10x faster on GPU  
✅ No slowdown on CPU  
✅ Automatic adaptation  
✅ Production-ready

---

## Next Steps

1. Identify services using PyTorch/OCR engines
2. Apply patterns from this guide
3. Test on both CPU and GPU systems
4. Update documentation with device requirements
5. Monitor performance improvements

**Questions?** Check `GPU_CPU_OPTIMIZATION_COMPLETE.md` for detailed documentation.
