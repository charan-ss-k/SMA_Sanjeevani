import React from 'react';

const Tutorial = () => {
  return (
    <div className="pt-28 min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-4">Tutorial / Demo</h1>
        <p className="text-gray-600 mb-6">Step-by-step demo to help users learn how to use the app. (Placeholder)</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold">Step 1: Take a photo</h3>
            <p className="text-sm text-gray-600">Open camera and capture the prescription or medicine.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold">Step 2: Let AI scan</h3>
            <p className="text-sm text-gray-600">AI will extract medicine names and dosages.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold">Step 3: Listen</h3>
            <p className="text-sm text-gray-600">Use the speaker to hear instructions in your language.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold">Step 4: Set reminders</h3>
            <p className="text-sm text-gray-600">Create voice reminders for scheduled doses.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
