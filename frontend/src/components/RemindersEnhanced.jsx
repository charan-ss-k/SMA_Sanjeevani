import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../main';
import { LanguageContext } from '../main';
import FeatureLoginPrompt from './FeatureLoginPrompt';
import { t } from '../utils/translations';
import { API_BASE } from '../config/apiBase';
import capsuleIcon from '../assets/capsule.png';
import AlarmIcon from '@mui/icons-material/Alarm';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import EventNoteIcon from '@mui/icons-material/EventNote';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PendingActionsIcon from '@mui/icons-material/PendingActions';

const RemindersEnhanced = () => {
  const { isAuthenticated, authToken } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  
  // Medicine Management State
  const [reminders, setReminders] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [medicineForm, setMedicineForm] = useState({
    name: '',
    dosage: '',
    frequency: 'Once Daily',
    duration: '',
    quantity: '',
    reminderTimes: [''],
    notes: ''
  });
  
  // Reminder State
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [takenMedicines, setTakenMedicines] = useState([]);
  const [reminderHistory, setReminderHistory] = useState([]);
  const canUseNotifications = false;

  const getNotificationPermission = () => {
    if (!canUseNotifications) return 'denied';
    try {
      return Notification.permission;
    } catch {
      return 'denied';
    }
  };

  const cleanMedicineLabel = (value) => (value || '').replace(/^\p{Extended_Pictographic}+\s*/u, '').trim();
  const dosageLabel = cleanMedicineLabel(t('dosage', language));

  // Fetch medicines from database
  useEffect(() => {
    if (isAuthenticated) {
      fetchReminders();
    }
  }, [isAuthenticated]);

  const buildMedicineGroups = (items) => {
    const grouped = new Map();
    items.forEach((item) => {
      const quantity = item.quantity || item.days?.quantity || '';
      const key = `${item.medicine_name}||${item.dosage}||${item.frequency}||${quantity}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          medicine_name: item.medicine_name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          quantity,
          reminder_times: [],
          reminder_ids: [],
        });
      }
      const entry = grouped.get(key);
      entry.reminder_times.push(item.reminder_time);
      entry.reminder_ids.push(item.id);
    });
    return Array.from(grouped.values());
  };

  const fetchReminders = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/reminders/`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReminders(data);
        setMedicines(buildMedicineGroups(data));
      }
    } catch (error) {
      console.error('Failed to fetch medicines:', error);
    }
  };

  // Handle medicine form changes
  const handleFormChange = (field, value) => {
    setMedicineForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle reminder times
  const addReminderTime = () => {
    setMedicineForm(prev => ({
      ...prev,
      reminderTimes: [...prev.reminderTimes, '']
    }));
  };

  const updateReminderTime = (index, value) => {
    const newTimes = [...medicineForm.reminderTimes];
    newTimes[index] = value;
    setMedicineForm(prev => ({
      ...prev,
      reminderTimes: newTimes
    }));
  };

  const removeReminderTime = (index) => {
    setMedicineForm(prev => ({
      ...prev,
      reminderTimes: prev.reminderTimes.filter((_, i) => i !== index)
    }));
  };

  // Save medicine with reminders
  const handleSaveMedicine = async () => {
    try {
      const name = medicineForm.name?.trim();
      const dosage = medicineForm.dosage?.trim();
      const frequency = medicineForm.frequency?.trim();
      const reminderTimes = medicineForm.reminderTimes.filter(t => t);

      if (!name || !dosage || !frequency || reminderTimes.length === 0) {
        alert('Please fill all required fields and at least one reminder time.');
        return;
      }

      const reminderPayloads = reminderTimes.map((time) => {
        const payload = {
          medicine_name: name,
          dosage,
          reminder_time: time,
          frequency,
          days: null,
          quantity: medicineForm.quantity || null,
        };
        return payload;
      });

      const responses = await Promise.all(
        reminderPayloads.map((payload) =>
          fetch(`${API_BASE}/api/reminders/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(payload)
          })
        )
      );

      const failed = responses.find((res) => !res.ok);

      if (!failed) {
        const localMedicine = {
          id: `${name}||${dosage}||${frequency}||${medicineForm.quantity || ''}`,
          medicine_name: name,
          dosage,
          frequency,
          duration: medicineForm.duration || '',
          quantity: medicineForm.quantity || '',
          reminder_times: reminderTimes,
          reminder_ids: [],
        };

        setMedicines((prev) => {
          const existing = prev.find((m) => m.id === localMedicine.id);
          if (!existing) {
            return [localMedicine, ...prev];
          }

          const mergedTimes = Array.from(new Set([...(existing.reminder_times || []), ...reminderTimes]));
          return prev.map((m) =>
            m.id === localMedicine.id
              ? { ...m, reminder_times: mergedTimes, duration: m.duration || localMedicine.duration }
              : m
          );
        });

        
        // Reset form
        setMedicineForm({
          name: '',
          dosage: '',
          frequency: 'Once Daily',
          duration: '',
          quantity: '',
          reminderTimes: [''],
          notes: ''
        });
        setShowAddMedicine(false);

        // Refresh medicines
        fetchReminders();
      } else {
        let errorMessage = 'Unable to save reminder. Please check your inputs.';
        try {
          const errorBody = await failed.json();
          if (errorBody?.detail) {
            errorMessage = Array.isArray(errorBody.detail)
              ? errorBody.detail.map((d) => d.msg).join(' | ')
              : errorBody.detail;
          }
        } catch (err) {
          console.error('Failed to parse error response:', err);
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Failed to save medicine:', error);
    }
  };

  // Delete medicine
  const handleDeleteMedicine = async (medicineId) => {
    if (!confirm(t('confirmDeleteMedicine', language))) return;
    
    try {
      const target = medicines.find((m) => m.id === medicineId);
      if (!target || !target.reminder_ids) {
        return;
      }

      const responses = await Promise.all(
        target.reminder_ids.map((id) =>
          fetch(`${API_BASE}/api/reminders/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          })
        )
      );

      const allOk = responses.every((res) => res.ok || res.status === 204);

      if (allOk) {
        setMedicines(prev => prev.filter(m => m.id !== medicineId));
        fetchReminders();
      }
    } catch (error) {
      console.error('Failed to delete medicine:', error);
    }
  };

  // Request notification permission once when reminders page mounts
  useEffect(() => {
    if (!isAuthenticated || !canUseNotifications) return;
    if (getNotificationPermission() === 'default') {
      try {
        const permissionRequest = Notification.requestPermission();
        if (permissionRequest && typeof permissionRequest.then === 'function') {
          permissionRequest.catch(() => {});
        }
      } catch {
        // Ignore notification permission errors in restricted browser contexts.
      }
    }
  }, [isAuthenticated, canUseNotifications]);

  // Check for upcoming reminders
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const checkReminders = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const upcoming = [];
      reminders.forEach(reminder => {
        if (reminder.reminder_time === currentTime) {
          upcoming.push(reminder);
              
              // Add to reminder history
              const historyEntry = {
                id: Date.now(),
                medicine: reminder.medicine_name,
                dosage: reminder.dosage,
                quantity: reminder.quantity || reminder.days?.quantity,
                time: currentTime,
                date: now.toLocaleDateString(),
                status: 'pending',
              };
              setReminderHistory(prev => {
                const alreadyLogged = prev.some(
                  (entry) =>
                    entry.medicine === historyEntry.medicine &&
                    entry.time === historyEntry.time &&
                    entry.date === historyEntry.date
                );

                if (alreadyLogged) {
                  return prev;
                }

                return [historyEntry, ...prev].slice(0, 50);
              });
              
              // Show notification
              if (canUseNotifications && getNotificationPermission() === 'granted') {
                const qtyText = historyEntry.quantity ? ` • ${t('quantity', language)}: ${historyEntry.quantity}` : '';
                try {
                  new Notification(`${t('timeToTake', language)} ${reminder.medicine_name}!`, {
                    body: `${dosageLabel}: ${reminder.dosage}${qtyText}`,
                    icon: '/favicon.ico',
                  });
                } catch {
                  // Ignore notification creation errors to keep UI stable.
                }
              }
              
        }
      });
      
      setUpcomingReminders(upcoming);
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminders, language, isAuthenticated, canUseNotifications]);

  const handleMarkTaken = async (med) => {
    const now = new Date().toLocaleString();
    const takenEntry = {
      ...med,
      takenAt: now,
    };
    
    setTakenMedicines(prev => [...prev, takenEntry]);
    
    // Update reminder history
    setReminderHistory(prev => prev.map(entry => {
      if (entry.medicine === med.medicine_name && entry.time === med.reminder_time && entry.status === 'pending') {
        return { ...entry, status: 'taken', takenAt: now };
      }
      return entry;
    }));
    
    setUpcomingReminders(prev => prev.filter(m => m.id !== med.id));
  };

  // Calculate reminder statistics
  const todayReminders = medicines.reduce((acc, m) => acc + (m.reminder_times?.length || 0), 0);
  const takenToday = takenMedicines.filter(m => 
    new Date(m.takenAt).toDateString() === new Date().toDateString()
  ).length;
  const missedToday = reminderHistory.filter(entry => 
    entry.date === new Date().toLocaleDateString() && entry.status === 'skipped'
  ).length;
  const pendingReminders = upcomingReminders.length;

  return (
    <>
      {!isAuthenticated && <FeatureLoginPrompt featureName={t('remindersManagementFeature', language)} />}
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-violet-50 pt-24 pb-10">
        <div className="container mx-auto px-4 max-w-5xl">
          
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 inline-flex items-center gap-2 text-3xl font-bold text-emerald-900 md:text-4xl">
                <AlarmIcon fontSize="inherit" /> {t('reminders', language)}
              </h1>
              <p className="text-base md:text-lg text-gray-700">{t('manageYourMedicineReminders', language)}</p>
            </div>
          </div>

          {/* Reminder Stats Dashboard */}
          <div className="grid grid-cols-2 gap-4 mb-8 auto-rows-fr items-stretch">
            <div className="relative flex h-full min-h-[150px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-emerald-100 p-4 text-center shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl md:min-h-[165px] md:p-5">
              <div className="absolute left-0 top-0 h-1.5 w-full bg-emerald-500" />
              <div className="flex w-full flex-1 flex-col items-center justify-center">
                <div className="mb-2 inline-flex items-center justify-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-emerald-200 bg-white/80 shadow-sm">
                    <AlarmIcon sx={{ fontSize: 15 }} className="text-emerald-700" />
                  </span>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] leading-tight text-emerald-700 md:text-xs">
                    {t('todaysReminders', language)}
                  </h3>
                </div>
                <p className="mt-2 text-2xl font-black leading-none tabular-nums text-emerald-900 md:text-3xl">{todayReminders}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-emerald-900/70">Scheduled for today</p>
            </div>

            <div className="relative flex h-full min-h-[150px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-white via-violet-50 to-violet-100 p-4 text-center shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl md:min-h-[165px] md:p-5">
              <div className="absolute left-0 top-0 h-1.5 w-full bg-violet-500" />
              <div className="flex w-full flex-1 flex-col items-center justify-center">
                <div className="mb-2 inline-flex items-center justify-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-violet-200 bg-white/80 shadow-sm">
                    <DoneAllIcon sx={{ fontSize: 15 }} className="text-violet-700" />
                  </span>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] leading-tight text-violet-700 md:text-xs">
                    {t('taken', language)}
                  </h3>
                </div>
                <p className="mt-2 text-2xl font-black leading-none tabular-nums text-violet-900 md:text-3xl">{takenToday}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-violet-900/70">Taken today</p>
            </div>

            <div className="relative flex h-full min-h-[150px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-white via-rose-50 to-rose-100 p-4 text-center shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl md:min-h-[165px] md:p-5">
              <div className="absolute left-0 top-0 h-1.5 w-full bg-rose-500" />
              <div className="flex w-full flex-1 flex-col items-center justify-center">
                <div className="mb-2 inline-flex items-center justify-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-rose-200 bg-white/80 shadow-sm">
                    <ErrorOutlineIcon sx={{ fontSize: 15 }} className="text-rose-700" />
                  </span>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] leading-tight text-rose-700 md:text-xs">
                    {t('missed', language)}
                  </h3>
                </div>
                <p className="mt-2 text-2xl font-black leading-none tabular-nums text-rose-900 md:text-3xl">{missedToday}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-rose-900/70">Not marked as taken</p>
            </div>

            <div className="relative flex h-full min-h-[150px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-white via-teal-50 to-teal-100 p-4 text-center shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl md:min-h-[165px] md:p-5">
              <div className="absolute left-0 top-0 h-1.5 w-full bg-teal-500" />
              <div className="flex w-full flex-1 flex-col items-center justify-center">
                <div className="mb-2 inline-flex items-center justify-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-teal-200 bg-white/80 shadow-sm">
                    <PendingActionsIcon sx={{ fontSize: 15 }} className="text-teal-700" />
                  </span>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] leading-tight text-teal-700 md:text-xs">
                    {t('pending', language)}
                  </h3>
                </div>
                <p className="mt-2 text-2xl font-black leading-none tabular-nums text-teal-900 md:text-3xl">{pendingReminders}</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-teal-900/70">Waiting now</p>
            </div>
          </div>

          {/* YOUR MEDICINES SECTION - NEW */}
          <div className="mb-8 rounded-2xl border border-emerald-100 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-gray-800"><EventNoteIcon />{t('yourMedicines', language)}</h2>
              <button
                type="button"
                onClick={() => setShowAddMedicine(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
              >
                <AddIcon fontSize="small" /> {t('addMedicine', language)}
              </button>
            </div>

            {/* Medicine List */}
            {medicines.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('noMedicinesAdded', language)}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {medicines.map(med => (
                  <div key={med.id} className="rounded-xl border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-violet-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="inline-flex items-center gap-2 font-bold text-gray-800">
                            <img src={capsuleIcon} alt="Medicine" className="h-5 w-5 object-contain" />
                            <span>{cleanMedicineLabel(med.medicine_name)}</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleDeleteMedicine(med.id)}
                            className="text-rose-600 hover:text-rose-800"
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600"><span className="font-semibold">{dosageLabel}:</span> {med.dosage || '-'}</p>
                        <p className="text-sm text-gray-600"><span className="font-semibold">{t('frequency', language)}:</span> {med.frequency || '-'}</p>
                        <p className="text-sm text-gray-600"><span className="font-semibold">{t('duration', language)}:</span> {med.duration || '-'}</p>
                        {med.quantity && (
                          <p className="text-sm text-gray-600">{t('quantity', language)}: {med.quantity}</p>
                        )}
                        {med.reminder_times && med.reminder_times.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            <span className="text-xs font-semibold text-violet-700 mr-1 inline-flex items-center">{t('time', language)}:</span>
                            {med.reminder_times.map((time, i) => (
                              <span key={i} className="inline-flex items-center gap-1 rounded bg-violet-100 px-2 py-1 text-xs font-medium text-violet-900">
                                <AccessTimeIcon sx={{ fontSize: 12 }} /> {time}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Add Medicine Modal */}
          {showAddMedicine && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-3xl rounded-2xl border border-emerald-100 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">{t('addMedicine', language)}</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddMedicine(false)}
                    className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  >
                    X
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('medicineName', language)} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={medicineForm.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder={t('enterMedicineName', language)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {dosageLabel} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={medicineForm.dosage}
                      onChange={(e) => handleFormChange('dosage', e.target.value)}
                      placeholder={t('enterDosage', language)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('frequency', language)} <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={medicineForm.frequency}
                      onChange={(e) => handleFormChange('frequency', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">{t('selectFrequency', language)}</option>
                      <option value="Once Daily">{t('onceDaily', language)}</option>
                      <option value="Twice Daily">{t('twiceDaily', language)}</option>
                      <option value="Thrice Daily">{t('thriceDaily', language)}</option>
                      <option value="Four Times Daily">{t('fourTimesDaily', language)}</option>
                      <option value="As Needed">{t('asNeeded', language)}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('duration', language)}
                    </label>
                    <input
                      type="text"
                      value={medicineForm.duration}
                      onChange={(e) => handleFormChange('duration', e.target.value)}
                      placeholder={t('enterDuration', language)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('quantity', language)}
                    </label>
                    <input
                      type="text"
                      value={medicineForm.quantity}
                      onChange={(e) => handleFormChange('quantity', e.target.value)}
                      placeholder={t('enterQuantity', language)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('instructionsNotes', language)}
                    </label>
                    <input
                      type="text"
                      value={medicineForm.notes}
                      onChange={(e) => handleFormChange('notes', e.target.value)}
                      placeholder={t('enterNotes', language)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('setReminderTimes', language)}
                    </label>
                    {medicineForm.reminderTimes.map((time, index) => (
                      <div key={index} className="mb-2 flex items-center gap-2">
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => updateReminderTime(index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        {medicineForm.reminderTimes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeReminderTime(index)}
                            className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                          >
                            Remove
                          </button>
                        )}
                        {index === medicineForm.reminderTimes.length - 1 && (
                          <button
                            type="button"
                            onClick={addReminderTime}
                            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                          >
                            + {t('add', language)}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={handleSaveMedicine}
                    className="rounded-lg bg-green-600 px-8 py-3 font-semibold text-white transition hover:bg-green-700"
                  >
                    {t('save', language)}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddMedicine(false);
                      setMedicineForm({
                        name: '',
                        dosage: '',
                        frequency: 'Once Daily',
                        duration: '',
                        quantity: '',
                        reminderTimes: [''],
                        notes: ''
                      });
                    }}
                    className="rounded-lg bg-gray-300 px-8 py-3 font-semibold text-gray-800 transition hover:bg-gray-400"
                  >
                    {t('cancel', language)}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Reminders Alert */}
          {upcomingReminders.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-red-900 mb-3">{t('timeToTakeMedicines', language)}</h3>
              <div className="space-y-3">
                {upcomingReminders.map(med => (
                  <div key={med.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-2 font-bold text-lg text-gray-800"><img src={capsuleIcon} alt="Medicine" className="h-5 w-5 object-contain" />{cleanMedicineLabel(med.medicine_name)}</div>
                      <div className="text-sm text-gray-600"><span className="font-semibold">{dosageLabel}:</span> {med.dosage || '-'}</div>
                      <div className="text-sm text-gray-600"><span className="font-semibold">{t('duration', language)}:</span> {med.duration || '-'}</div>
                      <div className="text-sm text-gray-600"><span className="font-semibold">{t('time', language)}:</span> {med.reminder_time || '-'}</div>
                      {(med.quantity || med.days?.quantity) && (
                        <div className="text-sm text-gray-600">
                          {t('quantity', language)}: {med.quantity || med.days?.quantity}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMarkTaken(med)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                      <span className="inline-flex items-center gap-1.5"><CheckCircleIcon sx={{ fontSize: 16 }} />{t('taken', language)}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Intake History & Reminder History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800">{t('todaysIntakeHistory', language)}</h3>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {takenToday} {t('taken', language)}
                </span>
              </div>
              {takenToday === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('noMedicinesTakenToday', language)}</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {takenMedicines
                    .filter(m => new Date(m.takenAt).toDateString() === new Date().toDateString())
                    .map((m, i) => (
                      <div key={i} className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="inline-flex items-center gap-2 font-semibold text-gray-800"><img src={capsuleIcon} alt="Medicine" className="h-5 w-5 object-contain" />{cleanMedicineLabel(m.medicine_name)}</div>
                            <div className="text-sm text-gray-600"><span className="font-semibold">{dosageLabel}:</span> {m.dosage || '-'}</div>
                            <div className="text-sm text-gray-600"><span className="font-semibold">{t('duration', language)}:</span> {m.duration || '-'}</div>
                            {(m.quantity || m.days?.quantity) && (
                              <div className="text-sm text-gray-600">
                                {t('quantity', language)}: {m.quantity || m.days?.quantity}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{m.takenAt}</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="inline-flex items-center gap-2 text-2xl font-bold text-gray-800"><HistoryIcon />{t('reminderHistory', language)}</h3>
                <button
                  type="button"
                  onClick={() => setReminderHistory([])}
                  className="text-sm text-red-600 hover:text-red-800 font-semibold"
                >
                  <span className="inline-flex items-center gap-1"><DeleteOutlineIcon sx={{ fontSize: 16 }} />{t('clearHistory', language)}</span>
                </button>
              </div>
              {reminderHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('noReminderHistory', language)}</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {reminderHistory.map((entry) => (
                    <div 
                      key={entry.id} 
                      className={`p-4 rounded-lg border-l-4 ${
                        entry.status === 'taken' ? 'bg-green-50 border-green-500' :
                        entry.status === 'skipped' ? 'bg-red-50 border-red-500' :
                        'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="inline-flex items-center gap-2 font-semibold text-gray-800"><img src={capsuleIcon} alt="Medicine" className="h-5 w-5 object-contain" />{cleanMedicineLabel(entry.medicine)}</div>
                          <div className="text-sm text-gray-600"><span className="font-semibold">{dosageLabel}:</span> {entry.dosage || '-'}</div>
                          {entry.quantity && (
                            <div className="text-sm text-gray-600">
                              {t('quantity', language)}: {entry.quantity}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {entry.date} {t('at', language)} {entry.time}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          entry.status === 'taken' ? 'bg-green-200 text-green-800' :
                          entry.status === 'skipped' ? 'bg-red-200 text-red-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* All Scheduled Reminders */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('allScheduledReminders', language)}</h3>
            {medicines.filter(m => m.reminder_times && m.reminder_times.length > 0).length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('noRemindersScheduled', language)}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {medicines
                  .filter(m => m.reminder_times && m.reminder_times.length > 0)
                  .map(med => (
                    <div key={med.id} className="rounded-xl border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-violet-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h4 className="inline-flex items-center gap-2 font-bold text-gray-800"><img src={capsuleIcon} alt="Medicine" className="h-5 w-5 object-contain" />{cleanMedicineLabel(med.medicine_name)}</h4>
                          <p className="text-sm text-gray-600"><span className="font-semibold">{dosageLabel}:</span> {med.dosage}</p>
                          <p className="text-sm text-gray-600"><span className="font-semibold">{t('frequency', language)}:</span> {med.frequency || '-'}</p>
                          <p className="text-sm text-gray-600"><span className="font-semibold">{t('duration', language)}:</span> {med.duration || '-'}</p>
                          {med.quantity && (
                            <p className="text-sm text-gray-600">{t('quantity', language)}: {med.quantity}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1">
                            <span className="text-xs font-semibold text-violet-700 mr-1 inline-flex items-center">{t('time', language)}:</span>
                            {med.reminder_times.map((time, i) => (
                              <span key={i} className="inline-flex items-center gap-1 rounded bg-violet-100 px-2 py-1 text-xs font-medium text-violet-900">
                                <AccessTimeIcon sx={{ fontSize: 12 }} /> {time}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default RemindersEnhanced;
