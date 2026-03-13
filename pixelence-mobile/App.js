import "react-native-get-random-values";
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import AppointmentsScreen from './screens/AppointmentsScreen';
import ReportsScreen from './screens/ReportsScreen';
import ReportDetailScreen from './screens/ReportDetailScreen';
import AppointmentDetailScreen from './screens/AppointmentDetailScreen';
import DicomViewerScreen from './screens/DicomViewerScreen';

// Initialize the Convex client
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
console.log('Initializing Convex with URL:', convexUrl);

if (!convexUrl) {
  console.error('EXPO_PUBLIC_CONVEX_URL is not defined! Check your .env file.');
}

const convex = new ConvexReactClient(convexUrl || 'https://placeholder.convex.cloud');

const Stack = createNativeStackNavigator();

console.log('App module evaluated');

export default function App() {
  const [user, setUser] = useState(null);
  console.log('App rendering, user state:', user ? 'logged in' : 'logged out');

  const handleLogin = (userData) => {
    console.log('User logged in:', userData);
    setUser(userData);
  };

  const handleLogout = () => {
    console.log('User logged out');
    setUser(null);
  };

  try {
    return (
      <ConvexProvider client={convex}>
        <SafeAreaProvider>
          <NavigationContainer onReady={() => console.log('Navigation ready')}>
            <StatusBar style="dark" />
            <Stack.Navigator 
              screenOptions={{ headerShown: false }}
              screenListeners={{
                state: (e) => {
                  console.log('Navigation state change:', e.data.state.routes.map(r => r.name));
                }
              }}
            >
              {!user ? (
                <Stack.Screen name="Login">
                  {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
                </Stack.Screen>
              ) : (
                <>
                  <Stack.Screen name="Dashboard">
                    {(props) => <DashboardScreen {...props} user={user} onLogout={handleLogout} />}
                  </Stack.Screen>
                  <Stack.Screen name="Appointments" component={AppointmentsScreen} />
                  <Stack.Screen name="Reports" component={ReportsScreen} />
                  <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
                  <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
                  <Stack.Screen name="DicomViewer" component={DicomViewerScreen} />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </ConvexProvider>
    );
  } catch (error) {
    console.error('App render crash:', error);
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
