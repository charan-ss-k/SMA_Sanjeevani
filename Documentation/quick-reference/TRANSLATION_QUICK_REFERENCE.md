# Quick Reference: Using Translations in Components

## How to Use Translations in Your Components

### Basic Setup
```jsx
import React, { useContext } from 'react';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';

const MyComponent = () => {
  const { language } = useContext(LanguageContext);
  
  return (
    <div>
      <h1>{t('myKey', language)}</h1>
    </div>
  );
};
```

---

## Translation Keys Reference

### Reminders Page
**Feature Names:**
- `remindersManagementFeature` - "Reminders Management"
- `manageYourMedicineReminders` - "Manage Your Medicine Reminders"

**Notifications:**
- `timeToTake` - "Time to take"
- `dosage` - "Dosage"

**Timestamps:**
- `at` - "at" (separator between date and time)

**Status Labels:**
- `statusTaken` - "Taken"
- `statusSkipped` - "Skipped"
- `statusSnoozed` - "Snoozed"
- `statusPending` - "Pending"

**History:**
- `reminderHistory` - "Reminder History"
- `noReminderHistory` - "No reminder history yet"
- `allScheduledReminders` - "All Scheduled Reminders"
- `noRemindersScheduled` - "No reminders scheduled yet"
- `reminderSnoozedFor` - "Reminder snoozed for"
- `minutes` - "minutes"
- `reminderSkipped` - "Reminder skipped"

---

### Contact Page
**Page Headers:**
- `contactUs` - "Contact Us"
- `contactPage` - "Contact Page"
- `getInTouch` - "Get in Touch"
- `getInTouchDesc` - Description text

**Contact Methods:**
- `emailUs` - "Email Us"
- `callUs` - "Call Us"
- `visitUs` - "Visit Us"

**Office Info:**
- `officeAddress` - "Office Address"
- `officeHours` - "Office Hours"
- `mondayToFriday` - "Monday to Friday: 09:00 AM - 6:00 PM"
- `saturdaySunday` - "Saturday - Sunday: Closed"

**Contact Form:**
- `sendMessage` - "Send Message"
- `yourEmail` - "Your Email"
- `subject` - "Subject"
- `yourMessage` - "Your Message"
- `sendMessageButton` - "Send Message"
- `messageSent` - "Message Sent!"
- `thankYouMessage` - "Thank You" message

**Social Media:**
- `followUs` - "Follow Us"
- `socialMediaDesc` - Description
- `facebook` - "Facebook"
- `twitter` - "Twitter"
- `instagram` - "Instagram"
- `linkedin` - "LinkedIn"

**Emergency:**
- `emergencyContact` - "Emergency Contact"
- `emergencyHotline` - Hotline number
- `supportEmail` - Support email
- `supportPhone` - Support phone
- `headOffice` - Head office location

---

## Common Usage Patterns

### Text Content
```jsx
<p>{t('reminderHistory', language)}</p>
```

### Form Labels
```jsx
<label>{t('yourEmail', language)}</label>
```

### Button Text
```jsx
<button>{t('sendMessageButton', language)}</button>
```

### Notifications
```jsx
new Notification(`${t('timeToTake', language)} ${medicineName}!`, {
  body: `${t('dosage', language)}: ${dosageAmount}`,
  icon: '💊',
});
```

### Status Display
```jsx
<span>{t('statusTaken', language)}</span>
```

### Combining Text
```jsx
<p>
  {entry.date} {t('at', language)} {entry.time}
</p>
```

---

## Translation Structure

### Language Object Format
```javascript
export const translations = {
  english: {
    // Navigation
    home: 'Home',
    about: 'About',
    
    // Reminders page
    timeToTake: 'Time to take',
    statusTaken: 'Taken',
    
    // Contact page
    contactUs: 'Contact Us',
    facebook: 'Facebook',
  },
  
  hindi: {
    home: 'घर',
    about: 'के बारे में',
    timeToTake: 'लेने का समय',
    statusTaken: 'लिया गया',
    contactUs: 'हमसे संपर्क करें',
    facebook: 'फेसबुक',
  },
  // ... other languages
};

export function t(key, language = 'english') {
  return translations[language]?.[key] || translations.english[key] || key;
}
```

---

## Available Languages

| Code | Language | Status |
|------|----------|--------|
| `english` | English | ✅ |
| `hindi` | हिन्दी | ✅ |
| `telugu` | తెలుగు | ✅ |
| `tamil` | தமிழ் | ✅ |
| `kannada` | ಕನ್ನಡ | ✅ |
| `malayalam` | മലയാളം | ✅ |
| `bengali` | বাংলা | ✅ |
| `gujarati` | ગુજરાતી | ✅ |
| `marathi` | मराठी | ✅ |

---

## How Language Switching Works

```jsx
// In your context provider (main.jsx or App.jsx)
const [language, setLanguage] = useState('english');

<LanguageContext.Provider value={{ language, setLanguage }}>
  <YourApp />
</LanguageContext.Provider>

// In a language selector component
const LanguageSelector = () => {
  const { setLanguage } = useContext(LanguageContext);
  
  return (
    <select onChange={(e) => setLanguage(e.target.value)}>
      <option value="english">English</option>
      <option value="hindi">हिन्दी</option>
      <option value="telugu">తెలుగు</option>
      {/* ... other languages */}
    </select>
  );
};
```

---

## Troubleshooting

### Translation Key Not Found
If you see the key name appearing instead of translated text:
1. Check key spelling in component: `t('contactUs', language)`
2. Check if key exists in translations.js
3. Check if key is spelled identically in all languages
4. Verify language variable is being passed correctly

**Debug Tip:** The `t()` function returns the key name if translation doesn't exist, making it easy to spot missing keys.

### Browser Showing Wrong Language
1. Check if `language` is being passed to `t()` function
2. Verify `LanguageContext` is properly set up
3. Confirm `language` state is updating in context
4. Check browser console for errors

---

## Adding New Translations

### Step 1: Identify All Text to Translate
Review the component and identify all user-facing text.

### Step 2: Choose Key Names
Use camelCase, descriptive names:
- ✅ `remindersManagementFeature`
- ✅ `timeToTake`
- ❌ `rmf` (too cryptic)
- ❌ `reminder_management_feature` (wrong casing)

### Step 3: Add to English Section
```javascript
english: {
  newFeatureTitle: 'My New Feature',
  newFeatureDescription: 'This is my new feature',
}
```

### Step 4: Add to All 8 Other Languages
Copy the key and translate to each language.

### Step 5: Use in Component
```jsx
<h1>{t('newFeatureTitle', language)}</h1>
<p>{t('newFeatureDescription', language)}</p>
```

---

## Best Practices

✅ **DO:**
- Use descriptive key names
- Always pass the `language` variable
- Import both `t` and `LanguageContext`
- Add translations to ALL 9 languages
- Group related translations together
- Test in multiple languages

❌ **DON'T:**
- Hardcode text in components
- Use numbers or non-English characters in keys
- Forget to translate to all languages
- Mix translation and non-translation text
- Create inconsistent key naming
- Pass incorrect language parameter

---

## File Locations

- **Translations File:** `frontend/src/utils/translations.js`
- **Localized Components:**
  - `frontend/src/components/Reminders.jsx`
  - `frontend/src/components/Contact.jsx`
  - `frontend/src/components/Services.jsx`
  - `frontend/src/components/About.jsx`

---

## Support

For translation-related questions:
1. Check this quick reference
2. Review the translation completion summary
3. Examine existing components for patterns
4. Check the translations.js file for available keys

---

*Last Updated: 2024 | All 9 Languages Supported | Production Ready*
