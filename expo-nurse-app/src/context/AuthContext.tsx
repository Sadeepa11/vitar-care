import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceFcmTokenAsync } from '../utils/fcm';

type AuthContextType = {
  loggedIn: boolean;
  loading: boolean;
  login: (token?: string, email?: string, userId?: string, country?: string, fcmTokenFromLogin?: string) => Promise<void>;
  logout: () => Promise<void>;
  userEmail: string | null;
  authToken: string | null;
  userId: string | null;
  userCountry: string | null;
  fcmTokenToShow: string | null;
  showFcmModal: boolean;
  closeFcmModal: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_KEY = '@vitacare_session';
const TOKEN_KEY = '@vitacare_token';
const EMAIL_KEY = '@vitacare_email';
const USER_ID_KEY = '@vitacare_user_id';
const COUNTRY_KEY = '@vitacare_country';

// Simple JWT decoder fallback in pure JS
function decodeUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Polyfill window.atob for React Native
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let buffer = '';
    const cleaned = base64.replace(/=+$/, '');
    for (let i = 0; i < cleaned.length; i += 4) {
      const chunk =
        ((chars.indexOf(cleaned[i]) & 63) << 18) |
        (((i + 1 < cleaned.length ? chars.indexOf(cleaned[i + 1]) : 0) & 63) << 12) |
        (((i + 2 < cleaned.length ? chars.indexOf(cleaned[i + 2]) : 0) & 63) << 6) |
        ((i + 3 < cleaned.length ? chars.indexOf(cleaned[i + 3]) : 0) & 63);
      
      buffer += String.fromCharCode((chunk >> 16) & 255);
      if (i + 2 < cleaned.length) {
        buffer += String.fromCharCode((chunk >> 8) & 255);
      }
      if (i + 3 < cleaned.length) {
        buffer += String.fromCharCode(chunk & 255);
      }
    }
    
    const payload = JSON.parse(decodeURIComponent(
      buffer.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ));
    
    return String(payload.id || payload.userId || payload.user_id || payload.sub || null);
  } catch (e) {
    console.error('Error decoding JWT token', e);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string | null>(null);

  // FCM Token Modal states
  const [fcmTokenToShow, setFcmTokenToShow] = useState<string | null>(null);
  const [showFcmModal, setShowFcmModal] = useState(false);

  const closeFcmModal = () => {
    setShowFcmModal(false);
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const [val, token, email, storedUserId, storedCountry] = await Promise.all([
          AsyncStorage.getItem(SESSION_KEY),
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(EMAIL_KEY),
          AsyncStorage.getItem(USER_ID_KEY),
          AsyncStorage.getItem(COUNTRY_KEY),
        ]);
        if (val === 'true') {
          setLoggedIn(true);
          setAuthToken(token);
          setUserEmail(email);
          setUserCountry(storedCountry);
          
          if (storedUserId) {
            setUserId(storedUserId);
          } else if (token) {
            const decodedId = decodeUserIdFromToken(token);
            if (decodedId) {
              setUserId(decodedId);
              await AsyncStorage.setItem(USER_ID_KEY, decodedId);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load session', e);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (
    token?: string,
    email?: string,
    uId?: string,
    country?: string,
    fcmTokenFromLogin?: string
  ) => {
    try {
      let resolvedUserId = uId || '15';
      if (!uId && token) {
        const decodedId = decodeUserIdFromToken(token);
        if (decodedId) {
          resolvedUserId = decodedId;
        }
      }

      let resolvedCountry = country || null;
      if (!resolvedCountry && token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const cleaned = base64.replace(/=+$/, '');
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            let buffer = '';
            for (let i = 0; i < cleaned.length; i += 4) {
              const chunk =
                ((chars.indexOf(cleaned[i]) & 63) << 18) |
                (((i + 1 < cleaned.length ? chars.indexOf(cleaned[i + 1]) : 0) & 63) << 12) |
                (((i + 2 < cleaned.length ? chars.indexOf(cleaned[i + 2]) : 0) & 63) << 6) |
                ((i + 3 < cleaned.length ? chars.indexOf(cleaned[i + 3]) : 0) & 63);
              buffer += String.fromCharCode((chunk >> 16) & 255);
              if (i + 2 < cleaned.length) buffer += String.fromCharCode((chunk >> 8) & 255);
              if (i + 3 < cleaned.length) buffer += String.fromCharCode(chunk & 255);
            }
            const payload = JSON.parse(decodeURIComponent(
              buffer.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
            ));
            resolvedCountry = payload.country || payload.user?.country || payload.address?.country || null;
          }
        } catch (e) {
          console.error('Error decoding country from token', e);
        }
      }

      if (!resolvedCountry && email) {
        if (email.toLowerCase().includes('.lk') || email.toLowerCase().includes('lanka') || email.toLowerCase().includes('lk')) {
          resolvedCountry = 'Sri Lanka';
        } else if (email.toLowerCase().includes('.qa') || email.toLowerCase().includes('qatar') || email.toLowerCase().includes('qa')) {
          resolvedCountry = 'Qatar';
        } else {
          resolvedCountry = 'Qatar';
        }
      }

      await Promise.all([
        AsyncStorage.setItem(SESSION_KEY, 'true'),
        token ? AsyncStorage.setItem(TOKEN_KEY, token) : Promise.resolve(),
        email ? AsyncStorage.setItem(EMAIL_KEY, email) : Promise.resolve(),
        AsyncStorage.setItem(USER_ID_KEY, resolvedUserId),
        resolvedCountry ? AsyncStorage.setItem(COUNTRY_KEY, resolvedCountry) : Promise.resolve(),
      ]);

      setLoggedIn(true);
      if (token) setAuthToken(token);
      if (email) setUserEmail(email);
      setUserId(resolvedUserId);
      setUserCountry(resolvedCountry);

      // Handle FCM Token extraction & display modal after login
      let fcmTokenToDisplay = fcmTokenFromLogin || null;

      if (!fcmTokenToDisplay) {
        fcmTokenToDisplay = await getDeviceFcmTokenAsync();
      }

      if (fcmTokenToDisplay) {
        setFcmTokenToShow(fcmTokenToDisplay);
        setShowFcmModal(true);
      }
    } catch (e) {
      console.error('Failed to save session', e);
    }
  };

  const logout = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(SESSION_KEY),
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(EMAIL_KEY),
        AsyncStorage.removeItem(USER_ID_KEY),
        AsyncStorage.removeItem(COUNTRY_KEY),
      ]);
      setLoggedIn(false);
      setAuthToken(null);
      setUserEmail(null);
      setUserId(null);
      setUserCountry(null);
      setFcmTokenToShow(null);
      setShowFcmModal(false);
    } catch (e) {
      console.error('Failed to clear session', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        loggedIn,
        loading,
        login,
        logout,
        userEmail,
        authToken,
        userId,
        userCountry,
        fcmTokenToShow,
        showFcmModal,
        closeFcmModal,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
