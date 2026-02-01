/**
 * Medicine/Health Data Context
 * Manages medicine history, prescriptions, symptoms, and medical data
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import apiClient from '../api/client';
import { ENABLE_DEBUG as DEBUG } from '../config/environment';

const HealthContext = createContext({});

export const HealthProvider = ({ children }) => {
  const [medicineHistory, setMedicineHistory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [symptomHistory, setSymptomHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch medicine history
   */
  const fetchMedicineHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const history = await apiClient.get('/medicine/history');
      setMedicineHistory(history);
      return history;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch medicine history';
      setError(errorMessage);
      if (DEBUG) console.error('[Health] Medicine history error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add medicine to history
   */
  const addMedicineRecord = useCallback(async (medicineData) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post('/medicine/history', medicineData);
      setMedicineHistory((prev) => [...prev, response]);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to add medicine record';
      setError(errorMessage);
      if (DEBUG) console.error('[Health] Add medicine error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch prescriptions
   */
  const fetchPrescriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const presc = await apiClient.get('/prescriptions');
      setPrescriptions(presc);
      return presc;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch prescriptions';
      setError(errorMessage);
      if (DEBUG) console.error('[Health] Prescriptions error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Upload and analyze prescription
   */
  const uploadPrescription = useCallback(async (imageUri) => {
    try {
      setIsLoading(true);
      const analysis = await apiClient.analyzePrescriptionImage(imageUri);
      setPrescriptions((prev) => [...prev, analysis]);
      return analysis;
    } catch (err) {
      const errorMessage = err.message || 'Failed to analyze prescription';
      setError(errorMessage);
      if (DEBUG) console.error('[Health] Prescription upload error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch reminders
   */
  const fetchReminders = useCallback(async () => {
    try {
      setIsLoading(true);
      const rems = await apiClient.get('/reminders');
      setReminders(rems);
      return rems;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch reminders';
      setError(errorMessage);
      if (DEBUG) console.error('[Health] Reminders error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create reminder
   */
  const createReminder = useCallback(async (reminderData) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post('/reminders', reminderData);
      setReminders((prev) => [...prev, response]);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create reminder';
      setError(errorMessage);
      if (DEBUG) console.error('[Health] Create reminder error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete reminder
   */
  const deleteReminder = useCallback(async (reminderId) => {
    try {
      setIsLoading(true);
      await apiClient.delete(`/reminders/${reminderId}`);
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete reminder';
      setError(errorMessage);
      if (DEBUG) console.error('[Health] Delete reminder error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Add symptom to history
   */
  const addSymptomRecord = useCallback(async (symptoms, recommendation) => {
    try {
      const record = {
        symptoms,
        recommendation,
        timestamp: new Date(),
      };
      setSymptomHistory((prev) => [...prev, record]);
      return record;
    } catch (err) {
      if (DEBUG) console.error('[Health] Add symptom error:', err);
      throw err;
    }
  }, []);

  /**
   * Identify medicine from image
   */
  const identifyMedicineFromImage = useCallback(async (imageUri) => {
    try {
      setIsLoading(true);
      const result = await apiClient.identifyMedicineFromImage(imageUri);
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to identify medicine';
      setError(errorMessage);
      if (DEBUG) console.error('[Health] Medicine identification error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Search medicines
   */
  const searchMedicines = useCallback(async (query) => {
    try {
      setIsLoading(true);
      const results = await apiClient.get(`/medicine/search?q=${query}`);
      return results;
    } catch (err) {
      const errorMessage = err.message || 'Failed to search medicines';
      setError(errorMessage);
      if (DEBUG) console.error('[Health] Search error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    // State
    medicineHistory,
    prescriptions,
    reminders,
    symptomHistory,
    isLoading,
    error,

    // Methods
    fetchMedicineHistory,
    addMedicineRecord,
    fetchPrescriptions,
    uploadPrescription,
    fetchReminders,
    createReminder,
    deleteReminder,
    addSymptomRecord,
    identifyMedicineFromImage,
    searchMedicines,
  };

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used within HealthProvider');
  }
  return context;
};

export default HealthContext;
