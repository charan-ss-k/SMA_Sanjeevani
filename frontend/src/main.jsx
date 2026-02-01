import { StrictMode, useState, useEffect, createContext } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './main.css';
import App from './App.jsx';
import Navbar from './components/Navbar.jsx';
import Home from './components/Home.jsx';
import About from './components/About.jsx';
import Services from './components/Services.jsx';
import Contact from './components/Contact.jsx';
import PrescriptionHandling from './components/PrescriptionHandling.jsx';
import HospitalReportAnalyzer from './components/HospitalReportAnalyzer.jsx';
import RemindersEnhanced from './components/RemindersEnhanced.jsx';
import Dashboard from './components/Dashboard.jsx';
import Tutorial from './components/Tutorial.jsx';
import MedicineRecommendation from './components/MedicineRecommendation.jsx';
import ConsultPage from './components/ConsultPage.jsx';
import ChatWidget from './components/Chatwidget.jsx';
import AppointmentNotification from './components/AppointmentNotification.jsx';
import { AuthProvider, AuthContext } from './context/AuthContext.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

// Create Language Context
export const LanguageContext = createContext('english');
export { AuthContext };

// Language Provider Wrapper
function AppWrapper() {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('selectedLanguage') || 'english';
  });

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('selectedLanguage', newLanguage);
  };

  return (
    <AuthProvider>
      <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange }}>
        <Router>
          <Navbar language={language} onLanguageChange={handleLanguageChange} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/medicine-recommendation" element={<ProtectedRoute><MedicineRecommendation /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/services" element={<Services />} />
            <Route path="/prescription" element={<ProtectedRoute><PrescriptionHandling /></ProtectedRoute>} />
            <Route path="/hospital-report" element={<ProtectedRoute><HospitalReportAnalyzer /></ProtectedRoute>} />
            <Route path="/reminders" element={<ProtectedRoute><RemindersEnhanced /></ProtectedRoute>} />
            <Route path="/consult" element={<ProtectedRoute><ConsultPage /></ProtectedRoute>} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/tutorial" element={<Tutorial />} />
          </Routes>
          <ChatWidget />
          <AppointmentNotification />
        </Router>
      </LanguageContext.Provider>
    </AuthProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>
);