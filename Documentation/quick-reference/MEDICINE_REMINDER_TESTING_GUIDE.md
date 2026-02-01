# Medicine Reminder Feature - Quick Test Guide

## Prerequisites
- Backend server running on http://localhost:5000
- Frontend running on http://localhost:5173
- PostgreSQL database connected
- User logged in with valid authentication

## Test Scenarios

### ✅ Test 1: Add Medicine with Reminders

**Steps**:
1. Navigate to Reminders page (`/reminders`)
2. Verify "Your Medicines" section appears at top
3. Click "+ Add Medicine" button
4. Fill form:
   - **Medicine Name**: Paracetamol
   - **Dosage**: 500mg
   - **Frequency**: Twice Daily
   - **Duration**: 7 days
   - **Quantity**: 14 tablets
   - **Notes**: Take after food
   - **Reminder Times**: 08:00, 20:00
5. Click "Save" button

**Expected Results**:
- ✅ Success message: "Medicine added successfully"
- ✅ TTS announces success (if unmuted)
- ✅ Form closes automatically
- ✅ Medicine appears in "Your Medicines" grid with:
  - Medicine icon 💊
  - Name: Paracetamol
  - Dosage: 500mg
  - Frequency: Twice Daily • 7 days
  - Two blue reminder badges: ⏰ 08:00, ⏰ 20:00
  - Delete button (🗑️)

### ✅ Test 2: Database Persistence

**Steps**:
1. Add medicine (see Test 1)
2. Refresh page (F5)
3. Check if medicine still appears

**Expected Results**:
- ✅ Medicine persists after refresh
- ✅ All details intact (name, dosage, reminder times)
- ✅ Data fetched from `/api/prescriptions/` endpoint

### ✅ Test 3: Multiple Reminder Times

**Steps**:
1. Click "+ Add Medicine"
2. Fill basic info:
   - **Medicine Name**: Metformin
   - **Dosage**: 1000mg
   - **Frequency**: Thrice Daily
3. Set reminder times:
   - Click "+ Add" button to add more time slots
   - Set times: 07:00, 13:00, 21:00
4. Click "Save"

**Expected Results**:
- ✅ Medicine saved with 3 reminder times
- ✅ All 3 times display as badges
- ✅ "Remove" button appears for each time slot (except when only 1 remains)

### ✅ Test 4: Delete Medicine

**Steps**:
1. Add a test medicine
2. Click delete button (🗑️) on medicine card
3. Confirm deletion in dialog

**Expected Results**:
- ✅ Confirmation dialog: "Are you sure you want to delete this medicine?"
- ✅ Medicine removed from UI
- ✅ Success TTS: "Medicine deleted successfully"
- ✅ DELETE request to `/api/prescriptions/{id}` successful
- ✅ Medicine removed from database

### ✅ Test 5: Reminder Notification

**Steps**:
1. Add medicine with reminder time = current time + 1 minute
   - Example: If current time is 10:30, set reminder to 10:31
2. Grant browser notification permission when prompted
3. Wait for 1 minute

**Expected Results**:
- ✅ At 10:31, browser notification appears: "Time to Take Paracetamol!"
- ✅ Notification body: "Dosage: 500mg"
- ✅ TTS announcement plays (if unmuted)
- ✅ Red alert box appears at top of page
- ✅ "✓ Taken" button displayed in alert

### ✅ Test 6: Mark as Taken

**Steps**:
1. Trigger reminder (see Test 5)
2. Click "✓ Taken" button in red alert

**Expected Results**:
- ✅ Alert box disappears
- ✅ TTS: "Paracetamol marked as taken"
- ✅ Medicine appears in "Today's Intake History" section
- ✅ Entry added to "Reminder History" with status "taken"
- ✅ Stats updated:
  - Today's Reminders count increases
  - Taken count increases
  - Pending count decreases

### ✅ Test 7: Reminder Stats Dashboard

**Steps**:
1. Add multiple medicines with various reminder times
2. Mark some as taken
3. Check 4-card stats dashboard

**Expected Results**:
- ✅ **Today's Reminders** (Blue): Shows total reminder times for all medicines
- ✅ **Taken** (Green): Shows count of medicines taken today
- ✅ **Missed** (Red): Shows count of skipped reminders
- ✅ **Pending** (Amber): Shows count of active/upcoming reminders

### ✅ Test 8: Reminder History

**Steps**:
1. Trigger several reminders over time
2. Mark some as taken, skip others
3. Scroll to "Reminder History" section

**Expected Results**:
- ✅ All triggered reminders logged with:
  - Medicine name
  - Dosage
  - Date and time
  - Status badge (taken/skipped/pending)
- ✅ Color-coded entries:
  - Green = taken
  - Red = skipped
  - Blue = pending
- ✅ "Clear History" button functional

### ✅ Test 9: All Scheduled Reminders

**Steps**:
1. Add 3-4 medicines with reminder times
2. Scroll to "All Scheduled Reminders" section

**Expected Results**:
- ✅ Grid displays all medicines with reminder times
- ✅ Each card shows:
  - Medicine icon, name, dosage
  - All reminder time badges
