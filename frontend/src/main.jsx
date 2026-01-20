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
import Dashboard from './components/Dashboard.jsx';
import Tutorial from './components/Tutorial.jsx';
import MedicineRecommendation from './components/MedicineRecommendation.jsx';
import ChatWidget from './components/Chatwidget.jsx';

// Create Language Context
export const LanguageContext = createContext('english');

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
    <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange }}>
      <Router>
        <Navbar language={language} onLanguageChange={handleLanguageChange} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/medicine-recommendation" element={<MedicineRecommendation />} />
          <Route path="/about" element={<About />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/services" element={<Services />} />
          <Route path="/prescription" element={<PrescriptionHandling />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/tutorial" element={<Tutorial />} />
        </Routes>
        <ChatWidget />
      </Router>
    </LanguageContext.Provider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>
);