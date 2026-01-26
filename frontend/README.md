# Frontend - SMA Sanjeevani

React-based frontend application for the SMA Sanjeevani medical assistant.

## 📁 Directory Structure

```
frontend/
├── public/               # Static assets
│   ├── Sanjeevani Logo.png
│   └── vite.svg
│
├── src/
│   ├── components/       # React components
│   │   ├── AuthModal.jsx
│   │   ├── LoginSignup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── MedicineRecommendation.jsx
│   │   ├── ChatWidget.jsx
│   │   └── ...
│   │
│   ├── context/          # Context providers
│   │   └── AuthContext.jsx
│   │
│   ├── utils/            # Utility functions
│   │   ├── formatMedicalResponse.js
│   │   └── tts.js
│   │
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── *.css             # Stylesheets
│
├── package.json          # Dependencies
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS config
└── README.md            # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Base URL

The API base URL is configured in components. Default is `http://localhost:8000`.

To change it, update the `API_BASE` constant in:
- `src/components/AuthModal.jsx`
- `src/components/LoginSignup.jsx`
- Other components that make API calls

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## 🎨 Features

### Components

- **AuthModal** - Authentication modal (login/signup)
- **LoginSignup** - Standalone auth page
- **Dashboard** - User dashboard with health metrics
- **MedicineRecommendation** - Symptom-based medicine recommendations
- **ChatWidget** - Medical Q&A chatbot
- **PrescriptionHandling** - Prescription management
- **SymptomChecker** - Symptom analysis interface

### Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Custom CSS** - Component-specific styles
- Responsive design for mobile and desktop

## 🔧 Configuration

### API Configuration

Update API base URL in components:

```javascript
const API_BASE = 'http://localhost:8000';
```

### Environment Variables (Optional)

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## 📦 Dependencies

Key dependencies:
- `react` - UI library
- `react-router-dom` - Routing
- `vite` - Build tool
- `tailwindcss` - CSS framework
- `axios` or `fetch` - API calls

See `package.json` for complete list.

## 🧪 Testing

```bash
npm test
```

## 🏗️ Build

```bash
# Development build
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 📱 Features

- ✅ User authentication (login/signup)
- ✅ Symptom-based medicine recommendations
- ✅ Prescription management
- ✅ Medicine reminders
- ✅ Medical Q&A chatbot
- ✅ Health dashboard
- ✅ Responsive design
- ✅ Multi-language support

## 🎯 Component Overview

### Authentication
- `AuthModal.jsx` - Modal-based authentication
- `LoginSignup.jsx` - Full-page authentication
- `ProtectedRoute.jsx` - Route protection

### Features
- `Dashboard.jsx` - Main dashboard
- `MedicineRecommendation.jsx` - Medicine recommendations
- `ChatWidget.jsx` - Chat interface
- `PrescriptionHandling.jsx` - Prescription management

### UI Components
- `Navbar.jsx` - Navigation bar
- `LanguageSwitcher.jsx` - Language selection
- `SearchableInput.jsx` - Searchable input component

## 📚 Additional Resources

- [Backend API Documentation](../docs/api/)
- [Setup Guide](../docs/setup/)
- [Feature Documentation](../docs/features/)
