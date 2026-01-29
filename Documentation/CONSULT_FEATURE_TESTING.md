# Quick Testing Guide - Doctor Consultation Feature

## 🧪 Testing Checklist

### 1. **Navigation & Routing** ✓
- [ ] Click "🏥 Consult Doctor" link in Navbar (should redirect to /consult)
- [ ] Verify route is protected (redirects to login if not authenticated)
- [ ] Navigate back from any page to /consult route

### 2. **Consultation Form** ✓
- [ ] Fill in all required fields:
  - [ ] Symptoms (textarea)
  - [ ] Locality
  - [ ] City (dropdown)
  - [ ] State (dropdown)
  - [ ] Language to communicate (dropdown)
- [ ] Optional fields don't cause validation errors:
  - [ ] Hospital name (optional)
  - [ ] Specialization (optional)
  - [ ] Languages doctor knows (optional)
- [ ] Form validation:
  - [ ] Submit without symptoms → Shows error
  - [ ] Submit without locality → Shows error
  - [ ] Submit without city → Shows error
  - [ ] Submit without state → Shows error
  - [ ] Submit without language → Shows error

### 3. **Doctor Search & Recommendations** ✓
- [ ] Click "🔍 Find Doctors" button
- [ ] Loading state appears while searching
- [ ] Recommended doctors displayed in grid
- [ ] Each doctor card shows:
  - [ ] Doctor name
  - [ ] Rating (⭐ stars)
  - [ ] Specialization (gradient badge)
  - [ ] Hospital name
  - [ ] Location (locality, city)
  - [ ] Contact info (email, phone)
  - [ ] Languages known (with "+X more" for overflow)
  - [ ] Match score progress bar
- [ ] Grid is responsive:
  - [ ] Desktop: 3+ columns
  - [ ] Tablet: 2 columns
  - [ ] Mobile: 1 column
- [ ] "Back to Search" button works

### 4. **Doctor Selection & Booking Form** ✓
- [ ] Click "Book Appointment" button on doctor card
- [ ] Booking form appears with:
  - [ ] Doctor info card (sticky on desktop)
  - [ ] Doctor details displayed
  - [ ] Booking form with fields:
    - [ ] Patient Name (required)
    - [ ] Appointment Date (date picker)
    - [ ] Appointment Time (time picker)
    - [ ] Symptoms Brief (textarea)
    - [ ] Phone Number (required)
    - [ ] Email (required)
    - [ ] Additional Notes (optional)
- [ ] Form validation:
  - [ ] Submit with empty required fields → Shows error
  - [ ] Submit with invalid email → Shows error
  - [ ] Submit with valid data → Booking success

### 5. **Appointment Confirmation** ✓
- [ ] After booking:
  - [ ] Success message appears
  - [ ] TTS announcement plays (if unmuted)
  - [ ] Form resets
  - [ ] Redirects back to form step
- [ ] Appointment saved to localStorage

### 6. **Dashboard - Appointments** ✓
- [ ] Home page shows "Appointments" section (if logged in)
- [ ] Booked appointments display as cards showing:
  - [ ] Status badge (Urgent/Soon/Upcoming)
  - [ ] Doctor name
  - [ ] Specialization
  - [ ] Hospital
  - [ ] Date and time
  - [ ] Contact info
- [ ] Action buttons work:
  - [ ] Reschedule button opens date picker
  - [ ] Cancel button removes appointment
  - [ ] Changes persist in localStorage

### 7. **Dashboard - Reminders** ✓
- [ ] Reminders section shows:
  - [ ] Appointment-based reminders
  - [ ] Days until appointment
  - [ ] Status indicators (Urgent/Soon/Normal)
  - [ ] Color-coded list items
- [ ] Urgent reminders (≤1 day away) highlighted in red
- [ ] Upcoming reminders (2-3 days) in yellow

### 8. **TTS Integration** ✓
- [ ] Mute button in header:
  - [ ] Shows "🔊 Mute" when unmuted
  - [ ] Shows "🔇 Unmute" when muted
  - [ ] Changes background color when clicked
- [ ] Audio feedback:
  - [ ] Doctor search completion → "Found X doctors"
  - [ ] Doctor selection → "Selected [Doctor Name]"
  - [ ] Appointment booking → "Appointment booked successfully"
  - [ ] All TTS respects mute status

### 9. **Responsive Design** ✓
- [ ] **Desktop (1920px)**:
  - [ ] 3-column grid for doctors
  - [ ] Sidebar sticky for doctor info
  - [ ] All elements visible without scrolling
- [ ] **Tablet (768px)**:
  - [ ] 2-column grid for doctors
  - [ ] Booking form full width
  - [ ] Proper spacing maintained
