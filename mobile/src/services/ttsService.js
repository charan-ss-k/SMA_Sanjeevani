/**
 * Text-to-Speech Service
 * Handles audio generation, playback, and management
 * Supports streaming from backend and local playback
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import apiClient from '../api/client';
import { ENABLE_DEBUG as DEBUG } from '../config/environment';

class TTSService {
  constructor() {
    this.currentSound = null;
    this.isPlaying = false;
    this.isStopped = false;
    this.currentFile = null;
    this.audioSession = null;
  }

  /**
   * Initialize audio session
   */
  async initializeAudioSession() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      this.audioSession = true;
      if (DEBUG) console.log('[TTS] Audio session initialized');
    } catch (error) {
      if (DEBUG) console.error('[TTS] Failed to initialize audio session:', error);
    }
  }

  /**
   * Generate TTS and play immediately (non-streaming)
   */
  async synthesizeAndPlay(text, language = 'en', voiceId = 'default') {
    try {
      this.isStopped = false;
      if (DEBUG) console.log(`[TTS] Generating speech for: ${text.substring(0, 50)}...`);

      // Generate TTS from backend
      const response = await apiClient.generateTTS(text, language, voiceId);

      if (response.audio_url) {
        await this.playAudio(response.audio_url);
      } else {
        throw new Error('No audio URL in response');
      }

      return response;
    } catch (error) {
      if (DEBUG) console.error('[TTS] Synthesis error:', error);
      throw error;
    }
  }

  /**
   * Stream TTS and play chunks as they arrive
   * Requires backend to support streaming TTS endpoint
   */
  async streamAndPlayTTS(text, language = 'en', voiceId = 'default', onProgress = null) {
    try {
      this.isStopped = false;
      if (DEBUG) console.log(`[TTS] Starting TTS stream for: ${text.substring(0, 50)}...`);

      const cacheDir = FileSystem.cacheDirectory + 'tts_chunks/';
      await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true }).catch(() => {});

      const timestamp = Date.now();
      const filePath = cacheDir + `stream_${timestamp}.mp3`;

      // Get streaming response from backend
      const streamResponse = await apiClient.streamTTS(text, language, voiceId);
      const blob = await streamResponse.blob();
      const base64 = await this.blobToBase64(blob);

      // Write to file
      await FileSystem.writeAsStringAsync(filePath, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Play the file
      await this.playAudio(filePath);

      if (onProgress) {
        onProgress({ status: 'completed', file: filePath });
      }

      this.currentFile = filePath;
      return { success: true, audioFile: filePath };
    } catch (error) {
      if (DEBUG) console.error('[TTS] Stream error:', error);
      throw error;
    }
  }

  /**
   * Play audio from URL or local file path
   */
  async playAudio(source) {
    try {
      if (this.currentSound) {
        await this.currentSound.unloadAsync();
      }

      if (DEBUG) console.log(`[TTS] Loading audio from: ${source.substring(0, 50)}...`);

      const { sound } = await Audio.Sound.createAsync(
        typeof source === 'string' && source.startsWith('http')
          ? { uri: source }
          : { uri: source }
      );

      this.currentSound = sound;
      this.isPlaying = true;

      // Setup completion listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          this.isPlaying = false;
          if (DEBUG) console.log('[TTS] Playback finished');
        }
        if (status.error) {
          if (DEBUG) console.error('[TTS] Playback error:', status.error);
          this.isPlaying = false;
        }
      });

      await sound.playAsync();
      if (DEBUG) console.log('[TTS] Playback started');

      return sound;
    } catch (error) {
      if (DEBUG) console.error('[TTS] Play error:', error);
      throw error;
    }
  }

  /**
   * Pause audio playback
   */
  async pauseAudio() {
    try {
      if (this.currentSound && this.isPlaying) {
        await this.currentSound.pauseAsync();
        this.isPlaying = false;
        if (DEBUG) console.log('[TTS] Playback paused');
      }
    } catch (error) {
      if (DEBUG) console.error('[TTS] Pause error:', error);
    }
  }

  /**
   * Resume audio playback
   */
  async resumeAudio() {
    try {
      if (this.currentSound && !this.isPlaying) {
        await this.currentSound.playAsync();
        this.isPlaying = true;
        if (DEBUG) console.log('[TTS] Playback resumed');
      }
    } catch (error) {
      if (DEBUG) console.error('[TTS] Resume error:', error);
    }
  }

  /**
   * Stop audio playback
   */
  async stopAudio() {
    try {
      this.isStopped = true;
      if (this.currentSound) {
        await this.currentSound.stopAsync();
        this.isPlaying = false;
        if (DEBUG) console.log('[TTS] Playback stopped');
      }
    } catch (error) {
      if (DEBUG) console.error('[TTS] Stop error:', error);
    }
  }

  /**
   * Alias for stopAudio for convenience
   */
  async stop() {
    return this.stopAudio();
  }

  /**
   * Get playback status
   */
  async getPlaybackStatus() {
    try {
      if (this.currentSound) {
        return await this.currentSound.getStatusAsync();
      }
      return null;
    } catch (error) {
      if (DEBUG) console.error('[TTS] Status error:', error);
      return null;
    }
  }

  /**
   * Cleanup
   */
  async cleanup() {
    try {
      await this.stopAudio();
      if (this.currentSound) {
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      }
      if (DEBUG) console.log('[TTS] Cleanup completed');
    } catch (error) {
      if (DEBUG) console.error('[TTS] Cleanup error:', error);
    }
  }

  /**
   * Helper: Convert blob to base64
   */
  async blobToBase64(blob) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export default new TTSService();
