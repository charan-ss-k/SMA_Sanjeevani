/**
 * Medicine Identification Screen
 * Capture or select medicine image for identification
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useHealth } from '../../context/HealthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button, Card, Alert, Loading } from '../../components';
import { colors, spacing, typography } from '../../utils/theme';
import ttsService from '../../services/ttsService';

const MedicineResultCard = ({ medicine, onSpeak, isSpeaking, isProcessing }) => (
  <Card variant="elevated" padding="md">
    <View
      style={{
        flexDirection: 'row',
        marginBottom: spacing.md,
      }}
    >
      {medicine.imageUrl && (
        <Image
          source={{ uri: medicine.imageUrl }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 8,
            marginRight: spacing.md,
          }}
        />
      )}
      <View style={{ flex: 1 }}>
        <Text
          style={[
            typography.h4,
            {
              color: colors.text,
              marginBottom: spacing.xs,
            },
          ]}
        >
          {medicine.name}
        </Text>
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              marginBottom: spacing.xs,
            },
          ]}
        >
          {medicine.composition}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
          }}
        >
          <Text
            style={{
              backgroundColor: colors.primary,
              color: colors.white,
              paddingHorizontal: spacing.sm,
              paddingVertical: 2,
              borderRadius: 4,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            {medicine.confidence}% Match
          </Text>
          <Pressable
            onPress={onSpeak}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isSpeaking ? '#FEE2E2' : '#E0F2FE',
              borderColor: isSpeaking ? '#FCA5A5' : '#BAE6FD',
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: spacing.sm,
              paddingVertical: 4,
            }}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#0369A1" />
            ) : (
              <MaterialCommunityIcons
                name={isSpeaking ? 'stop-circle-outline' : 'volume-high'}
                size={14}
                color="#0369A1"
              />
            )}
            <Text style={{ marginLeft: 4, fontSize: 11, fontWeight: '700', color: '#0F172A' }}>
              {isProcessing ? 'Processing...' : isSpeaking ? 'Stop' : 'Speak'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>

    {medicine.indication && (
      <>
        <Text
          style={[
            typography.labelSmall,
            {
              color: colors.text,
              marginBottom: spacing.sm,
              marginTop: spacing.md,
            },
          ]}
        >
          Indication:
        </Text>
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              marginBottom: spacing.md,
              lineHeight: 18,
            },
          ]}
        >
          {medicine.indication}
        </Text>
      </>
    )}

    {medicine.dosage && (
      <>
        <Text
          style={[
            typography.labelSmall,
            {
              color: colors.text,
              marginBottom: spacing.sm,
            },
          ]}
        >
          Dosage:
        </Text>
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              marginBottom: spacing.md,
            },
          ]}
        >
          {medicine.dosage}
        </Text>
      </>
    )}

    {medicine.sideEffects && (
      <>
        <Text
          style={[
            typography.labelSmall,
            {
              color: colors.text,
              marginBottom: spacing.sm,
            },
          ]}
        >
          Side Effects:
        </Text>
        <Text
          style={[
            typography.caption,
            {
              color: colors.warning,
            },
          ]}
        >
          {medicine.sideEffects}
        </Text>
      </>
    )}
  </Card>
);

export default function MedicineIdentificationScreen() {
  const { identifyMedicineFromImage, isLoading } = useHealth();
  const { language } = useLanguage();
  const [selectedImage, setSelectedImage] = useState(null);
  const [identifiedMedicines, setIdentifiedMedicines] = useState([]);
  const [error, setError] = useState(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [activeTtsKey, setActiveTtsKey] = useState(null);
  const [isTtsProcessing, setIsTtsProcessing] = useState(false);

  const stopTTSPlayback = useCallback(async () => {
    try {
      await ttsService.stop();
    } catch (_) {
      // noop
    }
    setActiveTtsKey(null);
    setIsTtsProcessing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        stopTTSPlayback();
        setSelectedImage(null);
        setIdentifiedMedicines([]);
        setError(null);
        setIsIdentifying(false);
      };
    }, [stopTTSPlayback])
  );

  const handleSpeakMedicine = async (index, medicine) => {
    const key = `identified-${index}`;
    if (activeTtsKey === key) {
      await stopTTSPlayback();
      return;
    }

    const text = `${medicine.name || 'Medicine'}. Composition: ${medicine.composition || 'Not available'}. Indication: ${medicine.indication || ''}. Dosage: ${medicine.dosage || ''}. Side effects: ${medicine.sideEffects || ''}`;

    try {
      setActiveTtsKey(key);
      setIsTtsProcessing(true);
      await ttsService.synthesizeAndPlay(text, language);
    } catch (err) {
      setError('Unable to play audio for this medicine');
    } finally {
      setActiveTtsKey(null);
      setIsTtsProcessing(false);
    }
  };

  const handleIdentify = async () => {
    if (!selectedImage) {
      setError('Please select or capture an image first');
      return;
    }

    setIsIdentifying(true);
    setError(null);

    try {
      const result = await identifyMedicineFromImage(selectedImage);
      const normalized = Array.isArray(result)
        ? result
        : [result].filter(Boolean).map((item) => ({
            name: item.medicine_name || item.name || 'Unknown Medicine',
            composition: item.composition || item.generic_name || item.category || 'Not available',
            confidence: typeof item.confidence === 'number' ? Math.round(item.confidence * 100) : null,
            indication: item.indication || item.use || item.usage || '',
            dosage: item.dosage || 'As prescribed',
            sideEffects: item.side_effects || item.sideEffects || '',
          }));

      setIdentifiedMedicines(normalized);
      stopTTSPlayback();
    } catch (err) {
      setError(err.message || 'Failed to identify medicine');
      setIdentifiedMedicines([]);
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleCaptureImage = async () => {
    // TODO: Integrate with expo-camera for image capture
    console.log('Camera integration needed');
  };

  const handleSelectImage = async () => {
    // TODO: Integrate with expo-image-picker
    console.log('Image picker integration needed');
  };

  if (isLoading) {
    return <Loading fullScreen message="Loading..." />;
  }

  return (
    <ScrollView
      contentContainerStyle={{
        padding: spacing.lg,
      }}
    >
      <Text
        style={[
          typography.h3,
          {
            color: colors.text,
            marginBottom: spacing.md,
          },
        ]}
      >
        Medicine Identification
      </Text>
      <Card variant="outlined" padding="md" style={{ marginBottom: spacing.lg }}>
        <Text
          style={[
            typography.body,
            {
              color: colors.textSecondary,
              lineHeight: 20,
            },
          ]}
        >
          Take a photo of your medicine or upload an existing image. We'll
          identify it and provide detailed information about composition, usage,
          and side effects.
        </Text>
      </Card>
      {!selectedImage ? (
        <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
          <Button
            title="Capture Photo"
            onPress={handleCaptureImage}
            fullWidth
          />
          <Button
            title="Select Image"
            onPress={handleSelectImage}
            variant="secondary"
            fullWidth
          />
        </View>
      ) : (
        <View style={{ marginBottom: spacing.lg }}>
          <Image
            source={{ uri: selectedImage }}
            style={{
              width: '100%',
              height: 200,
              borderRadius: 8,
              marginBottom: spacing.md,
            }}
          />
          <Button
            title="Change Image"
            onPress={() => setSelectedImage(null)}
            variant="outline"
            fullWidth
          />
        </View>
      )}
      {selectedImage && !identifiedMedicines.length && (
        <Button
          title={isIdentifying ? 'Identifying...' : 'Identify Medicine'}
          onPress={handleIdentify}
          isLoading={isIdentifying}
          fullWidth
          style={{ marginBottom: spacing.lg }}
        />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          onDismiss={() => setError(null)}
          dismissAfter={5000}
        />
      )}
      {identifiedMedicines.length > 0 && (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Text
              style={[
                typography.h4,
                {
                  color: colors.text,
                  flex: 1,
                },
              ]}
            >
              Identified Medicines
            </Text>
            <Button
              title="Try Another"
              onPress={() => {
                setSelectedImage(null);
                setIdentifiedMedicines([]);
                stopTTSPlayback();
              }}
              variant="ghost"
              size="sm"
            />
          </View>

          {identifiedMedicines.map((medicine, idx) => (
            <MedicineResultCard
              key={idx}
              medicine={medicine}
              onSpeak={() => handleSpeakMedicine(idx, medicine)}
              isSpeaking={activeTtsKey === `identified-${idx}`}
              isProcessing={activeTtsKey === `identified-${idx}` && isTtsProcessing}
            />
          ))}
        </>
      )}
    </ScrollView>
  );
}
