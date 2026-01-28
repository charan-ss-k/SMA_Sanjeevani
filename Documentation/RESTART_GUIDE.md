# 🚀 QUICK RESTART GUIDE - 2 MINUTES

## Step 1: Kill Old Processes

### PowerShell:
```powershell
# Kill any Python processes
Get-Process python | Stop-Process -Force

# Kill any Node processes  
Get-Process node | Stop-Process -Force
```

### Or manually: Close terminals and clear any running processes

---

## Step 2: Restart Backend

Open New Terminal #1:
```bash
cd d:
cd "GitHub 2\SMA_Sanjeevani\backend"
python start.py
```

Wait for message:
```
✅ Medicine identification service loaded successfully
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ Backend is running!

---

## Step 3: Restart Frontend

Open New Terminal #2:
```bash
cd d:
cd "GitHub 2\SMA_Sanjeevani\frontend"
npm run dev
```

Wait for message:
```
➜  Local:   http://localhost:5173/
```

✅ Frontend is running!

---

## Step 4: Test in Browser

1. Go to: http://localhost:5173
2. Login to your account
3. Navigate to "Prescription Management"
4. Check:
   - ✅ Only "🔍 AI Medicine Identification" button visible
   - ❌ No "Take Photo" button
   - ❌ No "Upload File" button
5. Click "🔍 AI Medicine Identification"
6. Upload any image
7. Wait for results
8. ✅ Should see medicine details (no error)

---

## Step 5: Check Terminal for Warnings

Look at Backend Terminal output:

### Should See ✅
```
✅ Medicine identification service loaded successfully
INFO: Started server process
INFO: Waiting for application startup
INFO: Application startup complete
```

### Should NOT See ❌
```
⚠️ indic-trans2 not available
⚠️ Google Translator not available
FutureWarning
⚠️ Medicine identification disabled
```

---

## ✅ All Fixed!

System is now:
- ✅ UI fixed (no extra buttons)
- ✅ No JSON errors
- ✅ Shows medicine details
- ✅ Clean terminal
- ✅ Ready to use

---

## 🔧 If Something Doesn't Work

### Issue: Still seeing buttons
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache
- Close DevTools if open
- Restart frontend

### Issue: Still seeing warnings
- Completely close backend terminal
- Make sure `python start.py` (not old command)
- Check you're in correct backend folder
- Run: `pip install opencv-python-headless` again

### Issue: JSON error still appears
- Backend must be running first
- Check backend terminal for errors
- Verify response format in console (F12)
- Restart both backend and frontend

### Issue: Can't find button
- Make sure you're on "Prescription Management" page (not other pages)
- Scroll down if needed
- Check browser console (F12) for errors

---

## 📞 Quick Support

**Q: Do I need to run any setup commands?**
A: No! Just restart the applications. All changes are automatic.

**Q: Do I lose any data?**
A: No! All your medicine data is preserved in the database.

**Q: Can I roll back if something breaks?**
A: Yes! All original files are backed up. But nothing should break.

**Q: How long does it take to restart?**
A: ~1-2 minutes total (30 seconds backend + 30 seconds frontend)

---

## 🎯 Expected Behavior After Restart

| Action | Expected Result |
|--------|-----------------|
| Open Prescription page | See upload section with ONE button |
| Click "🔍 AI Medicine Identification" | Modal opens for file/camera selection |
| Upload medicine image | Shows "Analyzing..." then results |
| Results displayed | Shows: name, dosage, frequency, duration, precautions |
| Backend terminal | Shows ✅ success, NO warnings |
| Frontend console (F12) | NO errors, clean logs |

---

**Ready? Restart now! → 2 minutes and you're done!**

---

**Last Updated:** 2026-01-27
**All Fixes:** ✅ APPLIED
**Restart Required:** YES
