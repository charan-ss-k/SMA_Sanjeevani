# 🚀 Quick Start Guide - Multi-Language Home Page

## For Users

### How to Change Language
1. Look at the **navbar** (top of page) - Find the green/blue button with a flag
2. Click it to open language dropdown
3. Select your language (9 options available)
4. Everything updates instantly!
5. Your choice is saved - it'll remember next time

### Available Languages
- 🇬🇧 English
- 🇮🇳 Telugu (తెలుగు)
- 🇮🇳 Hindi (हिन्दी)
- 🇮🇳 Marathi (मराठी)
- 🇮🇳 Bengali (বাংলা)
- 🇮🇳 Tamil (தமிழ்)
- 🇮🇳 Kannada (ಕನ್ನಡ)
- 🇮🇳 Malayalam (മലയാളം)
- 🇮🇳 Gujarati (ગુજરાતી)

---

## For Developers

### Quick Implementation Checklist

#### To add translation to a new page:

```jsx
// Step 1: Import and use context
import { useContext } from 'react'
import { LanguageContext } from '../main'
import { t } from '../utils/translations'

// Step 2: Get language from context
const { language } = useContext(LanguageContext)

// Step 3: Use t() function for all text
export function MyComponent() {
  return (
    <h1>{t('myKeyName', language)}</h1>
    <p>{t('myDescription', language)}</p>
    <button>{t('myButton', language)}</button>
  )
}
```

#### To add new translation keys:

```javascript
// File: frontend/src/utils/translations.js

export const translations = {
  english: {
    myKeyName: 'My Title',
    myDescription: 'My description text',
    myButton: 'Click Me',
  },
  telugu: {
    myKeyName: 'నా శీర్షిక',
    myDescription: 'నా వివరణ',
    myButton: 'నన్ను క్లిక్ చేయండి',
  },
  // ... repeat for all 9 languages
}
```

#### Example with placeholder:

```jsx
// Translation key: 'welcomeBackUser': 'Welcome back, {username}!'
const message = t('welcomeBackUser', language).replace('{username}', userName)

return <h1>{message}</h1>
```

---

### Files to Know

| File | Purpose |
|------|---------|
| `frontend/src/utils/translations.js` | All 200+ translation keys (9 languages) |
| `frontend/src/main.jsx` | LanguageContext provider setup |
| `frontend/src/components/Navbar.jsx` | Navigation & language selector |
| `frontend/src/components/LanguageSwitcher.jsx` | Language dropdown menu |
| `frontend/src/components/Home.jsx` | Home page (now multi-language) |

---

### Translation Function Usage

```javascript
import { t } from '../utils/translations'

// Basic usage
t('homeTitle', 'english')      // Returns English text
t('homeTitle', 'hindi')        // Returns Hindi text
t('homeTitle', 'tamil')        // Returns Tamil text

// In JSX component
const { language } = useContext(LanguageContext)
<h1>{t('homeTitle', language)}</h1>

// With fallback
<h1>{t('homeTitle', language) || 'Default Title'}</h1>

// With string replacement
<p>{t('welcome', language).replace('{name}', userName)}</p>
```

---

### Testing Multi-Language

```bash
# 1. Start dev server
cd frontend
npm run dev

# 2. Open browser console to debug
localStorage.getItem('selectedLanguage')  // See current language
localStorage.setItem('selectedLanguage', 'telugu')  // Change language

# 3. Manually test each language
# Click language selector → choose language → verify all text updates
```

---

### Adding a New Language

1. Add new language object to `translations.js`:
```javascript
gujarati: {
  home: 'ગૃહ',
  about: 'વિશે',
  // ... all 200+ keys
}
```

2. Add to LanguageSwitcher dropdown:
```jsx
const LANGUAGES = {
  // ... existing languages
  gujarati: { name: 'ગુજરાતી', flag: '🇮🇳', code: 'gu' },
}
```

3. Test with all pages

---

### Common Patterns

#### Translation with Context
```jsx
const { language } = useContext(LanguageContext)
return <div>{t('key', language)}</div>
```

#### Translation with Dynamic Value
```jsx
const greeting = t('welcome', language).replace('{name}', user.name)
```

#### Conditional Translation
```jsx
const text = isAuthenticated 
  ? t('welcomeBack', language) 
  : t('signUp', language)
```

#### Translation Array
```jsx
const items = ['home', 'about', 'services'].map(key => 
  t(key, language)
)
```

---

### What's Already Translated

✅ **Home Page Components:**
- Welcome message
- Health companion dashboard
- Book appointment button
- All carousel slides
- Services section
- How to use guide
- Symptom checker
- 200+ other keys

---

### Current Progress

| Page | Status |
|------|--------|
| Home | ✅ 100% |
| Navbar | ✅ Already working |
| Medicine Recommendation | ⏳ Next |
| Dashboard | ⏳ Next |
| Prescription | ⏳ Next |
| Consult Doctor | ⏳ Next |
| Services | ⏳ Next |
| About | ⏳ Next |
| Contact | ⏳ Next |

---

### Debugging Tips

**Problem: Text not translating**
```javascript
// Check if language is set
console.log(localStorage.getItem('selectedLanguage'))

// Check if key exists
console.log(t('myKey', 'hindi'))  // Should return translation or fallback
```

**Problem: Getting English even in another language**
```javascript
// Key might be missing for that language
// Add it to the language object in translations.js
```

**Problem: Emoji disappeared**
```javascript
// Don't remove emojis from translation keys
// Keep them as part of the string value
// e.g., "📅 Book Appointment" (good) ✅
// Not just "Book Appointment" ❌
```

---

### Performance Notes

- ⚡ Language switching is instant (no server call)
- 💾 Translations loaded once at startup
- 📦 Total translation file size: ~150KB
- 🎯 Minimal re-renders (only consuming components)
- ✅ No database queries needed

---

### Keyboard Shortcuts (Future)

You could add keyboard shortcuts like:
```javascript
// Alt + 1 = English
// Alt + 2 = Telugu
// Alt + 3 = Hindi
// etc.
```
*(Not implemented yet, just an idea)*

---

### Browser Compatibility

✅ Works on:
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers
- IE 11+ (localStorage support)

---

### Storage

**Language preference stored in:**
```javascript
localStorage.setItem('selectedLanguage', 'hindi')
```

**Retrieved on app start:**
```javascript
const savedLanguage = localStorage.getItem('selectedLanguage') || 'english'
```

---

### Next Phase Tasks

1. ✏️ Add keys for Medicine Recommendation page
2. 📋 Add keys for Dashboard page
3. 🏥 Add keys for Prescription page
4. 👨‍⚕️ Add keys for Consult Doctor page
5. 🛠️ Add keys for Services page
6. ℹ️ Add keys for About page
7. 📞 Add keys for Contact page

---

### Support

- 📖 Full docs: `MULTI_LANGUAGE_HOME_PAGE.md`
- 🎯 Implementation guide: `IMPLEMENTATION_SUMMARY.md`
- 📍 File location: `frontend/src/utils/translations.js`
- 🧪 Test page: Home page at `/`

---

## Last Updated
February 2026 - Multi-language home page implementation complete!

**Questions?** Check the detailed documentation files or debug in browser console.
