import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { BACKGROUND_LOCATION_TASK } from '../tasks/locationTask';

const LOCATION_SHARING_KEY = '@vitacare_location_sharing';

type LocationContextType = {
  userCoords: [number, number] | null;
  servicesEnabled: boolean;
  permissionGranted: boolean;
  isLocationSharingEnabled: boolean;
  toggleLocationSharing: () => Promise<void>;
  requestLocation: () => Promise<[number, number] | null>;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { loggedIn, userId } = useAuth();
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [servicesEnabled, setServicesEnabled] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLocationSharingEnabled, setIsLocationSharingEnabled] = useState(true);
  const [prefLoaded, setPrefLoaded] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LOCATION_SHARING_KEY).then(val => {
      if (val !== null) setIsLocationSharingEnabled(val === 'true');
      setPrefLoaded(true);
    });
  }, []);

  const requestLocation = async (): Promise<[number, number] | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      if (!granted) return null;

      const enabled = await Location.hasServicesEnabledAsync();
      setServicesEnabled(enabled);
      if (!enabled) return null;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords: [number, number] = [loc.coords.longitude, loc.coords.latitude];
      setUserCoords(coords);
      return coords;
    } catch (e) {
      console.log('Error in requestLocation:', e);
      return null;
    }
  };

  const toggleLocationSharing = async () => {
    const newValue = !isLocationSharingEnabled;
    setIsLocationSharingEnabled(newValue);
    await AsyncStorage.setItem(LOCATION_SHARING_KEY, String(newValue));
  };

  useEffect(() => {
    if (!prefLoaded) return;

    if (!loggedIn || !userId || !isLocationSharingEnabled) {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      socketRef.current?.disconnect();
      socketRef.current = null;

      Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)
        .then(running => { if (running) Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK); })
        .catch(() => {});

      if (!loggedIn) setUserCoords(null);
      return;
    }

    const currentUserId = userId;

    async function startTracking() {
      try {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        const granted = fgStatus === 'granted';
        setPermissionGranted(granted);
        if (!granted) return;

        const enabled = await Location.hasServicesEnabledAsync();
        setServicesEnabled(enabled);
        if (!enabled) return;

        try {
          socketRef.current = io('https://vitar.medi.lk', {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 5000,
            reconnectionDelayMax: 10000,
            timeout: 8000,
          });
          socketRef.current.on('connect', () => console.log('[Nurse] Socket connected:', currentUserId));
          socketRef.current.on('connect_error', e => console.log('[Nurse] Socket error:', e.message));
          socketRef.current.on('disconnect', r => console.log('[Nurse] Socket disconnected:', r));
        } catch (err) {
          console.log('[Nurse] Socket init failed:', err);
        }

        try {
          const last = await Location.getLastKnownPositionAsync({});
          if (last) setUserCoords([last.coords.longitude, last.coords.latitude]);
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserCoords([loc.coords.longitude, loc.coords.latitude]);
        } catch (e) {
          console.log('[Nurse] Error getting initial location:', e);
        }

        const subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 30000, distanceInterval: 0 },
          (position) => {
            const { latitude, longitude, heading, speed } = position.coords;
            setUserCoords([longitude, latitude]);

            const numId = parseInt(currentUserId, 10);
            const resolvedId = isNaN(numId) ? currentUserId : numId;

            if (socketRef.current?.connected) {
              socketRef.current.emit('update_location', {
                user_id: resolvedId, latitude, longitude,
                heading: heading ?? 0, speed: speed ?? 0,
              });
            }
          }
        );
        subscriptionRef.current = subscription;

        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus === 'granted') {
          try {
            const running = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
            if (!running) {
              await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
                accuracy: Location.Accuracy.High,
                timeInterval: 30000,
                distanceInterval: 0,
                showsBackgroundLocationIndicator: true,
                foregroundService: {
                  notificationTitle: 'VitaCare Nurse',
                  notificationBody: 'Location sharing is active',
                  notificationColor: '#16A34A',
                },
              });
            }
          } catch (e) {
            console.log('[Nurse] Error starting background location:', e);
          }
        }
      } catch (error) {
        console.log('[Nurse] Failed to start tracking:', error);
      }
    }

    startTracking();

    return () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [loggedIn, userId, isLocationSharingEnabled, prefLoaded]);

  return (
    <LocationContext.Provider value={{
      userCoords, servicesEnabled, permissionGranted,
      isLocationSharingEnabled, toggleLocationSharing, requestLocation,
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (ctx === undefined) throw new Error('useLocation must be used within a LocationProvider');
  return ctx;
}
