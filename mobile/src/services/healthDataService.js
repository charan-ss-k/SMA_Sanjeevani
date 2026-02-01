/**
 * Health Data Integration Service
 * Apple HealthKit and Google Fit integration
 */

import * as HealthKit from 'react-native-health';
import { apiClient } from '../api/client';
import { Platform } from 'react-native';

class HealthDataService {
  /**
   * Request HealthKit permissions (iOS)
   */
  static async requestHealthKitPermissions() {
    if (Platform.OS !== 'ios') return false;

    try {
      const permissions = {
        permissions: {
          read: [
            HealthKit.Constants.Permissions.HeartRate,
            HealthKit.Constants.Permissions.StepCount,
            HealthKit.Constants.Permissions.ActiveEnergyBurned,
            HealthKit.Constants.Permissions.DietaryWater,
            HealthKit.Constants.Permissions.BodyMass,
            HealthKit.Constants.Permissions.Height,
            HealthKit.Constants.Permissions.BloodPressure,
            HealthKit.Constants.Permissions.BloodGlucose,
          ],
        },
      };

      await HealthKit.initHealthKit(permissions);
      return true;
    } catch (error) {
      console.error('Failed to request HealthKit permissions:', error);
      return false;
    }
  }

  /**
   * Get step count for date
   */
  static async getStepCount(startDate, endDate) {
    try {
      const samples = await HealthKit.getStepCount({
        startDate,
        endDate,
        period: 1,
      });

      return samples;
    } catch (error) {
      console.error('Failed to get step count:', error);
      return [];
    }
  }

  /**
   * Get heart rate data
   */
  static async getHeartRateData(startDate, endDate) {
    try {
      const samples = await HealthKit.getHeartRateSamples({
        startDate,
        endDate,
        limit: 100,
      });

      return samples;
    } catch (error) {
      console.error('Failed to get heart rate data:', error);
      return [];
    }
  }

  /**
   * Get blood pressure data
   */
  static async getBloodPressureData(startDate, endDate) {
    try {
      const samples = await HealthKit.getBloodPressureSamples({
        startDate,
        endDate,
        limit: 100,
      });

      return samples;
    } catch (error) {
      console.error('Failed to get blood pressure data:', error);
      return [];
    }
  }

  /**
   * Get body weight data
   */
  static async getBodyWeightData(startDate, endDate) {
    try {
      const samples = await HealthKit.getWeightSamples({
        startDate,
        endDate,
        limit: 100,
      });

      return samples;
    } catch (error) {
      console.error('Failed to get body weight data:', error);
      return [];
    }
  }

  /**
   * Get workout data
   */
  static async getWorkoutData(startDate, endDate) {
    try {
      const samples = await HealthKit.getWorkouts({
        startDate,
        endDate,
        limit: 100,
      });

      return samples;
    } catch (error) {
      console.error('Failed to get workout data:', error);
      return [];
    }
  }

  /**
   * Save health data to backend
   */
  static async syncHealthData(healthData) {
    try {
      const response = await apiClient.post('/api/health/sync', {
        data: healthData,
        timestamp: new Date(),
      });

      return response.data;
    } catch (error) {
      console.error('Failed to sync health data:', error);
      throw error;
    }
  }

  /**
   * Get daily health summary
   */
  static async getDailySummary(date) {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const [stepCount, heartRate, bloodPressure, weight, workout] =
        await Promise.all([
          this.getStepCount(startDate, endDate),
          this.getHeartRateData(startDate, endDate),
          this.getBloodPressureData(startDate, endDate),
          this.getBodyWeightData(startDate, endDate),
          this.getWorkoutData(startDate, endDate),
        ]);

      return {
        date,
        steps: stepCount.length > 0 ? stepCount[0].value : 0,
        heartRate: heartRate.length > 0 ? heartRate : [],
        bloodPressure: bloodPressure.length > 0 ? bloodPressure : [],
        weight: weight.length > 0 ? weight[0].value : 0,
        workouts: workout,
      };
    } catch (error) {
      console.error('Failed to get daily summary:', error);
      return null;
    }
  }
}

export default HealthDataService;
