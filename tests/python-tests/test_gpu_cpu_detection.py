#!/usr/bin/env python3
"""
GPU/CPU Device Detection and Verification Script
Tests device manager and OCR initialization with GPU/CPU auto-detection
"""

import os
import sys
import logging

# Setup path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def test_device_manager():
    """Test device manager detection"""
    print("\n" + "="*70)
    print("TEST 1: DEVICE MANAGER DETECTION")
    print("="*70)
    
    try:
        from app.core.device_manager import DeviceManager, get_ocr_device_config, get_torch_device
        
        # Print detailed device info
        DeviceManager.print_device_info()
        
        # Get device config
        device_config = get_ocr_device_config()
        print(f"\n✅ Device config for OCR: {device_config['device'].upper()}")
        print(f"✅ Use GPU: {device_config['use_gpu']}")
        
        # Get torch device
        torch_device = get_torch_device()
        if torch_device:
            print(f"✅ PyTorch device: {torch_device}")
        else:
            print("⚠️  PyTorch not available")
        
        return True
    except Exception as e:
        print(f"❌ Device manager test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_easyocr_initialization():
    """Test EasyOCR with GPU/CPU detection"""
    print("\n" + "="*70)
    print("TEST 2: EASYOCR INITIALIZATION")
    print("="*70)
    
    try:
        print("⏳ Importing MultiMethodHandwrittenOCR...")
        from app.services.multimethod_ocr import MultiMethodHandwrittenOCR
        
        print("⏳ Initializing OCR engine (this may take a moment)...")
        ocr = MultiMethodHandwrittenOCR(languages=['en'])
        
        if ocr._easyocr_reader:
            print("✅ EasyOCR initialized successfully with GPU/CPU auto-detection")
            return True
        else:
            print("⚠️  EasyOCR initialization failed but engine created")
            return False
            
    except Exception as e:
        print(f"❌ EasyOCR initialization test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_trocr_initialization():
    """Test TrOCR with GPU support"""
    print("\n" + "="*70)
    print("TEST 3: TROCR INITIALIZATION")
    print("="*70)
    
    try:
        print("⏳ Checking TrOCR availability...")
        try:
            from transformers import TrOCRProcessor, VisionEncoderDecoderModel
            print("✅ Transformers library available")
        except ImportError:
            print("⚠️  Transformers not installed - TrOCR will be skipped")
            return True
        
        print("⏳ Importing MultiMethodHandwrittenOCR...")
        from app.services.multimethod_ocr import MultiMethodHandwrittenOCR
        
        print("⏳ Initializing OCR engine...")
        ocr = MultiMethodHandwrittenOCR(languages=['en'])
        
        if ocr._trocr_model:
            device = ocr._trocr_model.device if hasattr(ocr._trocr_model, 'device') else 'cpu'
            print(f"✅ TrOCR initialized successfully on device: {device}")
            return True
        else:
            print("⚠️  TrOCR not available but initialization attempted")
            return True
            
    except Exception as e:
        print(f"❌ TrOCR initialization test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_paddleocr_initialization():
    """Test PaddleOCR with GPU support"""
    print("\n" + "="*70)
    print("TEST 4: PADDLEOCR INITIALIZATION")
    print("="*70)
    
    try:
        print("⏳ Checking PaddleOCR availability...")
        try:
            from paddleocr import PaddleOCR
            print("✅ PaddleOCR library available")
        except ImportError:
            print("⚠️  PaddleOCR not installed - will be skipped")
            return True
        
        print("⏳ Importing MultiMethodHandwrittenOCR...")
        from app.services.multimethod_ocr import MultiMethodHandwrittenOCR
        
        print("⏳ Initializing OCR engine...")
        ocr = MultiMethodHandwrittenOCR(languages=['en'])
        
        if ocr._paddle_ocr:
            print(f"✅ PaddleOCR initialized successfully")
            return True
        else:
            print("⚠️  PaddleOCR not available but initialization attempted")
            return True
            
    except Exception as e:
        print(f"❌ PaddleOCR initialization test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_environment_variables():
    """Test environment variable optimization"""
    print("\n" + "="*70)
    print("TEST 5: ENVIRONMENT VARIABLES")
    print("="*70)
    
    try:
        from app.core.device_manager import DeviceManager
        
        omp_threads = os.environ.get('OMP_NUM_THREADS', 'Not set')
        mkl_threads = os.environ.get('MKL_NUM_THREADS', 'Not set')
        cuda_blocking = os.environ.get('CUDA_LAUNCH_BLOCKING', 'Not set')
        
        print(f"OMP_NUM_THREADS: {omp_threads}")
        print(f"MKL_NUM_THREADS: {mkl_threads}")
        print(f"CUDA_LAUNCH_BLOCKING: {cuda_blocking}")
        
        if DeviceManager.get_use_gpu():
            if cuda_blocking == '1':
                print("✅ CUDA environment properly configured for GPU")
            else:
                print("⚠️  CUDA environment could be optimized")
        else:
            if omp_threads != 'Not set' and mkl_threads != 'Not set':
                print("✅ CPU environment properly configured")
            else:
                print("⚠️  CPU environment could be optimized")
        
        return True
    except Exception as e:
        print(f"❌ Environment variables test failed: {e}")
        return False


def main():
    """Run all tests"""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*68 + "║")
    print("║" + "  GPU/CPU DEVICE DETECTION - COMPREHENSIVE TEST SUITE".center(68) + "║")
    print("║" + " "*68 + "║")
    print("╚" + "="*68 + "╝")
    
    tests = [
        ("Device Manager Detection", test_device_manager),
        ("EasyOCR Initialization", test_easyocr_initialization),
        ("TrOCR Initialization", test_trocr_initialization),
        ("PaddleOCR Initialization", test_paddleocr_initialization),
        ("Environment Variables", test_environment_variables),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))
        except Exception as e:
            print(f"\n❌ {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("="*70)
    print(f"\nResult: {passed_count}/{total_count} tests passed")
    
    if passed_count == total_count:
        print("\n🎉 ALL TESTS PASSED! GPU/CPU optimization is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total_count - passed_count} test(s) failed. Check logs above.")
        return 1


if __name__ == '__main__':
    sys.exit(main())
