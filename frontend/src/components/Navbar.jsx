import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/Sanjeevani Logo.png';
import homeIcon from '../assets/home.png';
import capsuleIcon from '../assets/capsule.png';
import consultIcon from '../assets/consult.png';
import analyticsIcon from '../assets/analytics.png';
import reportIcon from '../assets/medical-report.png';
import serviceIcon from '../assets/customer-service.png';
import aboutIcon from '../assets/about.png';
import contactIcon from '../assets/contact.png';
import prescriptionIcon from '../assets/prescription.png';
import remindersIcon from '../assets/remainder_main.png';
import LanguageSwitcher from './LanguageSwitcher';
import { AuthContext } from '../main';
import AuthModal from './AuthModal';
import { t } from '../utils/translations';

const Navbar = ({ language, onLanguageChange }) => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const langContext = { language };

  const getLinkClass = (path) => {
    return location.pathname === path
      ? 'text-green-800 font-semibold border-b-2 border-green-600 px-4 py-2'
      : 'text-green-800 hover:text-green-900 hover:bg-amber-50 rounded-md px-4 py-2 transition-all duration-200';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Top thin dark green stripe like reference */}
      <div className="bg-green-800 h-3" />

      {/* Main header */}
      <div className="bg-amber-100 h-20 flex items-center shadow-sm">
        <div className="container mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <img src={logo} alt="Sanjeevani" className="h-16 w-16 object-contain" />
              <span className="text-green-800 text-2xl font-bold tracking-wide">{t('sanjeevani', language)}</span>
            </Link>
          </div>

          {/* Primary Navigation - Key Features Only */}
          <ul className="flex items-center space-x-2 text-base font-medium">
            <li>
              <Link to="/" className={`${getLinkClass('/')} inline-flex items-center`}>  {/* inline-flex keeps it flow with text */}
                <img src={homeIcon} alt="Home" className="h-6 w-6 mr-1 flex-shrink-0" />
                <span>{t('home', language)}</span>
              </Link>
            </li>
            <li>
              <Link to="/medicine-recommendation" className={`${getLinkClass('/medicine-recommendation')} inline-flex items-center`}>  {/* icon plus text */}
                <img src={capsuleIcon} alt="Medicine" className="h-5 w-5 mr-1 flex-shrink-0" />
                <span>{t('medicine', language)}</span>
              </Link>
            </li>
            <li>
              <Link to="/consult" className={`${getLinkClass('/consult')} inline-flex items-center`}>  {/* icon + text */}
                <img src={consultIcon} alt="Consult" className="h-5 w-5 mr-1 flex-shrink-0" />
                <span>{t('consult', language)}</span>
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className={`${getLinkClass('/dashboard')} inline-flex items-center`}>  {/* icon + text */}
                <img src={analyticsIcon} alt="Analysis" className="h-5 w-5 mr-1 flex-shrink-0" />
                <span>{t('analysis', language)}</span>
              </Link>
            </li>
            <li>
              <Link to="/prescription" className={`${getLinkClass('/prescription')} inline-flex items-center`}>  {/* icon + text */}
                <img src={prescriptionIcon} alt="Prescription" className="h-5 w-5 mr-1 flex-shrink-0" />
                <span>{t('prescription', language)}</span>
              </Link>
            </li>
            <li>
              <Link to="/reminders" className={`${getLinkClass('/reminders')} inline-flex items-center`}>  {/* icon + text */}
                <img src={remindersIcon} alt="Reminders" className="h-5 w-5 mr-1 flex-shrink-0" />
                <span>{t('reminders', language)}</span>
              </Link>
            </li>
            
            {/* More dropdown for secondary items */}
            <li className="relative">
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`${
                  ['/hospital-report', '/services', '/about', '/contact'].includes(location.pathname)
                    ? 'text-green-800 font-semibold'
                    : 'text-green-800 hover:text-green-900'
                } hover:bg-amber-50 rounded-md px-4 py-2 flex items-center gap-1 transition-all duration-200`}
              >
                ⋯ {t('more', language)}
                <span className="text-xs">▾</span>
              </button>
              
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <Link 
                    to="/hospital-report" 
                    className="block px-4 py-3 text-green-800 hover:bg-amber-50 transition-colors border-b border-gray-100 flex items-center"
                    onClick={() => setShowMoreMenu(false)}
                  >
                    <img src={reportIcon} alt="Report" className="h-5 w-5 mr-2 flex-shrink-0" /> {t('report', language)}
                  </Link>
                  <Link 
                    to="/services" 
                    className="block px-4 py-3 text-green-800 hover:bg-amber-50 transition-colors border-b border-gray-100 flex items-center"
                    onClick={() => setShowMoreMenu(false)}
                  >
                    <img src={serviceIcon} alt="Services" className="h-5 w-5 mr-2 flex-shrink-0" /> {t('services', language)}
                  </Link>
                  <Link 
                    to="/about" 
                    className="block px-4 py-3 text-green-800 hover:bg-amber-50 transition-colors border-b border-gray-100 flex items-center"
                    onClick={() => setShowMoreMenu(false)}
                  >
                    <img src={aboutIcon} alt="About" className="h-5 w-5 mr-2 flex-shrink-0" /> {t('about', language)}
                  </Link>
                  <Link 
                    to="/contact" 
                    className="block px-4 py-3 text-green-800 hover:bg-amber-50 transition-colors rounded-b-lg flex items-center"
                    onClick={() => setShowMoreMenu(false)}
                  >
                    <img src={contactIcon} alt="Contact" className="h-5 w-5 mr-2 flex-shrink-0" /> {t('contact', language)}
                  </Link>
                </div>
              )}
            </li>
          </ul>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher currentLanguage={language} onLanguageChange={onLanguageChange} />
            
            {isAuthenticated ? (
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="bg-green-700 text-white px-4 py-2 rounded-full hover:bg-green-800 transition-colors flex items-center gap-2"
                >
                  👤 {user?.username || t('user', language)}
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-40">
                    <div className="p-4 border-b border-gray-200">
                      <p className="font-semibold text-gray-800">{user?.full_name || user?.username}</p>
                      <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        window.location.href = '/';
                      }}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors font-medium"
                    >
                      🚪 {t('logout', language)}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-green-700 text-white px-4 py-2 rounded-full hover:bg-green-800 transition-colors"
              >
                {t('login', language)}
              </button>
            )}
          </div>

          {/* Auth Modal Import */}
          {showAuthModal && (
            <AuthModal 
              isOpen={showAuthModal} 
              onClose={() => setShowAuthModal(false)} 
            />
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;