# Appointment Filtering Fix - History vs Upcoming

## Problem
Appointments were appearing in history before their time completed and never appeared in upcoming.

## Root Cause
The backend stores appointments with:
- `appointment_date`: DateTime field (includes both date AND time combined)
- `appointment_time`: String field (HH:MM format for display purposes)

When an appointment is created, the backend combines the date and time strings into a single DateTime object and stores it in `appointment_date`.

However, the frontend was incorrectly handling this:
1. Parsing `appointment_date` as just a date (losing the time component)
2. Manually combining it with `appointment_time` string
3. This caused timezone issues and incorrect comparisons

## Solution

### Frontend Changes (ConsultDoctorScreen.js)

#### Before:
```javascript
const filteredUpcoming = upcomingResponse.appointments.filter(apt => {
  const aptDate = new Date(apt.appointment_date); // Only parsed date
  const [hours, minutes] = apt.appointment_time.split(':');
  aptDate.setHours(parseInt(hours), parseInt(minutes), 0, 0); // Manually added time
  return aptDate > now;
});
```

#### After:
```javascript
const filteredUpcoming = upcomingResponse.appointments.filter(apt => {
  const aptDateTime = new Date(apt.appointment_date); // Parse full ISO datetime directly
  return aptDateTime > now; // Direct comparison
});
```

### Key Changes:

1. **Upcoming Appointments Filter** (Line ~186-202)
   - Now parses `appointment_date` as full ISO datetime
   - Direct comparison without manual time combination
   - Added logging to track filtering

2. **History Appointments Filter** (Line ~178-195)
   - Shows cancelled/completed appointments regardless of time
   - For scheduled appointments, only shows if datetime has passed
   - Splits history correctly from upcoming

3. **Notification Scheduling** (Line ~527-533)
   - Removed manual date+time combination
   - Directly parses `appointment_date` as full datetime
   - Proper future check

## Data Flow

### Backend → Frontend:
```json
{
  "appointment_date": "2026-02-15T14:30:00",  // Full datetime (ISO format)
  "appointment_time": "14:30",                 // Display string only
  "status": "scheduled"
}
```

### Frontend Processing:
```javascript
// ✅ CORRECT: Parse appointment_date directly
const aptDateTime = new Date(appointment.appointment_date);

// ❌ WRONG: Don't manually combine date and time
const aptDate = new Date(appointment.appointment_date);
aptDate.setHours(...appointment.appointment_time.split(':'));
```

## Testing

To verify the fix works:

1. **Book an appointment for today, 5 minutes from now**
2. **Check Upcoming tab** - should appear there
3. **Wait for 6 minutes**
4. **Refresh/reopen app**
5. **Check Upcoming tab** - should be GONE
6. **Check History tab** - should appear there (if status still "scheduled")

### Test Script:
Run `python test_appointment_datetime.py` to:
- Verify backend datetime storage
- Check upcoming filtering logic
- Compare expected vs actual appointment placement

## Benefits

1. ✅ Appointments appear in upcoming ONLY if datetime hasn't passed
2. ✅ Appointments move to history AFTER their datetime passes
3. ✅ No timezone issues from manual time manipulation
4. ✅ Accurate reminder scheduling
5. ✅ Proper date/time display throughout app

## Files Modified

- `mobile/src/screens/consultations/ConsultDoctorScreen.js`
  - Lines 178-195: History filtering
  - Lines 186-202: Upcoming filtering with logging
  - Lines 527-533: Notification scheduling

## Notes

- The `appointment_time` field is still returned for display purposes (shows "14:30" to user)
- All logic should use `appointment_date` for comparisons and calculations
- Backend already filters correctly, frontend now matches this behavior
