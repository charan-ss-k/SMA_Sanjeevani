import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/Sanjeevani Logo.png';
import LanguageSwitcher from './LanguageSwitcher';
import { AuthContext } from '../main';
import AuthModal from './AuthModal';

const Navbar = ({ language, onLanguageChange }) => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getLinkClass = (path) => {
    return location.pathname === path
      ? 'text-green-800 border-b-2 border-green-500 px-3 py-2'
      : 'text-green-800 border-b-2 border-transparent hover:bg-amber-50 rounded-md px-3 py-2';
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Top thin dark green stripe like reference */}
      <div className="bg-green-800 h-3" />

      {/* Main header */}
      <div className="bg-amber-100 h-20 flex items-center">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Sanjeevani" className="h-20 w-20 object-contain" />
              <span className="text-green-800 text-3xl font-bold">Sanjeevani</span>
            </Link>
          </div>

          <ul className="flex items-center space-x-6 text-lg">
            <li>
              <Link to="/" className={getLinkClass('/')}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/medicine-recommendation" className={getLinkClass('/medicine-recommendation')}>
                💊 Medicine
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                📊 Dashboard
              </Link>
            </li>
            <li>
              <Link to="/prescription" className={getLinkClass('/prescription')}>
                Prescription
              </Link>
            </li>
            <li>
              <Link to="/services" className={getLinkClass('/services')}>
                Services
              </Link>
            </li>
            <li>
              <Link to="/about" className={getLinkClass('/about')}>
                About
              </Link>
            </li>
            <li>
              <Link to="/contact" className={getLinkClass('/contact')}>
                Contact
              </Link>
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
                  👤 {user?.username || 'User'}
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-40">
                    <div className="p-4 border-b border-gray-200">
                      <p className="font-semibold text-gray-800">{user?.full_name || user?.username}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        window.location.href = '/';
                      }}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors font-medium"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setShowAuthModal(true)}
                className="bg-green-700 text-white px-4 py-2 rounded-full hover:bg-green-800 transition-colors"
              >
                Login
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