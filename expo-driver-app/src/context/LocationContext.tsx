import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

type LocationContextType = {
  userCoords: [number, number] | null;
  servicesEnabled: boolean;
  permissionGranted: boolean;
  requestLocation: () => Promise<[number, number] | null>;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const DOHA_CENTER: [number, number] = [51.5310, 25.2854];

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { loggedIn, userId } = useAuth();
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [servicesEnabled, setServicesEnabled] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // Helper to fetch current location on-demand (e.g. when pressing Target/Location icon)
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

  useEffect(() => {
    if (!loggedIn || !userId) {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setUserCoords(null);
      return;
    }

    const currentUserId = userId;

    // Connect socket
    try {
      socketRef.current = io('https://vitar.medi.lk', {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 5000,
        reconnectionDelayMax: 10000,
        timeout: 8000,
        autoConnect: true,
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected for user ID:', currentUserId);
      });
      socketRef.current.on('connect_error', (error) => {
        console.log('Socket connection error:', error.message);
      });
      socketRef.current.on('error', (error) => {
        console.log('Socket error:', error);
      });
      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });
    } catch (err) {
      console.log('Socket init failed:', err);
    }

    async function startTracking() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === 'granted';
        setPermissionGranted(granted);
        if (!granted) {
          console.log('Location permission not granted');
          return;
        }

        const enabled = await Location.hasServicesEnabledAsync();
        setServicesEnabled(enabled);
        if (!enabled) {
          console.log('Location services are disabled in settings. Skipping position watch.');
          return;
        }

        // Get initial location
        try {
          const lastKnown = await Location.getLastKnownPositionAsync({});
          if (lastKnown) {
            setUserCoords([lastKnown.coords.longitude, lastKnown.coords.latitude]);
          }
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserCoords([loc.coords.longitude, loc.coords.latitude]);
        } catch (e) {
          console.log('Error getting initial location:', e);
        }

        // Start watching position
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
            timeInterval: 10000,
          },
          (position) => {
            const { latitude, longitude, heading, speed } = position.coords;
            const coords: [number, number] = [longitude, latitude];
            setUserCoords(coords);

            const numericUserId = parseInt(currentUserId, 10);
            const resolvedUserId = isNaN(numericUserId) ? currentUserId : numericUserId;

            if (socketRef.current?.connected) {
              socketRef.current.emit('update_location', {
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
        console.log('Failed to start location tracking in context:', error);
      }
    }

    startTracking();

    return () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [loggedIn, userId]);

  return (
    <LocationContext.Provider value={{ userCoords, servicesEnabled, permissionGranted, requestLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
