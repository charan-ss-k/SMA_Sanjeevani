import React, { useRef, useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { playTTS } from '../utils/tts';
import { LanguageContext, AuthContext } from '../main';
import { t } from '../utils/translations';
import DashboardAppointments from './DashboardAppointments';
import DashboardAnalytics from './DashboardAnalytics';
import ReminderNotification from './ReminderNotification';

const Home = () => {
  const { language } = useContext(LanguageContext);
  const { isAuthenticated, user } = useContext(AuthContext);
  
  const slides = [
    { titleKey: 'scanMedicine', bg: 'bg-gradient-to-r from-green-100 to-green-50' },
    { titleKey: 'setReminders', bg: 'bg-gradient-to-r from-amber-100 to-amber-50' },
    { titleKey: 'uploadPrescriptions', bg: 'bg-gradient-to-r from-indigo-100 to-indigo-50' },
    { titleKey: 'stayUpdated', bg: 'bg-gradient-to-r from-pink-100 to-pink-50' },
  ];

  const carouselRef = useRef(null);
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const intervalRef = useRef(null);

  // Function to update active slide based on scroll position
  const updateActiveSlide = () => {
    const el = carouselRef.current;
    if (el) {
      const index = Math.round(el.scrollLeft / el.clientWidth);
      setActiveSlide(index);
    }
  };

  const scrollCarousel = (dir = 'next') => {
    const el = carouselRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (dir === 'next') {
      // if at end, wrap to start
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: width, behavior: 'smooth' });
      }
    } else {
      if (el.scrollLeft <= 0) {
        el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: -width, behavior: 'smooth' });
      }
    }
  };

  // autoplay every 3 seconds and track scroll position
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    // Add scroll event listener
    el.addEventListener('scroll', updateActiveSlide);
    
    // Only set up interval if not paused
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        // advance one slide, or wrap
        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
        }
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      el.removeEventListener('scroll', updateActiveSlide);
    };
  }, [isPaused]); // Add isPaused as a dependency

  return (
    <div className="pt-16 pb-12 bg-gray-50 min-h-screen"> {/* reduced offset for fixed navbar */}
      {/* Large Carousel (top) - Only show when NOT authenticated */}
      {!isAuthenticated && (
      <div className="w-full overflow-hidden">
        <div className="relative">
          <div 
            ref={carouselRef} 
            className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
            onMouseEnter={() => setIsPaused(true)}
          >
            {slides.map((s, i) => (
              <div 
                key={i} 
                className={`min-w-full snap-start ${s.bg} flex items-center justify-center min-h-[280px] md:min-h-[420px] bg-cover bg-center cursor-pointer`}
                onClick={() => setIsPaused(true)}
              >
                <div className="max-w-4xl px-6 text-center">
                  <h2 className="text-2xl md:text-4xl font-extrabold text-green-900 mb-3">{t(s.titleKey, language)}</h2>
                  <p className="text-gray-700 mb-4">{t('bringingHealthcare', language)}</p>
                  <div className="flex items-center justify-center gap-3">
                    <a href="/tutorial" className="bg-green-800 text-white px-4 py-2 rounded">{t('tryDemo', language)}</a>
                    <Link to="/chatbot" className="bg-amber-50 px-4 py-2 rounded">{t('askHealthAssistant', language)}</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* carousel controls */}
          <div className="absolute inset-y-0 left-4 flex items-center">
            <button 
              onClick={() => {
                setIsPaused(true);
                scrollCarousel('prev');
              }} 
              className="bg-white/80 p-2 rounded-full shadow hover:bg-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="absolute inset-y-0 right-4 flex items-center">
            <button 
              onClick={() => {
                setIsPaused(true);
                scrollCarousel('next');
              }} 
              className="bg-white/80 p-2 rounded-full shadow hover:bg-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {/* Pause/Play button */}
          <div className="absolute top-4 right-4 flex items-center">
            <button 
              onClick={() => setIsPaused(!isPaused)} 
              className="bg-white/80 p-2 rounded-full shadow hover:bg-white"
              aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
            >
              {isPaused ? "▶" : "⏸"}
            </button>
          </div>
          {/* Carousel dots */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  const el = carouselRef.current;
                  if (el) {
                    el.scrollTo({ left: el.clientWidth * i, behavior: 'smooth' });
                  }
                }}
                className={`h-2 w-2 rounded-full shadow transition-transform hover:scale-125 ${
                  i === activeSlide ? 'bg-green-800' : 'bg-white/80'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Quick test panel for symptoms recommend endpoint - Only show when NOT authenticated */}
      {!isAuthenticated && (
      <div className="container mx-auto px-6 mt-6">
        <section className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-3xl mb-2">{t('checkSymptoms', language)}</h3>
              <p className="text-lg mb-4">
                {t('getInstantRecommendations', language)}
              </p>
              <Link 
                to="/medicine-recommendation"
                className="inline-block bg-amber-400 hover:bg-amber-300 text-green-900 font-bold px-6 py-3 rounded-lg transition"
              >
                {t('openMedicineRecommendation', language)}
              </Link>
            </div>
            <div className="hidden md:block text-6xl">💊</div>
          </div>
        </section>
      </div>
      )}

      {/* Intro / Hero below carousel - Only show when NOT authenticated */}
      {!isAuthenticated && (
      <div className="container mx-auto px-6 mt-8">
        <section className="bg-white rounded-lg shadow p-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-green-900">{t('smartMedicineAccess', language)}</h1>
          <p className="text-gray-700 mt-3 max-w-3xl mx-auto">{t('bringingHealthcare', language)}</p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/tutorial" className="bg-green-800 text-white px-5 py-3 rounded">{t('tryDemo', language)}</a>
            <Link to="/chatbot" className="bg-amber-50 px-5 py-3 rounded">{t('askHealthAssistant', language)}</Link>
          </div>
        </section>
      </div>
      )}

      {/* Main content: Professional Dashboard with Appointments and Reminders */}
      <div className="container mx-auto px-6 mt-6">
        {isAuthenticated ? (
          <>
            {/* Welcome Section with User Info */}
            <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-blue-900 mb-2">
                    👋 {t('welcomeBackUser', language).replace('{username}', user?.username || 'User')}
                  </h2>
                  <p className="text-gray-700">{t('yourHealthCompanionDashboard', language)}</p>
                </div>
                <div className="text-6xl hidden md:block">🏥</div>
              </div>
            </section>

            {/* Appointments Section */}
            <section className="bg-white rounded-lg shadow p-6 mb-6">
              <DashboardAppointments language={language} />
              <div className="mt-6 text-center">
                <Link 
                  to="/consult"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition"
                >
                  {t('bookNewAppointment', language)}
                </Link>
              </div>
            </section>

            {/* Analytics Section */}
            <section className="bg-white rounded-lg shadow p-6 mb-6">
              <DashboardAnalytics />
            </section>
            
            {/* Reminder Notification (Global) */}
            <ReminderNotification />
          </>
        ) : (
          <>
            {/* Not Authenticated - Show Call to Action */}
            <section className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl shadow-lg p-8 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-3xl mb-2">{t('getStartedWithYourHealthJourney', language)}</h3>
                  <p className="text-lg mb-4">
{t('getStartedDesc', language)}
                  </p>
                  <button onClick={() => window.location.href = '#'} className="inline-block bg-amber-400 hover:bg-amber-300 text-green-900 font-bold px-6 py-3 rounded-lg transition">
                    🔐 {t('loginToContinue', language)}
                  </button>
                </div>
                <div className="hidden md:block text-6xl">💚</div>
              </div>
            </section>

            {/* Quick Stats */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg shadow p-6 text-center hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-2">👨‍⚕️</div>
                <h3 className="font-bold text-xl text-blue-900">{t('expertDoctors', language)}</h3>
                <p className="text-gray-700">{t('expertDoctorsDesc', language)}</p>
              </div>
              <div className="bg-green-50 rounded-lg shadow p-6 text-center hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-2">📅</div>
                <h3 className="font-bold text-xl text-green-900">{t('easyBooking', language)}</h3>
                <p className="text-gray-700">{t('easyBookingDesc', language)}</p>
              </div>
              <div className="bg-purple-50 rounded-lg shadow p-6 text-center hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-2">📊</div>
                <h3 className="font-bold text-xl text-purple-900">{t('analytics', language)}</h3>
                <p className="text-gray-700">{t('healthTrackDesc', language)}</p>
              </div>
            </section>

            {/* About Sanjeevani Section */}
            <section className="bg-gradient-to-r from-amber-50 to-green-50 rounded-2xl shadow-lg p-8 mb-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-green-900 mb-3">
                  🌟 {t('aboutSanjeevani', language)}
                </h2>
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-xl font-semibold text-green-800 mb-3">{t('whatWeDo', language)}</h3>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    {t('whatWeDoDesc', language)}
                  </p>
                </div>
              </div>
            </section>

            {/* How to Use Section */}
            <section className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-green-900 mb-2">
                  🚀 {t('howToUse', language)}
                </h2>
                <p className="text-gray-600 text-lg">{t('howToUseSteps', language)}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center hover:shadow-xl transition-shadow">
                  <div className="text-5xl mb-3">1️⃣</div>
                  <h3 className="font-bold text-lg text-green-900 mb-2">{t('step1Title', language)}</h3>
                  <p className="text-gray-700">{t('step1Desc', language)}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center hover:shadow-xl transition-shadow">
                  <div className="text-5xl mb-3">2️⃣</div>
                  <h3 className="font-bold text-lg text-blue-900 mb-2">{t('step2Title', language)}</h3>
                  <p className="text-gray-700">{t('step2Desc', language)}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 text-center hover:shadow-xl transition-shadow">
                  <div className="text-5xl mb-3">3️⃣</div>
                  <h3 className="font-bold text-lg text-amber-900 mb-2">{t('step3Title', language)}</h3>
                  <p className="text-gray-700">{t('step3Desc', language)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 text-center hover:shadow-xl transition-shadow">
                  <div className="text-5xl mb-3">4️⃣</div>
                  <h3 className="font-bold text-lg text-purple-900 mb-2">{t('step4Title', language)}</h3>
                  <p className="text-gray-700">{t('step4Desc', language)}</p>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Features Section - Always Show */}
        <section className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-3xl mb-2">{t('checkSymptoms', language)}</h3>
              <p className="text-lg mb-4">
                {t('getInstantRecommendations', language)}
              </p>
              <Link 
                to="/medicine-recommendation"
                className="inline-block bg-amber-400 hover:bg-amber-300 text-green-900 font-bold px-6 py-3 rounded-lg transition"
              >
                {t('openMedicineRecommendation', language)}
              </Link>
            </div>
            <div className="hidden md:block text-6xl">💊</div>
          </div>
        </section>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default Home;
