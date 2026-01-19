import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const slides = [
  { title: 'Scan your medicine — get instant voice instructions', bg: 'bg-gradient-to-r from-green-100 to-green-50' },
  { title: 'Set reminders & never miss a dose', bg: 'bg-gradient-to-r from-amber-100 to-amber-50' },
  { title: 'Upload prescriptions and find nearby doctors', bg: 'bg-gradient-to-r from-indigo-100 to-indigo-50' },
  { title: 'Stay updated with medical news and rural health programs', bg: 'bg-gradient-to-r from-pink-100 to-pink-50' },
];

function speak(text) {
  if (!window.speechSynthesis) return;
  const ut = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(ut);
}

const Home = () => {
  const carouselRef = useRef(null);
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [testLang, setTestLang] = useState('english');
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
      {/* Large Carousel (top) */}
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
                  <h2 className="text-2xl md:text-4xl font-extrabold text-green-900 mb-3">{s.title}</h2>
                  <p className="text-gray-700 mb-4">Short supporting line about the benefit of this feature.</p>
                  <div className="flex items-center justify-center gap-3">
                    <a href="/tutorial" className="bg-green-800 text-white px-4 py-2 rounded">Try Demo</a>
                    <button onClick={() => speak('Opening health assistant')} className="bg-amber-50 px-4 py-2 rounded">Ask Health Assistant</button>
                    <select aria-label="Choose language" className="border px-3 py-2 rounded" value={testLang} onChange={(e)=>setTestLang(e.target.value)}>
                      <option value="english">English</option>
                      <option value="hindi">Hindi</option>
                      <option value="telugu">Telugu</option>
                      <option value="tamil">Tamil</option>
                      <option value="bengali">Bengali</option>
                    </select>
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

      {/* Quick test panel for symptoms recommend endpoint */}
      <div className="container mx-auto px-6 mt-6">
        <section className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-3xl mb-2">💊 Check Your Symptoms</h3>
              <p className="text-lg mb-4">
                Get instant AI-powered health recommendations based on your symptoms. Our system will suggest safe medicines and home care tips.
              </p>
              <Link 
                to="/medicine-recommendation"
                className="inline-block bg-amber-400 hover:bg-amber-300 text-green-900 font-bold px-6 py-3 rounded-lg transition"
              >
                🏥 Open Medicine Recommendation →
              </Link>
            </div>
            <div className="hidden md:block text-6xl">💊</div>
          </div>
        </section>
      </div>

      {/* Intro / Hero below carousel */}
      <div className="container mx-auto px-6 mt-8">
        <section className="bg-white rounded-lg shadow p-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-green-900">Smart Medicine Access — Your Digital Health Companion in Every Language</h1>
          <p className="text-gray-700 mt-3 max-w-3xl mx-auto">Bringing healthcare closer to everyone. Scan, listen, and understand your medicines with ease — anytime, anywhere. Designed for rural and illiterate populations, powered by AI and voice technology.</p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="/tutorial" className="bg-green-800 text-white px-5 py-3 rounded">🔍 Try Demo</a>
            <button onClick={() => speak('Open health assistant')} className="bg-amber-50 px-5 py-3 rounded">💬 Ask Health Assistant</button>
            <select aria-label="Choose language" className="border px-3 py-3 rounded">
              <option>English</option>
              <option>Hindi</option>
              <option>Telugu</option>
              <option>Tamil</option>
              <option>Bengali</option>
            </select>
          </div>
        </section>
      </div>

      {/* Main content: Reminders, Mini Dashboard, News, Community */}
      <div className="container mx-auto px-6 mt-6">
        {/* Reminders placed below the intro per request */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold mb-3">Reminders & Alerts</h3>
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 rounded flex items-center justify-between">
              <div>
                <div className="font-medium">💊 Paracetamol</div>
                <div className="text-sm text-gray-600">Take 1 tablet at 8:00 AM (☀️ Morning)</div>
              </div>
              <div className="text-sm">🔊</div>
            </div>
            <div className="p-3 bg-amber-50 rounded flex items-center justify-between">
              <div>
                <div className="font-medium">💊 Vitamin D</div>
                <div className="text-sm text-gray-600">Take after lunch at 2:00 PM</div>
              </div>
              <div className="text-sm">🔊</div>
            </div>
            <button className="w-full mt-2 bg-green-800 text-white py-2 rounded">+ New Reminder</button>
          </div>
        </section>

        {/* Mini Dashboard below reminders */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold mb-3">Your Health, Simplified</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-green-50 rounded">👤 User<br /><strong>Welcome back</strong></div>
            <div className="p-3 bg-green-50 rounded">💊 Today<br /><strong>2 meds</strong></div>
            <div className="p-3 bg-green-50 rounded">⏰ Next reminder<br /><strong>8:00 AM</strong></div>
            <div className="p-3 bg-green-50 rounded">📈 Adherence<br /><strong>92%</strong></div>
          </div>
          <div className="mt-3">
            <button className="w-full bg-amber-50 py-2 rounded">Go to My Dashboard</button>
          </div>
        </section>

        {/* Latest Medical News & Tips (after reminders & dashboard) */}
        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Stay Aware, Stay Healthy</h2>
            <button onClick={() => speak('Viewing latest medical news.')} className="px-3 py-1 bg-amber-50 rounded">🔊 Read Aloud</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'New malaria tablet launched — safer for children.', src: 'WHO' },
              { title: 'COVID booster dose available at government hospitals.', src: 'AIIMS' },
              { title: '5 Healthy habits to reduce cholesterol naturally.', src: 'Healthline India' },
            ].map((n, i) => (
              <div key={n.title} className="bg-white border rounded p-4">
                <img src={`https://picsum.photos/seed/news${i}/400/240`} alt="news" className="h-28 w-full object-cover rounded mb-3" />
                <div className="font-semibold">{n.title}</div>
                <div className="text-sm text-gray-500 mt-2">From: {n.src}</div>
                <div className="mt-3 flex items-center justify-between">
                  <button onClick={() => speak(n.title)} className="px-3 py-1 bg-amber-50 rounded">� Read Aloud</button>
                  <button className="text-sm text-green-800">View More</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <button className="px-4 py-2 bg-green-800 text-white rounded">View More News</button>
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
