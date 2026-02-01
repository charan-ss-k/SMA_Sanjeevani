import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { HealthProvider } from './src/context/HealthContext';
import { AppHeader } from './src/components';
import ttsService from './src/services/ttsService';
import { colors } from './src/utils/theme';

// Screens - Auth Flows
import AuthScreen from './src/screens/auth/AuthScreen';

// Screens - Main App
import HomeScreen from './src/screens/home/HomeScreen';
import ChatScreen from './src/screens/chat/ChatScreen';
import MedicineRecommendationScreen from './src/screens/medicine/MedicineRecommendationScreen';
import SymptomCheckerScreen from './src/screens/health/SymptomCheckerScreen';
import MedicineIdentificationScreen from './src/screens/health/MedicineIdentificationScreen';
import PrescriptionAnalyzerScreen from './src/screens/health/PrescriptionAnalyzerScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import ConsultDoctorScreen from './src/screens/consultations/ConsultDoctorScreen';
import RemindersScreen from './src/screens/reminders/RemindersScreen';
import PrescriptionScreen from './src/screens/prescription/PrescriptionScreen';

// Create SEPARATE navigator instances for each stack
const AuthStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const MedicineStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();
const ConsultStack = createNativeStackNavigator();
const RootTab = createBottomTabNavigator();

/**
 * Navigation Functions - Auth Stack
 */
const AuthStackScreen = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
      cardStyle: { backgroundColor: 'transparent' },
    }}
  >
    <AuthStack.Screen name="Auth" component={AuthScreen} />
  </AuthStack.Navigator>
);

/**
 * Home Stack - inside Tab Navigator
 */
const HomeStackScreen = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerShown: false, // Hide default header since we have AppHeader
    }}
  >
    <HomeStack.Screen
      name="HomeMain"
      component={HomeScreen}
      options={{ title: 'Sanjeevani' }}
    />
  </HomeStack.Navigator>
);

/**
 * Medicine Stack - inside Tab Navigator
 */
const MedicineStackScreen = () => (
  <MedicineStack.Navigator
    screenOptions={{
      headerShown: false, // Hide default header since we have AppHeader
    }}
  >
    <MedicineStack.Screen
      name="MedicineHome"
      component={MedicineRecommendationScreen}
      options={{ title: 'Medicine' }}
    />
    <MedicineStack.Screen
      name="SymptomChecker"
      component={SymptomCheckerScreen}
      options={{ title: 'Symptom Checker' }}
    />
    <MedicineStack.Screen
      name="MedicineIdentification"
      component={MedicineIdentificationScreen}
      options={{ title: 'Identify Medicine' }}
    />
    <MedicineStack.Screen
      name="PrescriptionAnalyzer"
      component={PrescriptionAnalyzerScreen}
      options={{ title: 'Analyze Prescription' }}
    />
  </MedicineStack.Navigator>
);

/**
 * Chat Stack - inside Tab Navigator
 */
const ChatStackScreen = () => (
  <ChatStack.Navigator
    screenOptions={{
      headerShown: false, // Hide default header since we have AppHeader
    }}
  >
    <ChatStack.Screen
      name="ChatMain"
      component={ChatScreen}
      options={{ title: 'AI Chat' }}
    />
  </ChatStack.Navigator>
);

/**
 * Consult Stack - inside Tab Navigator
 */
const ConsultStackScreen = () => (
  <ConsultStack.Navigator
    screenOptions={{
      headerShown: false, // Hide default header since we have AppHeader
    }}
  >
    <ConsultStack.Screen
      name="ConsultDoctor"
      component={ConsultDoctorScreen}
      options={{ title: 'Consult Doctor' }}
    />
  </ConsultStack.Navigator>
);

/**
 * Tab Navigator (Authenticated User View)
 */
const TabScreen = () => (
  <RootTab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#15803d', // Green-700 (matching header)
      tabBarInactiveTintColor: '#9CA3AF', // Gray-400
      tabBarShowLabel: false, // Hide labels, only show icons
      tabBarStyle: {
        backgroundColor: '#fef3c7', // Amber-100 (matching header)
        borderTopColor: '#fcd34d', // Amber-300 border
        borderTopWidth: 1,
        height: 65,
        paddingTop: 8,
        paddingBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      },
    }}
  >
    <RootTab.Screen
      name="HomeTab"
      component={HomeStackScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="home" size={28} color={color} />
        ),
      }}
    />
    <RootTab.Screen
      name="MedicineTab"
      component={MedicineStackScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <FontAwesome5 name="pills" size={24} color={color} />
        ),
      }}
    />
    <RootTab.Screen
      name="ChatTab"
      component={ChatStackScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="chatbubbles" size={28} color={color} />
        ),
      }}
    />
    <RootTab.Screen
      name="ConsultTab"
      component={ConsultStackScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <FontAwesome5 name="user-md" size={24} color={color} />
        ),
      }}
    />
    <RootTab.Screen
      name="PrescriptionTab"
      component={PrescriptionScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <FontAwesome5 name="file-prescription" size={24} color={color} />
        ),
      }}
    />
  </RootTab.Navigator>
);

/**
 * RootNavigator - Main conditional navigation
 * Must be inside NavigationContainer context
 */
const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <View style={{ flex: 1 }}>
          <TabScreen />
          <AppHeader />
        </View>
      ) : (
        <AuthStackScreen />
      )}
    </>
  );
};

/**
 * Root App Component
 * Wraps all providers and initialization
 */
export default function App() {
  useEffect(() => {
    // Initialize TTS service
    ttsService.initializeAudioSession();

    return () => {
      // Cleanup on app unmount
      ttsService.cleanup();
    };
  }, []);

  return (
    <NavigationContainer>
      <SafeAreaProvider>
        <AuthProvider>
          <ChatProvider>
            <HealthProvider>
              <RootNavigator />
            </HealthProvider>
          </ChatProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </NavigationContainer>
  );
}
