import "react-native-get-random-values";
import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
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

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
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
  );
}
