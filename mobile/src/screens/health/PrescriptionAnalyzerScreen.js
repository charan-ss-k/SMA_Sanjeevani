/**
 * Prescription Analyzer Screen
 * Upload and analyze prescription images
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useHealth } from '../../context/HealthContext';
import { Button, Card, Alert, Loading } from '../../components';
import { colors, spacing, typography } from '../../utils/theme';

const PrescriptionResult = ({ data }) => (
  <View style={{ gap: spacing.md }}>
    {data.medicines && (
      <Card variant="elevated" padding="md">
        <Text
          style={[
            typography.h4,
            {
              color: colors.text,
              marginBottom: spacing.md,
            },
          ]}
        >
          💊 Medicines Identified
        </Text>
        {data.medicines.map((medicine, idx) => (
          <View
            key={idx}
            style={{
              paddingVertical: spacing.md,
              borderBottomWidth: idx < data.medicines.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
            }}
          >
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
                typography.body,
                {
                  color: colors.textSecondary,
                },
              ]}
            >
              {medicine.dosage} • {medicine.frequency}
            </Text>
          </View>
        ))}
      </Card>
    )}

    {data.diagnosis && (
      <Card variant="elevated" padding="md">
        <Text
          style={[
            typography.h4,
            {
              color: colors.text,
              marginBottom: spacing.md,
            },
          ]}
        >
          🩺 Diagnosis
        </Text>
        <Text
          style={[
            typography.body,
            {
              color: colors.textSecondary,
              lineHeight: 22,
            },
          ]}
        >
          {data.diagnosis}
        </Text>
      </Card>
    )}

    {data.notes && (
      <Card variant="elevated" padding="md">
        <Text
          style={[
            typography.h4,
            {
              color: colors.text,
              marginBottom: spacing.md,
            },
          ]}
        >
          📝 Doctor's Notes
        </Text>
        <Text
          style={[
            typography.body,
            {
              color: colors.textSecondary,
              lineHeight: 22,
            },
          ]}
        >
          {data.notes}
        </Text>
      </Card>
    )}
  </View>
);

export default function PrescriptionAnalyzerScreen() {
  const { uploadPrescription, isLoading } = useHealth();
  const [selectedImage, setSelectedImage] = useState(null);
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzePrescription = async () => {
    if (!selectedImage) {
      setError('Please select or capture a prescription image');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setPrescriptionData(null);

    try {
      const result = await uploadPrescription(selectedImage);
      setPrescriptionData(result);
    } catch (err) {
      setError(err.message || 'Failed to analyze prescription');
      setPrescriptionData(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCaptureImage = async () => {
    // TODO: Integrate with expo-camera
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
        📋 Prescription Analyzer
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
          Upload or capture a photo of your prescription. Our AI will analyze it
          and extract medicine information, dosage, and instructions.
        </Text>
      </Card>
      {!selectedImage ? (
        <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
          <Button
            title="📸 Capture Prescription"
            onPress={handleCaptureImage}
            fullWidth
          />
          <Button
            title="🖼️ Select Image"
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
              height: 250,
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
      {selectedImage && !prescriptionData && (
        <Button
          title={isAnalyzing ? 'Analyzing...' : 'Analyze Prescription'}
          onPress={handleAnalyzePrescription}
          isLoading={isAnalyzing}
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
      {prescriptionData && (
        <>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.lg,
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
              Prescription Details
            </Text>
            <Button
              title="Analyze Another"
              onPress={() => {
                setSelectedImage(null);
                setPrescriptionData(null);
              }}
              variant="ghost"
              size="sm"
            />
          </View>

          <PrescriptionResult data={prescriptionData} />
          <Button
            title="➕ Add Medicines to Reminders"
            onPress={() => {
              // TODO: Add medicines to reminders
              console.log('Add to reminders');
            }}
            variant="secondary"
            fullWidth
            style={{ marginTop: spacing.lg }}
          />
        </>
      )}
      <Card
        variant="outlined"
        padding="md"
        style={{
          marginTop: spacing.lg,
          backgroundColor: colors.warning + '10',
          borderColor: colors.warning,
        }}
      >
        <Text
          style={[
            typography.caption,
            {
              color: colors.warning,
              lineHeight: 18,
            },
          ]}
        >
          ⚠️ This tool assists in prescription analysis but does not replace
          medical consultation. Always verify information with your doctor.
        </Text>
      </Card>
    </ScrollView>
  );
}
