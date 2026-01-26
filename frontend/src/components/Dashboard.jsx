import React, { useState, useEffect, useContext } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { AuthContext } from '../main';
import FeatureLoginPrompt from './FeatureLoginPrompt';

function speak(text) {
  if (!window.speechSynthesis) return;
  const ut = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(ut);
}

const Dashboard = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [searchHistory, setSearchHistory] = useState([]);
  const [stats, setStats] = useState({
    totalSearches: 0,
    mostCommonSymptoms: [],
    mostCommonConditions: [],
    recommendedMedicines: [],
    conditionFrequency: [],
  });

  useEffect(() => {
    // Load search history from localStorage
    const saved = localStorage.getItem('symptomSearchHistory');
    const history = saved ? JSON.parse(saved) : [];
    setSearchHistory(history);
    calculateStats(history);
  }, []);

  const calculateStats = (history) => {
    if (history.length === 0) {
      setStats({
        totalSearches: 0,
        mostCommonSymptoms: [],
        mostCommonConditions: [],
        recommendedMedicines: [],
        conditionFrequency: [],
      });
      return;
    }

    // Count symptoms
    const symptomCount = {};
    const conditionCount = {};
    const medicineCount = {};
    const conditionsData = {};

    history.forEach(entry => {
      // Count symptoms
      if (entry.input?.symptoms) {
        entry.input.symptoms.forEach(symptom => {
          symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
        });
      }

      // Count conditions
      if (entry.input?.existing_conditions) {
        entry.input.existing_conditions.forEach(condition => {
          conditionCount[condition] = (conditionCount[condition] || 0) + 1;
        });
      }

      // Count medicines and track condition frequency
      if (entry.result?.recommended_medicines) {
        entry.result.recommended_medicines.forEach(med => {
          medicineCount[med.name] = (medicineCount[med.name] || 0) + 1;
        });
      }

      if (entry.result?.predicted_condition) {
        const cond = entry.result.predicted_condition;
        conditionsData[cond] = (conditionsData[cond] || 0) + 1;
      }
    });

    // Convert to arrays and sort
    const topSymptoms = Object.entries(symptomCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const topConditions = Object.entries(conditionCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const topMedicines = Object.entries(medicineCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const conditionFreq = Object.entries(conditionsData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    setStats({
      totalSearches: history.length,
      mostCommonSymptoms: topSymptoms,
      mostCommonConditions: topConditions,
      recommendedMedicines: topMedicines,
      conditionFrequency: conditionFreq,
    });
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all search history?')) {
      localStorage.removeItem('symptomSearchHistory');
      setSearchHistory([]);
      setStats({
        totalSearches: 0,
        mostCommonSymptoms: [],
        mostCommonConditions: [],
        recommendedMedicines: [],
        conditionFrequency: [],
      });
      speak('Search history cleared');
    }
  };

  const colors = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444'];

  return (
    <>
      {!isAuthenticated && <FeatureLoginPrompt featureName="the dashboard" />}
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 pt-24 pb-10">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-green-800 mb-2">📊 Your Health Dashboard</h1>
          <p className="text-xl text-gray-700">Track your symptom searches, health trends, and recommendations</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">Total Searches</h3>
            <p className="text-4xl font-bold mt-2">{stats.totalSearches}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">Most Common Symptom</h3>
            <p className="text-2xl font-bold mt-2 capitalize">
              {stats.mostCommonSymptoms.length > 0 ? stats.mostCommonSymptoms[0].name : '—'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">Most Diagnosed</h3>
            <p className="text-2xl font-bold mt-2 capitalize">
              {stats.conditionFrequency.length > 0 ? stats.conditionFrequency[0].name : '—'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">Medicines Recommended</h3>
            <p className="text-3xl font-bold mt-2">{stats.recommendedMedicines.length}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Symptom Frequency */}
          {stats.mostCommonSymptoms.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Most Common Symptoms</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.mostCommonSymptoms}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" name="Frequency" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Condition Frequency - Pie Chart */}
          {stats.conditionFrequency.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🏥 Diagnosed Conditions</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.conditionFrequency}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.conditionFrequency.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Medicines */}
          {stats.recommendedMedicines.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">💊 Top Recommended Medicines</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={stats.recommendedMedicines}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 250, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={240} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Recommendations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Search History */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">📜 Recent Searches</h2>
            <button
              onClick={clearHistory}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              🗑️ Clear History
            </button>
          </div>

          {searchHistory.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg">No search history yet. Start by checking your symptoms!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Symptoms</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Age/Gender</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Predicted Condition</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {searchHistory.map((entry, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {entry.input?.symptoms?.slice(0, 3).map((s, i) => (
                            <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {s}
                            </span>
                          ))}
                          {entry.input?.symptoms?.length > 3 && (
                            <span className="text-gray-600 text-xs">+{entry.input.symptoms.length - 3} more</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {entry.input?.age}/{entry.input?.gender?.substring(0, 1).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-gray-700 capitalize font-medium">
                        {entry.result?.predicted_condition || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => speak(`${entry.result?.predicted_condition}: ${entry.result?.home_care_advice?.join(', ')}`)}
                          className="text-amber-600 hover:text-amber-800 font-semibold text-sm"
                        >
                          🔊 Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Health Insights */}
        {searchHistory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Common Conditions */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
              <h3 className="text-xl font-bold text-orange-900 mb-4">🏥 Your Condition History</h3>
              {stats.mostCommonConditions.length > 0 ? (
                <ul className="space-y-2">
                  {stats.mostCommonConditions.map((cond, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="text-gray-800 capitalize">{cond.name}</span>
                      <span className="bg-orange-200 text-orange-900 px-3 py-1 rounded-full text-sm font-semibold">
                        {cond.count}x
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700">No conditions recorded yet</p>
              )}
            </div>

            {/* Health Tips */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-lg p-6 border-l-4 border-green-500">
              <h3 className="text-xl font-bold text-green-900 mb-4">💡 Wellness Tips</h3>
              <ul className="space-y-2 text-gray-800">
                <li>✓ Stay hydrated and drink plenty of water</li>
                <li>✓ Get 7-8 hours of quality sleep</li>
                <li>✓ Exercise regularly (20-30 min daily)</li>
                <li>✓ Maintain a balanced diet</li>
                <li>✓ Wash hands frequently and maintain hygiene</li>
                <li>✓ Consult a doctor for persistent symptoms</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default Dashboard;
