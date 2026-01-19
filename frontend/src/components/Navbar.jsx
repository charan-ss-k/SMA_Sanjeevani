import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/Sanjeevani Logo.png';

const Navbar = () => {
  const location = useLocation();

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

          <div className="block">
            <button className="bg-green-700 text-white px-4 py-2 rounded-full">Login</button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;