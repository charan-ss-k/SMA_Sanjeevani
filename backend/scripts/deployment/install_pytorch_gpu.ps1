# PowerShell script to install PyTorch with GPU support (CUDA 12.1)

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Installing PyTorch with CUDA 12.1 GPU Support" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Uninstall CPU-only PyTorch
Write-Host ""
Write-Host "Step 1: Uninstalling CPU-only PyTorch..." -ForegroundColor Yellow
pip uninstall -y torch torchvision torchaudio

# Install GPU-enabled PyTorch
Write-Host ""
Write-Host "Step 2: Installing PyTorch with CUDA 12.1 support..." -ForegroundColor Yellow
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

Write-Host ""
Write-Host "Step 3: Verifying installation..." -ForegroundColor Yellow
python check_gpu.py

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
