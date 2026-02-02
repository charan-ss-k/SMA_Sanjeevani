import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, LanguageContext } from '../main';
import { t } from '../utils/translations';

const API_BASE = window.__API_BASE__ || 'http://localhost:8000';

const DashboardAnalytics = () => {
  const { isAuthenticated, authToken } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  const [stats, setStats] = useState({
    totalReminders: 0,
    totalAppointments: 0,
    medicinesCount: 0,
    chatHistory: 0,
    todayReminders: 0,
    upcomingAppointments: 0
  });

  useEffect(() => {
    loadAnalytics();
    
    // Reload analytics every 30 seconds to keep data fresh
    const interval = setInterval(loadAnalytics, 30000);
    
    return () => clearInterval(interval);
  }, [authToken]);

  const loadAnalytics = async () => {
    try {
      console.log('🔄 Loading dashboard analytics...', { authToken: !!authToken });
      
      // Initialize counters
      let remindersCount = 0;
      let medicinesSet = new Set();
      let todayCount = 0;
      let totalAppointments = 0;
      let upcomingAppointments = 0;
      let qaCount = 0;
      
      // Load reminders from database
      try {
        console.log('📋 Fetching reminders from /api/reminders/');
        const remResponse = await fetch(`${API_BASE}/api/reminders/`, {
          headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
        console.log('📋 Reminders response status:', remResponse.status);
        
        if (remResponse.ok) {
          const reminders = await remResponse.json();
          console.log('📋 Reminders data:', reminders);
          remindersCount = reminders.length;
          
          // Count unique medicines
          reminders.forEach(r => medicinesSet.add(r.medicine_name));
          
          // Count today's reminders (all active reminders)
          todayCount = reminders.length;
        } else {
          console.error('Failed to fetch reminders:', remResponse.status, await remResponse.text());
        }
      } catch (error) {
        console.error('❌ Failed to load reminders:', error);
      }

      // Load appointments from database
      try {
        console.log('📅 Fetching appointments from /api/appointments/my-appointments');
        const aptResponse = await fetch(`${API_BASE}/api/appointments/my-appointments`, {
          headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
        console.log('📅 Appointments response status:', aptResponse.status);
        
        if (aptResponse.ok) {
          const aptData = await aptResponse.json();
          console.log('📅 Appointments data:', aptData);
          
          if (aptData.success && aptData.appointments) {
            totalAppointments = aptData.total || aptData.appointments.length;
            
            // Count upcoming appointments (future dates)
            const now = new Date();
            upcomingAppointments = aptData.appointments.filter(apt => {
              const aptDate = new Date(apt.appointment_date);
              return aptDate >= now;
            }).length;
          } else if (Array.isArray(aptData)) {
            // Handle array response
            totalAppointments = aptData.length;
            const now = new Date();
            upcomingAppointments = aptData.filter(apt => {
              const aptDate = new Date(apt.appointment_date);
              return aptDate >= now;
            }).length;
          }
        } else {
          console.error('Failed to fetch appointments:', aptResponse.status, await aptResponse.text());
        }
      } catch (error) {
        console.error('❌ Failed to load appointments:', error);
      }

      // Load QA history from database
      try {
        console.log('💬 Fetching QA history from /api/qa-history/');
        const qaResponse = await fetch(`${API_BASE}/api/qa-history/?limit=50`, {
          headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
        });
        console.log('💬 QA history response status:', qaResponse.status);
        
        if (qaResponse.ok) {
          const qaHistory = await qaResponse.json();
          console.log('💬 QA history data:', qaHistory);
          qaCount = Array.isArray(qaHistory) ? qaHistory.length : 0;
        } else {
          console.error('Failed to fetch QA history:', qaResponse.status, await qaResponse.text());
        }
      } catch (error) {
        console.error('❌ Failed to load QA history:', error);
      }

      // Update state with database data
      const newStats = {
        totalReminders: remindersCount,
        medicinesCount: medicinesSet.size,
        chatHistory: qaCount,
        todayReminders: todayCount,
        totalAppointments: totalAppointments,
        upcomingAppointments: upcomingAppointments
      };
      
      console.log('✅ Dashboard Analytics loaded:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('❌ Failed to load analytics:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
        <span>📊</span>
        <span>{t('healthDashboard', language)}</span>
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {/* Medicines Count */}
        <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-4xl mb-2">💊</div>
          <div className="text-3xl font-bold text-green-700">{stats.medicinesCount}</div>
          <div className="text-sm text-gray-600 mt-1">{t('medicines', language)}</div>
        </div>

        {/* Today's Reminders */}
        <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-4xl mb-2">⏰</div>
          <div className="text-3xl font-bold text-orange-700">{stats.todayReminders}</div>
          <div className="text-sm text-gray-600 mt-1">{t('remindersToday', language)}</div>
        </div>

        {/* Appointments */}
        <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-4xl mb-2">📅</div>
          <div className="text-3xl font-bold text-blue-700">{stats.upcomingAppointments}</div>
          <div className="text-sm text-gray-600 mt-1">{t('upcomingAppointments', language)}</div>
        </div>

        {/* Chat History */}
        <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-4xl mb-2">💬</div>
          <div className="text-3xl font-bold text-purple-700">{stats.chatHistory}</div>
          <div className="text-sm text-gray-600 mt-1">{t('chatHistory', language)}</div>
        </div>

        {/* Total Reminders */}
        <div className="bg-gradient-to-br from-pink-100 to-pink-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-4xl mb-2">🔔</div>
          <div className="text-3xl font-bold text-pink-700">{stats.totalReminders}</div>
          <div className="text-sm text-gray-600 mt-1">{t('totalReminders', language)}</div>
        </div>

        {/* Total Appointments */}
        <div className="bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-4xl mb-2">🏥</div>
          <div className="text-3xl font-bold text-indigo-700">{stats.totalAppointments}</div>
          <div className="text-sm text-gray-600 mt-1">{t('totalAppointments', language)}</div>
        </div>
      </div>

      {/* Quick Activity Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border-l-4 border-green-500">
        <h3 className="font-bold text-lg text-gray-800 mb-2">✨ {t('quickSummary', language)}</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>• {t('youHave', language)} <span className="font-bold text-green-600">{stats.medicinesCount}</span> {t('activeMedicines', language)}</p>
          <p>• {t('youHave', language)} <span className="font-bold text-orange-600">{stats.todayReminders}</span> {t('remindersSet', language)}</p>
          <p>• {t('youHave', language)} <span className="font-bold text-blue-600">{stats.upcomingAppointments}</span> {t('upcomingAppointmentsText', language)}</p>
          {stats.chatHistory > 0 && (
            <p>• {t('youHaveAsked', language)} <span className="font-bold text-purple-600">{stats.chatHistory}</span> {t('healthQuestions', language)}</p>
          )}
        </div>
      </div>

      {/* Health Tip */}
      <div className="mt-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-4">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <span>💡</span>
          <span>{t('healthTip', language)}</span>
        </h3>
        <p className="text-sm">{t('stayConsistentWithMedication', language)}</p>
      </div>
    </div>
  );
};

export default DashboardAnalytics;
