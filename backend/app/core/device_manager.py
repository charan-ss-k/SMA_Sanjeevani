"""
GPU/CPU Detection and Configuration Utility
Detects available hardware and optimizes all deep learning operations
"""

import logging
import os
from typing import Dict, Any, Tuple

logger = logging.getLogger(__name__)


class DeviceManager:
    """
    Centralized device (CPU/GPU) detection and management.
    Provides optimized device selection for all ML operations.
    """
    
    # Class variables (cached)
    _device_info: Dict[str, Any] = None
    _use_gpu: bool = None
    
    @classmethod
    def detect_device(cls) -> Dict[str, Any]:
        """
        Detect available hardware and return device configuration.
        Caches result to avoid repeated checks.
        
        Returns:
            Dictionary with device info and flags
        """
        if cls._device_info is not None:
            return cls._device_info
        
        device_info = {
            'device': 'cpu',
            'use_gpu': False,
            'gpu_name': None,
            'gpu_count': 0,
            'cuda_available': False,
            'pytorch_available': False,
            'pytorch_version': None,
            'cuda_version': None,
            'cudnn_version': None,
        }
        
        # Check PyTorch
        try:
            import torch
            device_info['pytorch_available'] = True
            device_info['pytorch_version'] = torch.__version__
            
            # Check CUDA
            if torch.cuda.is_available():
                device_info['cuda_available'] = True
                device_info['device'] = 'cuda'
                device_info['use_gpu'] = True
                device_info['gpu_count'] = torch.cuda.device_count()
                device_info['gpu_name'] = torch.cuda.get_device_name(0)
                
                # Get CUDA info
                if hasattr(torch.version, 'cuda'):
                    device_info['cuda_version'] = torch.version.cuda
                if hasattr(torch.backends, 'cudnn'):
                    if hasattr(torch.backends.cudnn, 'version'):
                        device_info['cudnn_version'] = torch.backends.cudnn.version()
            
        except ImportError:
            logger.warning("⚠️ PyTorch not available - GPU acceleration disabled")
        except Exception as e:
            logger.warning(f"⚠️ PyTorch CUDA detection failed: {e}")
        
        # Cache result
        cls._device_info = device_info
        cls._use_gpu = device_info['use_gpu']
        
        return device_info
    
    @classmethod
    def get_device_string(cls) -> str:
        """Get PyTorch device string ('cuda' or 'cpu')"""
        if cls._use_gpu is None:
            cls.detect_device()
        return 'cuda' if cls._use_gpu else 'cpu'
    
    @classmethod
    def get_use_gpu(cls) -> bool:
        """Get boolean flag for GPU usage"""
        if cls._use_gpu is None:
            cls.detect_device()
        return cls._use_gpu
    
    @classmethod
    def print_device_info(cls):
        """Print detailed device information to logs"""
        info = cls.detect_device()
        
        print("=" * 70)
        print("🖥️  DEVICE HARDWARE INFORMATION")
        print("=" * 70)
        print(f"  Device: {info['device'].upper()}")
        print(f"  PyTorch: {info['pytorch_version'] if info['pytorch_available'] else 'NOT INSTALLED'}")
        
        if info['cuda_available']:
            print(f"  CUDA: {info['cuda_version']}")
            if info['cudnn_version']:
                print(f"  cuDNN: {info['cudnn_version']}")
            print(f"  GPU Count: {info['gpu_count']}")
            print(f"  GPU Model: {info['gpu_name']}")
            print(f"\n  ✅ GPU ACCELERATION ENABLED")
        else:
            print(f"\n  ⚠️  GPU NOT AVAILABLE - Using CPU")
            print(f"     (This will be slower for deep learning tasks)")
        
        print("=" * 70)


def get_ocr_device_config() -> Dict[str, Any]:
    """
    Get device configuration for OCR engines.
    Returns dict with parameters for EasyOCR, PaddleOCR, etc.
    """
    device_info = DeviceManager.detect_device()
    use_gpu = device_info['use_gpu']
    
    return {
        'use_gpu': use_gpu,
        'device': 'cuda' if use_gpu else 'cpu',
        'gpu_id': 0 if use_gpu else None,
        'device_info': device_info,
    }


def get_torch_device():
    """Get PyTorch device object"""
    try:
        import torch
        device_str = DeviceManager.get_device_string()
        return torch.device(device_str)
    except ImportError:
        return None


def optimize_for_device() -> str:
    """
    Optimize environment for detected device.
    Sets necessary environment variables for optimal performance.
    
    Returns:
        Device type string ('cuda' or 'cpu')
    """
    info = DeviceManager.detect_device()
    device = info['device']
    
    if device == 'cuda':
        # Optimize for GPU
        os.environ['OMP_NUM_THREADS'] = '1'  # Avoid CPU threading overhead
        os.environ['CUDA_LAUNCH_BLOCKING'] = '1'  # Better error messages
        logger.info("✅ Environment optimized for GPU")
    else:
        # Optimize for CPU
        # Use all available threads
        import multiprocessing
        num_threads = multiprocessing.cpu_count()
        os.environ['OMP_NUM_THREADS'] = str(num_threads)
        os.environ['MKL_NUM_THREADS'] = str(num_threads)
        logger.info(f"✅ Environment optimized for CPU ({num_threads} threads)")
    
    return device


# Initialize on module import
DeviceManager.detect_device()
optimize_for_device()

logger.info(f"✅ Device Manager initialized - Using: {DeviceManager.get_device_string().upper()}")
