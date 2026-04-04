import React, { useContext, useEffect, useState } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const langContext = { language };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setShowUserMenu(false);
    setShowMoreMenu(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const getLinkClass = (path) => {
    return location.pathname === path
      ? 'text-green-800 font-semibold border-b-2 border-green-600 px-3 py-2'
      : 'text-green-800 hover:text-green-900 hover:bg-amber-50 rounded-md px-3 py-2 transition-all duration-200';
  };

  const mobileLinkClass = (path) => {
    return location.pathname === path
      ? 'w-full rounded-lg bg-emerald-100 px-3 py-2 font-semibold text-emerald-900'
      : 'w-full rounded-lg px-3 py-2 text-green-800 hover:bg-amber-50';
  };

  const primaryNavLinks = [
    { to: '/', icon: homeIcon, label: t('home', language), alt: 'Home' },
    { to: '/medicine-recommendation', icon: capsuleIcon, label: t('medicine', language), alt: 'Medicine' },
    { to: '/consult', icon: consultIcon, label: t('consult', language), alt: 'Consult' },
    { to: '/dashboard', icon: analyticsIcon, label: t('analysis', language), alt: 'Analysis' },
    { to: '/prescription', icon: prescriptionIcon, label: t('prescription', language), alt: 'Prescription' },
    { to: '/reminders', icon: remindersIcon, label: t('reminders', language), alt: 'Reminders' }
  ];

  const secondaryNavLinks = [
    { to: '/hospital-report', icon: reportIcon, label: t('report', language), alt: 'Report' },
    { to: '/services', icon: serviceIcon, label: t('services', language), alt: 'Services' },
    { to: '/about', icon: aboutIcon, label: t('about', language), alt: 'About' },
    { to: '/contact', icon: contactIcon, label: t('contact', language), alt: 'Contact' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Top thin dark green stripe like reference */}
      <div className="bg-green-800 h-2 md:h-3" />

      {/* Main header */}
      <div className="relative bg-amber-100 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-3 md:h-20 md:px-8">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <img src={logo} alt="Sanjeevani" className="h-11 w-11 object-contain md:h-16 md:w-16" />
              <span className="text-green-800 text-lg font-bold tracking-wide sm:text-xl md:text-2xl">{t('sanjeevani', language)}</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <ul className="flex items-center space-x-1 text-base font-medium">
              {primaryNavLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className={`${getLinkClass(item.to)} inline-flex items-center`}>
                    <img src={item.icon} alt={item.alt} className="h-5 w-5 mr-1 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}

              <li className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`${
                    secondaryNavLinks.some((item) => item.to === location.pathname)
                      ? 'text-green-800 font-semibold'
                      : 'text-green-800 hover:text-green-900'
                  } hover:bg-amber-50 rounded-md px-3 py-2 flex items-center gap-1 transition-all duration-200`}
                >
                  ⋯ {t('more', language)}
                  <span className="text-xs">▾</span>
                </button>

                {showMoreMenu && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {secondaryNavLinks.map((item, index) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`px-4 py-3 text-green-800 hover:bg-amber-50 transition-colors flex items-center ${
                          index < secondaryNavLinks.length - 1 ? 'border-b border-gray-100' : 'rounded-b-lg'
                        }`}
                        onClick={() => setShowMoreMenu(false)}
                      >
                        <img src={item.icon} alt={item.alt} className="h-5 w-5 mr-2 shrink-0" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            </ul>
          )}

          {/* Desktop auth controls */}
          {!isMobile && (
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
          )}

          {/* Mobile controls */}
          {isMobile && (
            <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-900 shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
          )}

          {/* Mobile menu panel */}
          {isMobile && mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 border-t border-amber-200 bg-amber-50 shadow-lg md:hidden max-h-[calc(100vh-4.5rem)] overflow-y-auto">
              <div className="container mx-auto px-3 py-3">
                <div className="mb-3">
                  <LanguageSwitcher currentLanguage={language} onLanguageChange={onLanguageChange} />
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {primaryNavLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`${mobileLinkClass(item.to)} inline-flex items-center gap-2`}
                    >
                      <img src={item.icon} alt={item.alt} className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                  {secondaryNavLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`${mobileLinkClass(item.to)} inline-flex items-center gap-2`}
                    >
                      <img src={item.icon} alt={item.alt} className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>

                <div className="mt-3 border-t border-amber-200 pt-3">
                  {isAuthenticated ? (
                    <>
                      <div className="mb-2 rounded-lg bg-white px-3 py-2 shadow-sm">
                        <p className="font-semibold text-gray-800">{user?.full_name || user?.username}</p>
                        <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                          window.location.href = '/';
                        }}
                        className="w-full rounded-lg bg-red-50 px-3 py-2 text-left font-medium text-red-600"
                      >
                        🚪 {t('logout', language)}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setShowAuthModal(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full rounded-lg bg-green-700 px-3 py-2 font-semibold text-white"
                    >
                      {t('login', language)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

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