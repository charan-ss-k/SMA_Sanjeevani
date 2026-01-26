import React, { useContext, useState } from 'react';
import { AuthContext } from '../main';
import { LanguageContext } from '../main';
import AuthModal from './AuthModal';
import { t } from '../utils/translations';

const FeatureLoginPrompt = ({ featureName = 'this feature' }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full animate-slideUp text-center">
          <div className="text-5xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">{t('loginRequired', language)}</h2>
          <p className="text-gray-600 mb-6">
            {t('pleaseLoginToAccess', language)} {featureName}. {t('signUpNowToStart', language)}
          </p>
          
          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all mb-3"
          >
            {t('signInCreateAccount', language)}
          </button>
          
          <p className="text-sm text-gray-500">
            {t('allHealthDataSecure', language)}
          </p>
        </div>
      </div>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default FeatureLoginPrompt;
