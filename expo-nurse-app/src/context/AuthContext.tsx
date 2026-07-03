import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
  loggedIn: boolean;
  loading: boolean;
  login: (token?: string, email?: string, userId?: string) => Promise<void>;
  logout: () => Promise<void>;
  userEmail: string | null;
  authToken: string | null;
  userId: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_KEY = '@vitacare_session';
const TOKEN_KEY = '@vitacare_token';
const EMAIL_KEY = '@vitacare_email';
const USER_ID_KEY = '@vitacare_user_id';

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

  useEffect(() => {
    const loadSession = async () => {
      try {
        const [val, token, email, storedUserId] = await Promise.all([
          AsyncStorage.getItem(SESSION_KEY),
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(EMAIL_KEY),
          AsyncStorage.getItem(USER_ID_KEY),
        ]);
        if (val === 'true') {
          setLoggedIn(true);
          setAuthToken(token);
          setUserEmail(email);
          
          if (storedUserId) {
            setUserId(storedUserId);
          } else if (token) {
            // Attempt to recover from token if userId is missing but token is present
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

  const login = async (token?: string, email?: string, uId?: string) => {
    try {
      let resolvedUserId = uId || '15'; // Default to 15 if not provided
      if (!uId && token) {
        const decodedId = decodeUserIdFromToken(token);
        if (decodedId) {
          resolvedUserId = decodedId;
        }
      }

      await Promise.all([
        AsyncStorage.setItem(SESSION_KEY, 'true'),
        token ? AsyncStorage.setItem(TOKEN_KEY, token) : Promise.resolve(),
        email ? AsyncStorage.setItem(EMAIL_KEY, email) : Promise.resolve(),
        AsyncStorage.setItem(USER_ID_KEY, resolvedUserId),
      ]);
      setLoggedIn(true);
      if (token) setAuthToken(token);
      if (email) setUserEmail(email);
      setUserId(resolvedUserId);
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
      ]);
      setLoggedIn(false);
      setAuthToken(null);
      setUserEmail(null);
      setUserId(null);
    } catch (e) {
      console.error('Failed to clear session', e);
    }
  };

  return (
    <AuthContext.Provider value={{ loggedIn, loading, login, logout, userEmail, authToken, userId }}>
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
