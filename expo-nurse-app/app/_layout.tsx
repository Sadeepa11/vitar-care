import '../src/tasks/locationTask';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { LocationProvider } from '../src/context/LocationContext';
import LoginScreen from '../src/screens/LoginScreen';
import { FcmTokenModal } from '../src/components/FcmTokenModal';

function AppGate() {
  const { loggedIn, loading, showFcmModal, fcmTokenToShow, closeFcmModal } = useAuth();

  if (loading) {
    return null;
  }

  if (!loggedIn) {
    return (
      <>
        <LoginScreen />
        <FcmTokenModal
          visible={showFcmModal}
          token={fcmTokenToShow}
          onClose={closeFcmModal}
        />
      </>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="visit-detail"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
      </Stack>
      <FcmTokenModal
        visible={showFcmModal}
        token={fcmTokenToShow}
        onClose={closeFcmModal}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <LocationProvider>
            <AppGate />
            <StatusBar style="dark" />
          </LocationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
