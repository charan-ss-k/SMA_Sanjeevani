"""
Quick GPU detection script to verify PyTorch CUDA setup
"""

import torch

print("=" * 60)
print("PyTorch GPU Detection")
print("=" * 60)

print(f"\nPyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")

if torch.cuda.is_available():
    print(f"CUDA version: {torch.version.cuda}")
    print(f"Number of GPUs: {torch.cuda.device_count()}")
    print(f"Current GPU: {torch.cuda.current_device()}")
    print(f"GPU Name: {torch.cuda.get_device_name(0)}")
    print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
    print("\n✅ GPU is available and ready to use!")
else:
    print("\n❌ No GPU detected!")
    print("\nPossible reasons:")
    print("1. CUDA drivers not installed")
    print("2. PyTorch CPU-only version installed")
    print("3. GPU not supported")
    print("\nTo install PyTorch with CUDA support:")
    print("pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121")

print("=" * 60)
