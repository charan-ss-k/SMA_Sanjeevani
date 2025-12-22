import React from 'react';

const services = [
  { icon: '📷', title: 'Scan Prescription', desc: 'Capture or upload doctor’s prescription' },
  { icon: '💊', title: 'Identify Medicines', desc: 'Take picture of a pill/bottle and learn what it is' },
  { icon: '🗣️', title: 'AI Health Assistant', desc: 'Talk to chatbot for medicine or health info' },
  { icon: '🏥', title: 'Find Clinics & Pharmacies', desc: 'Locate healthcare services around' },
  { icon: '🕓', title: 'Medicine Reminders', desc: 'Set or manage dosage alerts' },
  { icon: '📈', title: 'Your Dashboard', desc: 'See usage, adherence, and analytics' },
];

function speak(text) {
  if (!window.speechSynthesis) return;
  const ut = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(ut);
}

const Services = () => {
  return (
    <div className="pt-28 pb-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6">
        <h1 className="text-3xl font-bold mb-4">Services We Provide</h1>
        <p className="text-gray-600 mb-6">Tap the speaker on any card to hear a brief description.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {services.map((s) => (
            <div key={s.title} className="bg-white rounded-lg shadow p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-4xl">{s.icon}</div>
                <button onClick={() => speak(s.title + '. ' + s.desc)} className="px-2 py-1 bg-amber-50 rounded">🔊</button>
              </div>
              <div className="font-semibold">{s.title}</div>
              <div className="text-sm text-gray-600">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
