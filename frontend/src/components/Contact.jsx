import React, { useContext } from 'react';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';

const Contact = () => {
  const { language } = useContext(LanguageContext);
  
  return (
    <div style={{ paddingTop: '100px' }} className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-4">{t('contactUs', language)}</h1>
      <p className="text-gray-600">{t('getInTouch', language)}</p>
    </div>
  );
};

export default Contact;
