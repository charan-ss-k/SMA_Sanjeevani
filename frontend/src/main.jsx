import { StrictMode } from 'react';
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
import ChatWidget from './components/Chatwidget.jsx';
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/services" element={<Services />} />
        <Route path="/prescription" element={<PrescriptionHandling />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/tutorial" element={<Tutorial />} />
      </Routes>
      <ChatWidget />
    </Router>
  </StrictMode>
);