/**
 * Onboarding Screen
 * App introduction and welcome
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
} from 'react-native';
import { Button } from '../../components';
import { colors, spacing, typography, borderRadius } from '../../utils/theme';

const { width } = Dimensions.get('window');

const features = [
  {
    id: 1,
    title: 'AI Health Assistant',
    description:
      'Get instant health advice powered by advanced AI models',
    icon: '🤖',
  },
  {
    id: 2,
    title: 'Medicine Identification',
    description: 'Identify medicines by taking a photo with your phone',
    icon: '💊',
  },
  {
    id: 3,
    title: 'Prescription Analysis',
    description: 'Analyze prescriptions and get detailed medicine information',
    icon: '📋',
  },
  {
    id: 4,
    title: 'Audio Guidance',
    description:
      'Listen to health advice with our text-to-speech feature',
    icon: '🔊',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < features.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigation.navigate('Auth');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Auth');
  };

  const feature = features[currentStep];

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: spacing.lg,
        justifyContent: 'space-between',
      }}
    >
      <View style={{ alignItems: 'flex-end' }}>
        <Pressable onPress={handleSkip}>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
            Skip
          </Text>
        </Pressable>
      </View>
      <View style={{ alignItems: 'center', marginVertical: spacing.xl }}>
        <Text
          style={{
            fontSize: 80,
            marginBottom: spacing.lg,
          }}
        >
          {feature.icon}
        </Text>
        <Text
          style={[
            typography.h2,
            {
              color: colors.primary,
              marginBottom: spacing.md,
              textAlign: 'center',
            },
          ]}
        >
          {feature.title}
        </Text>
        <Text
          style={[
            typography.body,
            {
              color: colors.textSecondary,
              textAlign: 'center',
              marginBottom: spacing.lg,
            },
          ]}
        >
          {feature.description}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}
      >
        {features.map((_, index) => (
          <View
            key={index}
            style={{
              width: index === currentStep ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                index === currentStep ? colors.secondary : colors.border,
              marginHorizontal: spacing.sm,
            }}
          />
        ))}
      </View>
      <View style={{ gap: spacing.md }}>
        <Button
          title={currentStep === features.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          fullWidth
          size="lg"
        />
        <Button
          title="Go to Login"
          variant="outline"
          onPress={handleSkip}
          fullWidth
          size="lg"
        />
      </View>
    </ScrollView>
  );
}