- ✅ Only medicines WITH reminder times shown
- ✅ Empty state if no reminders: "No reminders scheduled yet"

### ✅ Test 10: Mute/Unmute

**Steps**:
1. Click "🔊 Mute" button in header
2. Trigger a reminder
3. Click "🔇 Unmute" button
4. Trigger another reminder

**Expected Results**:
- ✅ When muted:
  - Button shows "🔇 Unmute"
  - No TTS audio plays
  - Browser notification still appears
- ✅ When unmuted:
  - Button shows "🔊 Mute"
  - TTS audio plays for reminders
  - Notifications and audio both work

### ✅ Test 11: Multi-Language Support

**Steps**:
1. Change language in navbar (e.g., Hindi)
2. Navigate to Reminders page
3. Click "+ Add Medicine"

**Expected Results**:
- ✅ All UI text translates to Hindi:
  - "आपकी दवाएं" (Your Medicines)
  - "दवा जोड़ें" (Add Medicine)
  - Form labels in Hindi
- ✅ Frequency dropdown options translated
- ✅ Success/error messages in Hindi
- ✅ TTS speaks in Hindi language

### ✅ Test 12: Form Validation

**Steps**:
1. Click "+ Add Medicine"
2. Leave required fields empty
3. Try to save

**Expected Results**:
- ✅ Browser HTML5 validation triggers
- ✅ Required fields highlighted:
  - Medicine Name*
  - Dosage*
  - Frequency*
- ✅ Cannot save until required fields filled

### ✅ Test 13: Responsive Design

**Steps**:
1. Open Reminders page on:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)
2. Test "+ Add Medicine" form on each

**Expected Results**:
- ✅ Desktop: 3-column medicine grid
- ✅ Tablet: 2-column medicine grid
- ✅ Mobile: 1-column medicine grid (stacked)
- ✅ Form fields responsive (2-column on desktop, 1-column on mobile)
- ✅ All buttons accessible on small screens

### ✅ Test 14: Authentication & Authorization

**Steps**:
1. Log out
2. Try to access `/reminders`
3. Log back in as User A
4. Add medicine
5. Log out, log in as User B
6. Check Reminders page

**Expected Results**:
- ✅ Redirect to login if not authenticated
- ✅ User A sees only their medicines
- ✅ User B does NOT see User A's medicines
- ✅ RLS enforced (no cross-user data leaks)

### ✅ Test 15: Edge Cases

**Test 15a: Empty Reminder Times**
- Add medicine with empty reminder time
- Expected: Empty times filtered out, medicine saved

**Test 15b: Duplicate Medicines**
- Add same medicine twice
- Expected: Both entries saved independently (no uniqueness constraint)

**Test 15c: Long Medicine Names**
- Enter 100-character medicine name
- Expected: Truncated or wrapped in UI, full name in database

**Test 15d: Special Characters**
- Enter medicine name: "Paracetamol 500mg (Generic)"
- Expected: Saves correctly, no encoding issues

**Test 15e: 24-hour Time Format**
- Set reminder time: 23:59
- Expected: Reminder triggers at 11:59 PM

## Automation Test Script (Optional)

```javascript
// Browser console test script
async function testMedicineFlow() {
  console.log('🧪 Starting automated test...');
  
  // Test 1: Add medicine
  const addButton = document.querySelector('button:has-text("Add Medicine")');
  addButton.click();
  
  // Fill form
  document.querySelector('input[placeholder*="medicine name"]').value = 'Test Medicine';
  document.querySelector('input[placeholder*="dosage"]').value = '100mg';
  document.querySelector('select').value = 'Once Daily';
  
  // Save
  document.querySelector('button:has-text("Save")').click();
  
  await new Promise(r => setTimeout(r, 2000)); // Wait 2s
  
  // Verify medicine in list
  const medicineCard = document.querySelector('[class*="medicine"]');
  console.assert(medicineCard, '✅ Medicine card displayed');
  
  console.log('✅ All tests passed!');
}

// Run: testMedicineFlow();
```

## Bug Reporting Template

If you find a bug, report using this template:

```markdown
**Bug**: [Brief description]
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Browser**: [Chrome/Firefox/Safari]
**Console Errors**: [Copy any errors]
**Screenshots**: [Attach if relevant]
```

## Performance Benchmarks

**Target Metrics**:
- Page load: < 2 seconds
- Medicine add: < 500ms
- Medicine delete: < 300ms
- Reminder check: < 50ms (runs every 60s)
- Form render: < 100ms

**Monitoring**:
```javascript
// Measure add medicine performance
console.time('addMedicine');
await handleSaveMedicine();
console.timeEnd('addMedicine'); // Should be < 500ms
```

## Conclusion

Complete all tests to ensure the Medicine Reminder feature works as expected. Focus on:
- ✅ Core functionality (add/delete/display)
- ✅ Reminder triggering and notifications
- ✅ Database persistence and RLS
- ✅ Multi-language support
- ✅ Responsive design
- ✅ Edge cases and error handling

**Ready for Production**: After passing all 15 test scenarios.
