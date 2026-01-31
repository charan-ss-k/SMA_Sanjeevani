#!/bin/bash

# Script to install PyTorch with GPU support (CUDA 12.1)

echo "=================================================="
echo "Installing PyTorch with CUDA 12.1 GPU Support"
echo "=================================================="

# Uninstall CPU-only PyTorch
echo ""
echo "Step 1: Uninstalling CPU-only PyTorch..."
pip uninstall -y torch torchvision torchaudio

# Install GPU-enabled PyTorch
echo ""
echo "Step 2: Installing PyTorch with CUDA 12.1 support..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

echo ""
echo "Step 3: Verifying installation..."
python check_gpu.py

echo ""
echo "=================================================="
echo "Installation complete!"
echo "=================================================="
