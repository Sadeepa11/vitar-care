import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';

export const BACKGROUND_LOCATION_TASK = 'vitacare-nurse-bg-location';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.log('[Nurse BG Location] Error:', error.message);
    return;
  }
  if (!data) return;

  const { locations } = data as { locations: Location.LocationObject[] };
  const location = locations[0];
  if (!location) return;

  try {
    const userId = await AsyncStorage.getItem('@vitacare_user_id');
    if (!userId) return;

    const numericId = parseInt(userId, 10);
    const resolvedId = isNaN(numericId) ? userId : numericId;
    const { latitude, longitude, heading, speed } = location.coords;

    await new Promise<void>((resolve) => {
      const socket = io('https://vitar.medi.lk', {
        transports: ['websocket'],
        timeout: 8000,
        reconnection: false,
      });

      const cleanup = () => { socket.disconnect(); resolve(); };
      const fallback = setTimeout(cleanup, 9000);

      socket.once('connect', () => {
        socket.emit('update_location', {
          user_id: resolvedId,
          latitude,
          longitude,
          heading: heading ?? 0,
          speed: speed ?? 0,
        });
        clearTimeout(fallback);
        setTimeout(cleanup, 800);
      });

      socket.once('connect_error', () => {
        clearTimeout(fallback);
        cleanup();
      });
    });
  } catch (e) {
    console.log('[Nurse BG Location] Exception:', e);
  }
});
