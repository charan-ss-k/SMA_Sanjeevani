import React, { useContext, useState } from 'react';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';

const Contact = () => {
  const { language } = useContext(LanguageContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: '📧',
      titleKey: 'emailUs',
      value: t('supportEmail', language),
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: '📞',
      titleKey: 'callUs',
      value: t('supportPhone', language),
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: '📍',
      titleKey: 'visitUs',
      value: t('headOffice', language),
      color: 'bg-purple-100 text-purple-600'
    },
  ];

  const socialLinks = [
    { icon: '📘', titleKey: 'facebook', color: 'hover:bg-blue-600' },
    { icon: '🐦', titleKey: 'twitter', color: 'hover:bg-blue-400' },
    { icon: '📷', titleKey: 'instagram', color: 'hover:bg-pink-600' },
    { icon: '💼', titleKey: 'linkedin', color: 'hover:bg-blue-700' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50" style={{ paddingTop: '100px' }}>
      <div className="container mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-green-900 mb-4">
            {t('contactUs', language)}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('getInTouchDesc', language)}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('contactInfo', language)}
              </h2>
              
              {contactInfo.map((info, index) => (
                <div key={index} className="mb-6 last:mb-0">
                  <div className={`inline-block p-3 rounded-lg ${info.color} mb-3`}>
                    <span className="text-2xl">{info.icon}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    {t(info.titleKey, language)}
                  </h3>
                  <p className="text-gray-600 text-sm break-words">
                    {info.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Office Hours */}
            <div className="bg-gradient-to-br from-green-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white">
              <div className="text-4xl mb-4">🕒</div>
              <h2 className="text-2xl font-bold mb-4">
                {t('officeHours', language)}
              </h2>
              <p className="mb-2">{t('mondayToFriday', language)}</p>
              <p>{t('saturdaySunday', language)}</p>
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-600 rounded-2xl shadow-lg p-8 text-white">
              <div className="text-4xl mb-4">🚨</div>
              <h2 className="text-2xl font-bold mb-2">
                {t('emergencyContact', language)}
              </h2>
              <p className="text-sm opacity-90">
                {t('emergencyHotline', language)}
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                {t('sendMessage', language)}
              </h2>

              {submitted ? (
                <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6">
                  <div className="flex items-center">
                    <span className="text-3xl mr-4">✅</span>
                    <div>
                      <h3 className="font-bold text-lg">{t('messageSent', language)}</h3>
                      <p>{t('thankYouMessage', language)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        {t('yourName', language)}
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder={t('yourName', language)}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        {t('yourEmail', language)}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder={t('yourEmail', language)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      {t('subject', language)}
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder={t('subject', language)}
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      {t('yourMessage', language)}
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="6"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                      placeholder={t('yourMessage', language)}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
                  >
                    {t('sendMessageButton', language)} 📤
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('followUs', language)}
          </h2>
          <p className="text-gray-600 mb-8">
            {t('socialMediaDesc', language)}
          </p>
          <div className="flex justify-center gap-4">
            {socialLinks.map((social, index) => (
              <button
                key={index}
                className={`bg-gray-200 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${social.color} transform hover:scale-110`}
                title={t(social.titleKey, language)}
              >
                {social.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
