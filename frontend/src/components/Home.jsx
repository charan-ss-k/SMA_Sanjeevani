import React, { useRef, useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { playTTS } from '../utils/tts';
import { LanguageContext, AuthContext } from '../main';
import { t } from '../utils/translations';
import calendarIcon from '../assets/calendar.png';
import capsuleIcon from '../assets/capsule.png';
import remainderIcon from '../assets/remainder.png';
import DashboardAppointments from './DashboardAppointments';
import DashboardAnalytics from './DashboardAnalytics';
import AppDownloadBanner from './AppDownloadBanner';
import LocalHospitalRoundedIcon from '@mui/icons-material/LocalHospitalRounded';
import WavingHandRoundedIcon from '@mui/icons-material/WavingHandRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import HealthAndSafetyRoundedIcon from '@mui/icons-material/HealthAndSafetyRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import RocketLaunchRoundedIcon from '@mui/icons-material/RocketLaunchRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';

const Home = () => {
  const { language } = useContext(LanguageContext);
  const { isAuthenticated, user } = useContext(AuthContext);
  
  const slides = [
    { titleKey: 'scanMedicine', bg: 'bg-gradient-to-br from-emerald-100 via-white to-teal-100' },
    { titleKey: 'setReminders', bg: 'bg-gradient-to-br from-amber-100 via-white to-orange-100' },
    { titleKey: 'uploadPrescriptions', bg: 'bg-gradient-to-br from-indigo-100 via-white to-sky-100' },
    { titleKey: 'stayUpdated', bg: 'bg-gradient-to-br from-rose-100 via-white to-fuchsia-100' },
  ];

  const carouselRef = useRef(null);
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const intervalRef = useRef(null);

  const stripLeadingIcon = (label = '') => label.replace(/^\s*[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D#*0-9]+\s*/u, '').trim();

  const stepCards = [
    { number: '1', bg: 'from-green-50 to-green-100', titleColor: 'text-green-900', titleKey: 'step1Title', descKey: 'step1Desc' },
    { number: '2', bg: 'from-blue-50 to-blue-100', titleColor: 'text-blue-900', titleKey: 'step2Title', descKey: 'step2Desc' },
    { number: '3', bg: 'from-amber-50 to-amber-100', titleColor: 'text-amber-900', titleKey: 'step3Title', descKey: 'step3Desc' },
    { number: '4', bg: 'from-purple-50 to-purple-100', titleColor: 'text-purple-900', titleKey: 'step4Title', descKey: 'step4Desc' },
  ];

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
    <div className="pt-24 md:pt-28 pb-12 min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_40%),linear-gradient(180deg,_#f8fffb_0%,_#effcf5_45%,_#f8fafc_100%)]">
      {/* Large Carousel (top) - Only show when NOT authenticated */}
      {!isAuthenticated && (
      <div className="w-full overflow-hidden px-4 sm:px-6">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-emerald-100 shadow-[0_20px_58px_rgba(16,185,129,0.16)]">
          <div 
            ref={carouselRef} 
            className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
            onMouseEnter={() => setIsPaused(true)}
          >
            {slides.map((s, i) => (
              <div 
                key={i} 
                className={`min-w-full snap-start ${s.bg} flex items-center justify-center min-h-[250px] md:min-h-[340px] bg-cover bg-center cursor-pointer px-4 py-8 md:py-10`}
                onClick={() => setIsPaused(true)}
              >
                <div className="max-w-4xl px-6 pb-10 md:pb-12 text-center">
                  <p className="inline-flex rounded-full border border-emerald-300 bg-white/80 px-4 py-1 text-sm font-semibold tracking-wide text-emerald-900">SMA Sanjeevani</p>
                  <h2 className="mt-4 text-2xl md:text-4xl font-black tracking-tight text-emerald-950 mb-3">{t(s.titleKey, language)}</h2>
                  <p className="text-slate-700 mb-5 text-base md:text-lg">{t('bringingHealthcare', language)}</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a href="/tutorial" className="rounded-xl bg-emerald-700 text-white px-6 py-3 font-semibold shadow hover:bg-emerald-800 transition inline-flex items-center gap-2">
                      <PlayArrowRoundedIcon fontSize="small" />
                      {stripLeadingIcon(t('tryDemo', language))}
                    </a>
                    <Link to="/chatbot" className="rounded-xl border border-emerald-200 bg-white px-6 py-3 font-semibold text-emerald-900 hover:bg-emerald-50 transition inline-flex items-center gap-2">
                      <SmartToyRoundedIcon fontSize="small" />
                      {stripLeadingIcon(t('askHealthAssistant', language))}
                    </Link>
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
              className="bg-white/90 p-2.5 rounded-full shadow-lg hover:bg-white"
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
              className="bg-white/90 p-2.5 rounded-full shadow-lg hover:bg-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {/* Pause/Play button */}
          <div className="absolute top-4 right-4 flex items-center z-10">
            <button 
              onClick={() => setIsPaused(!isPaused)} 
              className="bg-white/90 p-2.5 rounded-full shadow-lg hover:bg-white"
              aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
            >
              {isPaused ? <PlayArrowRoundedIcon fontSize="small" /> : <PauseRoundedIcon fontSize="small" />}
            </button>
          </div>
          {/* Carousel dots */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-10 pointer-events-none">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  const el = carouselRef.current;
                  if (el) {
                    el.scrollTo({ left: el.clientWidth * i, behavior: 'smooth' });
                  }
                }}
                className={`h-2.5 w-2.5 rounded-full ring-2 ring-white/70 shadow transition-transform hover:scale-125 pointer-events-auto ${
                  i === activeSlide ? 'bg-green-800' : 'bg-white/80'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Intro / Hero below carousel - Only show when NOT authenticated */}
      {!isAuthenticated && (
      <div className="container mx-auto px-6 mt-8">
        <section className="bg-white/90 rounded-3xl border border-emerald-100 shadow-[0_14px_40px_rgba(15,23,42,0.09)] p-8 text-center">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-emerald-950">{t('smartMedicineAccess', language)}</h1>
          <p className="text-slate-600 mt-3 max-w-3xl mx-auto text-lg">{t('bringingHealthcare', language)}</p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/tutorial" className="rounded-xl bg-emerald-700 text-white px-6 py-3 font-semibold hover:bg-emerald-800 transition inline-flex items-center gap-2">
              <PlayArrowRoundedIcon fontSize="small" />
              {stripLeadingIcon(t('tryDemo', language))}
            </a>
            <Link to="/chatbot" className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-3 font-semibold text-emerald-900 hover:bg-emerald-100 transition inline-flex items-center gap-2">
              <SmartToyRoundedIcon fontSize="small" />
              {stripLeadingIcon(t('askHealthAssistant', language))}
            </Link>
          </div>
        </section>
      </div>
      )}

      {/* Main content: Professional Dashboard with Appointments and Reminders */}
      <div className="container mx-auto px-6 mt-6">
        {isAuthenticated ? (
          <>
            {/* Welcome Section with User Info */}
            <section className="mt-4 md:mt-6 bg-gradient-to-r from-blue-50 via-white to-purple-50 rounded-3xl border border-blue-100 shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-blue-900 mb-2">
                    <span className="inline-flex items-center gap-2">
                      <WavingHandRoundedIcon className="text-amber-500" />
                      {t('welcomeBackUser', language).replace('{username}', user?.username || 'User')}
                    </span>
                  </h2>
                  <p className="text-gray-700">{t('yourHealthCompanionDashboard', language)}</p>
                </div>
                <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
                  <LocalHospitalRoundedIcon sx={{ fontSize: 40 }} />
                </div>
              </div>
            </section>

            {/* Appointments Section */}
            <section className="bg-white rounded-lg shadow p-6 mb-6">
              <DashboardAppointments language={language} />
              <div className="mt-6 text-center">
                <Link 
                  to="/consult"
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition"
                >
                  <img src={calendarIcon} alt="Calendar" className="h-5 w-5 mr-2 flex-shrink-0" />
                  {t('bookNewAppointment', language).replace('📅 ', '')}
                </Link>
              </div>
            </section>

            {/* Analytics Section */}
            <section className="bg-white rounded-lg shadow p-6 mb-6">
              <DashboardAnalytics />
            </section>
            
            {/* Notifications are mounted globally in main.jsx */}
          </>
        ) : (
          <>
            {/* Not Authenticated - Show Call to Action */}
            <section className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white rounded-3xl shadow-xl p-8 mb-6 border border-emerald-400/30">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-3xl mb-2">{t('getStartedWithYourHealthJourney', language)}</h3>
                  <p className="text-lg mb-4">
{t('getStartedDesc', language)}
                  </p>
                  <button onClick={() => window.location.href = '#'} className="inline-block bg-amber-300 hover:bg-amber-200 text-emerald-950 font-bold px-6 py-3 rounded-xl transition">
                    <span className="inline-flex items-center gap-2">
                      <LockRoundedIcon fontSize="small" />
                      {t('loginToContinue', language)}
                    </span>
                  </button>
                </div>
                <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur text-white">
                  <HealthAndSafetyRoundedIcon sx={{ fontSize: 40 }} />
                </div>
              </div>
            </section>

            {/* Quick Stats */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-sky-100 rounded-2xl border border-blue-100 shadow p-6 text-center hover:shadow-xl transition-shadow">
                <div className="mb-2 flex justify-center text-blue-700">
                  <LocalHospitalRoundedIcon sx={{ fontSize: 38 }} />
                </div>
                <h3 className="font-bold text-xl text-blue-900">{t('expertDoctors', language)}</h3>
                <p className="text-gray-700">{t('expertDoctorsDesc', language)}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-lime-100 rounded-2xl border border-emerald-100 shadow p-6 text-center hover:shadow-xl transition-shadow">
                <div className="text-4xl mb-2"><img src={calendarIcon} alt="Calendar" className="h-12 w-12 inline-block" /></div>
                <h3 className="font-bold text-xl text-green-900">{t('easyBooking', language)}</h3>
                <p className="text-gray-700">{t('easyBookingDesc', language)}</p>
              </div>
              <div className="bg-gradient-to-br from-violet-50 to-fuchsia-100 rounded-2xl border border-violet-100 shadow p-6 text-center hover:shadow-xl transition-shadow">
                <div className="mb-2 flex justify-center text-violet-700">
                  <InsightsRoundedIcon sx={{ fontSize: 38 }} />
                </div>
                <h3 className="font-bold text-xl text-purple-900">{t('analytics', language)}</h3>
                <p className="text-gray-700">{t('healthTrackDesc', language)}</p>
              </div>
            </section>

            {/* About Sanjeevani Section */}
            <section className="bg-gradient-to-r from-amber-50 to-green-50 rounded-2xl shadow-lg p-8 mb-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-green-900 mb-3">
                  <span className="inline-flex items-center gap-2">
                    <AutoAwesomeRoundedIcon className="text-amber-500" />
                    {t('aboutSanjeevani', language)}
                  </span>
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
                  <span className="inline-flex items-center gap-2">
                    <RocketLaunchRoundedIcon className="text-indigo-600" />
                    {t('howToUse', language)}
                  </span>
                </h2>
                <p className="text-gray-600 text-lg">{t('howToUseSteps', language)}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stepCards.map((step) => (
                  <div key={step.number} className={`bg-gradient-to-br ${step.bg} rounded-lg p-6 text-center hover:shadow-xl transition-shadow`}>
                    <div className="mb-3 flex justify-center">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-base font-black text-slate-800 shadow-sm">
                        {step.number}
                      </span>
                    </div>
                    <h3 className={`font-bold text-lg ${step.titleColor} mb-2`}>{t(step.titleKey, language)}</h3>
                    <p className="text-gray-700">{t(step.descKey, language)}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Features Section - Always Show */}
        <section className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white rounded-3xl shadow-xl p-8 mb-6 border border-emerald-400/30">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-3xl mb-2 flex items-center gap-2">
                <img src={capsuleIcon} alt="Medicine" className="h-8 w-8" />
                {t('checkSymptoms', language).replace('💊 ', '')}
              </h3>
              <p className="text-lg mb-4">
                {t('getInstantRecommendations', language)}
              </p>
              <Link 
                to="/medicine-recommendation"
                className="inline-block bg-amber-300 hover:bg-amber-200 text-emerald-950 font-bold px-6 py-3 rounded-xl transition"
              >
                {t('openMedicineRecommendation', language).replace('💊 ', '')}
              </Link>
            </div>
            <div className="hidden md:block">
              <img src={capsuleIcon} alt="Medicine" className="h-24 w-24" />
            </div>
          </div>
        </section>

        <AppDownloadBanner />
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default Home;