- [ ] **Mobile (375px)**:
  - [ ] 1-column layout
  - [ ] Form inputs full width
  - [ ] Buttons full width
  - [ ] No horizontal scrolling
  - [ ] Touch-friendly button sizes

### 10. **Data Persistence** ✓
- [ ] Book multiple appointments
- [ ] Close browser tab/window
- [ ] Reopen website
- [ ] Appointments still visible in dashboard
- [ ] Can manage booked appointments

### 11. **Form Interactions** ✓
- [ ] Dropdown selections work:
  - [ ] City dropdown shows all 8 cities
  - [ ] State dropdown shows all 7 states
  - [ ] Language dropdown shows 9 languages
  - [ ] Specialization shows 10 specializations
- [ ] Multi-select language checkboxes:
  - [ ] Can select multiple languages
  - [ ] Selections persist
  - [ ] Can deselect languages

### 12. **Error Handling** ✓
- [ ] Network error during search → Shows alert
- [ ] Network error during booking → Shows alert
- [ ] Invalid date selection → Form validation
- [ ] Empty search results → "No doctors found" message

### 13. **Home Page Integration** ✓
- **Authenticated View**:
  - [ ] Welcome message shows username
  - [ ] "📅 Book New Appointment" button works
  - [ ] Appointments section loads
  - [ ] Reminders section loads
- **Non-Authenticated View**:
  - [ ] Features overview cards visible
  - [ ] "Login to Continue" CTA visible
  - [ ] "Check Symptoms" section visible

### 14. **Browser Compatibility** ✓
- [ ] Test on Chrome/Edge
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Mobile browsers (iOS Safari, Chrome Android)

---

## 🧑‍💻 Manual Testing Steps

### Test Scenario 1: Complete Booking Flow
1. Login to application
2. Click "Consult Doctor" in navbar
3. Fill form:
   - Symptoms: "Chest pain and shortness of breath"
   - Locality: "Jubilee Hills"
   - City: "Hyderabad"
   - State: "Telangana"
   - Language: "English"
   - Specialization: "Cardiology"
4. Click "Find Doctors"
5. Select first doctor
6. Fill booking form:
   - Patient Name: "John Doe"
   - Date: [Select any future date]
   - Time: "10:00"
   - Symptoms: "Chest pain"
   - Phone: "9999999999"
   - Email: "john@example.com"
7. Click "Confirm Appointment"
8. Verify success message
9. Go to home page
10. Check "Appointments" section shows booked appointment

### Test Scenario 2: Doctor Search with Filters
1. Consult page → Form
2. Try different specializations:
   - Cardiology
   - General Medicine
   - Dermatology
3. Verify different doctors appear for each
4. Check match scores change based on filters

### Test Scenario 3: Appointment Management
1. Book appointment
2. Click "Reschedule" button
3. Enter new date
4. Verify appointment updated
5. Return to home page
6. Check date changed in dashboard

### Test Scenario 4: Mobile Responsiveness
1. Open browser DevTools
2. Set to iPhone 12/iPad view
3. Navigate through entire flow
4. Verify no horizontal scrolling
5. Check all buttons/inputs are touch-friendly
6. Test form submission on mobile

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find doctors" | Check if `/api/doctors/search` endpoint is running |
| Appointments don't persist | Check if localStorage is enabled in browser |
| TTS not playing | Check if browser allows audio, unmute button state |
| Form not validating | Check browser console for JS errors |
| Layout broken on mobile | Check CSS media queries in ConsultPage.css |
| Doctor info card overlaps | Check sticky positioning in AppointmentBooking.jsx |
| Mute button doesn't work | Verify TTS utility is imported correctly |

---

## ✅ Testing Sign-Off

After completing all tests, verify:
- [ ] All form validations working
- [ ] Doctor search returns results
- [ ] Appointments persist in localStorage
- [ ] Dashboard shows real data
- [ ] Mobile layout responsive
- [ ] TTS feedback working
- [ ] Navigation smooth
- [ ] No console errors
- [ ] All buttons clickable
- [ ] Data updates in real-time

---

## 📊 Performance Testing

- [ ] Form loads in <1s
- [ ] Doctor search results in <2s
- [ ] Booking confirmation in <1s
- [ ] Dashboard loads in <1s
- [ ] No memory leaks (check DevTools)
- [ ] Smooth animations (60fps)

---

## 🔄 Regression Testing

Verify existing features still work:
- [ ] Medicine Recommendation page
- [ ] Prescription handling
- [ ] Reminders system
- [ ] Chat widget
- [ ] Home page carousel
- [ ] Navigation links
- [ ] Language switching
- [ ] Login/Logout
- [ ] Other dashboard features

---

**Testing Date**: _______________
**Tester Name**: _______________
**Status**: ☐ PASS  ☐ FAIL  ☐ PARTIAL
**Notes**: ___________________________________________________

