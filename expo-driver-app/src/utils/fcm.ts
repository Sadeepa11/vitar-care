import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure foreground notification presentation handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Helper to fetch device FCM / Push token
 */
export async function getDeviceFcmTokenAsync(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return null;
    }

    // Set default channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0077B6',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[FCM] Notification permissions not granted');
      return null;
    }

    // Try fetching native Android/iOS FCM device push token
    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      if (deviceToken && deviceToken.data) {
        const tokenStr = typeof deviceToken.data === 'string' 
          ? deviceToken.data 
          : JSON.stringify(deviceToken.data);
        console.log('[FCM] Native device token retrieved:', tokenStr);
        return tokenStr;
      }
    } catch (e) {
      console.log('[FCM] Native getDevicePushTokenAsync failed, attempting Expo Push token fallback:', e);
    }

    // Fallback to Expo Push Token
    try {
      const expoToken = await Notifications.getExpoPushTokenAsync();
      if (expoToken && expoToken.data) {
        console.log('[FCM] Expo push token retrieved:', expoToken.data);
        return expoToken.data;
      }
    } catch (e) {
      console.log('[FCM] getExpoPushTokenAsync failed:', e);
    }

  } catch (error) {
    console.error('[FCM] Unexpected error fetching FCM token:', error);
  }
  return null;
}
