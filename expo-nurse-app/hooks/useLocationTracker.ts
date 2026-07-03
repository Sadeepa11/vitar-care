import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../src/context/AuthContext';

export function useLocationTracker() {
  const { loggedIn, userId } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!loggedIn || !userId) {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const currentUserId = userId;
    let socket: Socket | null = null;

    try {
     
      socket = io('https://vitar.medi.lk:8000', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
        reconnectionDelayMax: 10000,
        timeout: 10000,
        autoConnect: true,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Socket connected for user ID:', currentUserId);
      });

      socket.on('connect_error', (error) => {
        console.log('❌ Socket connection error:', error.message);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
      });
    } catch (err) {
      console.log('Socket init failed:', err);
      socket = null;
      socketRef.current = null;
    }

    async function startTracking() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission not granted');
          return;
        }

        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          console.log('Location services are disabled in settings. Skipping position watch.');
          return;
        }

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
            timeInterval: 10000,
          },
          (position) => {
            const { latitude, longitude, heading, speed } = position.coords;

            const numericUserId = parseInt(currentUserId, 10);
            const resolvedUserId = isNaN(numericUserId) ? currentUserId : numericUserId;


            if (socket && socket.connected) {
              console.log(`📡 Emitting location for user ${resolvedUserId}`);
              socket.emit('update_location', {
                user_id: resolvedUserId,
                latitude,
                longitude,
                heading: heading ?? 0,
                speed: speed ?? 0,
              });
            }
          }
        );

        subscriptionRef.current = subscription;
      } catch (error) {
        console.log('Failed to start location tracking:', error);
      }
    }

    startTracking();

    return () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      if (socket) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [loggedIn, userId]);
}
