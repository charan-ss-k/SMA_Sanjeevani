/**
 * Symptom Checker Screen
 * Check symptoms and get AI recommendations
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  TextInput,
} from 'react-native';
import { useChat } from '../../context/ChatContext';
import { Button, Card, Alert, Badge } from '../../components';
import { colors, spacing, typography } from '../../utils/theme';

const SymptomTag = ({ label, selected, onPress }) => (
  <Pressable
    onPress={onPress}
    style={{
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      backgroundColor: selected ? colors.secondary : colors.gray[100],
      borderWidth: selected ? 0 : 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
    }}
  >
    <Text
      style={{
        color: selected ? colors.white : colors.text,
        fontSize: 14,
        fontWeight: '500',
      }}
    >
      {label}
    </Text>
  </Pressable>
);

const COMMON_SYMPTOMS = [
  'Fever',
  'Cough',
  'Sore Throat',
  'Headache',
  'Body Ache',
  'Nausea',
  'Fatigue',
  'Shortness of Breath',
  'Diarrhea',
  'Vomiting',
  'Rash',
  'Chills',
];

export default function SymptomCheckerScreen() {
  const { sendMessage, addMessage } = useChat();
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleAddCustom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom)) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom]);
      setCustomSymptom('');
    }
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select at least one symptom');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const symptomList = selectedSymptoms.join(', ');
      const message = `I'm experiencing these symptoms: ${symptomList}. Can you help me understand what might be causing them and what I should do?`;

      addMessage(message, 'user');

      let fullResponse = '';
      await sendMessage(
        message,
        (chunk) => {
          fullResponse += chunk;
          setResult(fullResponse);
        },
        () => {
          setIsAnalyzing(false);
        },
        (err) => {
          setError(err.message || 'Failed to analyze symptoms');
          setIsAnalyzing(false);
        }
      );
    } catch (err) {
      setError(err.message || 'Error analyzing symptoms');
      setIsAnalyzing(false);
    }
  };

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
        🩺 Symptom Checker
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
          Select your symptoms below and get AI-powered health insights. This is
          not a medical diagnosis - please consult a doctor if symptoms persist.
        </Text>
      </Card>
      <Text
        style={[
          typography.h4,
          {
            color: colors.text,
            marginBottom: spacing.md,
          },
        ]}
      >
        Common Symptoms
      </Text>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginBottom: spacing.lg,
        }}
      >
        {COMMON_SYMPTOMS.map((symptom) => (
          <SymptomTag
            key={symptom}
            label={symptom}
            selected={selectedSymptoms.includes(symptom)}
            onPress={() => toggleSymptom(symptom)}
          />
        ))}
      </View>
      <Text
        style={[
          typography.h4,
          {
            color: colors.text,
            marginBottom: spacing.md,
          },
        ]}
      >
        Add Custom Symptom
      </Text>

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.sm,
          marginBottom: spacing.lg,
        }}
      >
        <TextInput
          value={customSymptom}
          onChangeText={setCustomSymptom}
          placeholder="Enter a symptom..."
          placeholderTextColor={colors.textLight}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            color: colors.text,
          }}
        />
        <Pressable
          onPress={handleAddCustom}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingHorizontal: spacing.md,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.white, fontSize: 18 }}>+</Text>
        </Pressable>
      </View>
      {selectedSymptoms.length > 0 && (
        <>
          <Text
            style={[
              typography.h4,
              {
                color: colors.text,
                marginBottom: spacing.md,
              },
            ]}
          >
            Selected Symptoms
          </Text>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginBottom: spacing.lg,
            }}
          >
            {selectedSymptoms.map((symptom) => (
              <Pressable
                key={symptom}
                onPress={() => toggleSymptom(symptom)}
                style={{
                  marginBottom: spacing.sm,
                  marginRight: spacing.sm,
                }}
              >
                <Badge variant="primary">
                  {symptom} ✕
                </Badge>
              </Pressable>
            ))}
          </View>
          <Button
            title={isAnalyzing ? 'Analyzing...' : 'Analyze Symptoms'}
            onPress={handleAnalyze}
            isLoading={isAnalyzing}
            fullWidth
            style={{ marginBottom: spacing.lg }}
          />
        </>
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          onDismiss={() => setError(null)}
          dismissAfter={5000}
        />
      )}
      {result && (
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
            Analysis Result
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
            {result}
          </Text>
          <Button
            title="Start Over"
            onPress={() => {
              setResult(null);
              setSelectedSymptoms([]);
            }}
            variant="secondary"
            fullWidth
            style={{ marginTop: spacing.lg }}
          />
        </Card>
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
          ⚠️ This tool is for informational purposes only. It does not replace
          professional medical advice. Always consult a qualified healthcare
          provider for proper diagnosis and treatment.
        </Text>
      </Card>
    </ScrollView>
  );
}
