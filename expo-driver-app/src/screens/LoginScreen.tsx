import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP Verification States
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [otp, setOtp] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState('');

  const handleLogin = async () => {
    setError('');
    setResendStatus('');
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);

    try {
      const res = await authApi.login(email, password);
      setLoading(false);

      if (res.success) {
        // Successful login
        const userId = res.user?.id || res.user?.userId || res.user?.user_id || '';
        await login(res.token, email, userId ? String(userId) : undefined);
      } else {
        const msg = res.message || 'Login failed';
        setError(msg);

        // If the error message suggests verification is required, auto-switch to OTP step
        if (
          msg.toLowerCase().includes('verify') ||
          msg.toLowerCase().includes('verification') ||
          msg.toLowerCase().includes('otp') ||
          msg.toLowerCase().includes('unverified')
        ) {
          setStep('otp');
        }
      }
    } catch (e: any) {
      setLoading(false);
      setError(e.message || 'An unexpected error occurred');
    }
  };

  const handleVerifyEmail = async () => {
    setError('');
    setResendStatus('');
    if (!email || !otp) {
      setError('Please enter email and the OTP code');
      return;
    }
    setLoading(true);

    try {
      const res = await authApi.verifyEmail(email, otp);
      setLoading(false);

      if (res.success) {
        Alert.alert(
          'Email Verified',
          'Your email has been verified successfully! You can now log in.',
          [{ text: 'OK', onPress: () => setStep('login') }]
        );
        setOtp('');
      } else {
        setError(res.message || 'Verification failed. Please check the code.');
      }
    } catch (e: any) {
      setLoading(false);
      setError(e.message || 'An unexpected error occurred');
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResendStatus('');
    if (!email) {
      setError('Please enter email to resend OTP');
      return;
    }
    setResendLoading(true);

    try {
      const res = await authApi.resendOtp(email);
      setResendLoading(false);

      if (res.success) {
        setResendStatus('Verification code resent successfully!');
      } else {
        setError(res.message || 'Failed to send OTP. Please try again.');
      }
    } catch (e: any) {
      setResendLoading(false);
      setError(e.message || 'An unexpected error occurred');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          {paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20},
        ]}
        keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>VC</Text>
          </View>
          <Text style={brandStyle.brand}>VitaCare</Text>
          <View style={styles.appBadge}>
            <Text style={styles.appBadgeText}>🚐  Driver App</Text>
          </View>
          <Text style={styles.tagline}>Smart Transportation · Qatar</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {step === 'login' ? 'Driver Sign In' : 'Verify Email'}
          </Text>
          <Text style={styles.cardSub}>
            {step === 'login' ? 'Access your route and assignments' : 'Enter the OTP sent to your email'}
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          {resendStatus ? (
            <View style={styles.successBanner}>
              <Text style={styles.successText}>✓ {resendStatus}</Text>
            </View>
          ) : null}

          {step === 'login' ? (
            <>
              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputIcon}>✉</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="driver@vitacare.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                  />
                  <TouchableOpacity onPress={() => setShowPass(p => !p)}>
                    <Text style={styles.showBtn}>{showPass ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginBtn, loading && {opacity: 0.7}]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.loginBtnText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setError('');
                  setResendStatus('');
                  setStep('otp');
                }}
                style={styles.switchBtn}>
                <Text style={styles.switchBtnText}>Need to verify email? Enter OTP</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Email (verification target) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputIcon}>✉</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="driver@vitacare.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* OTP */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Code (OTP)</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputIcon}>🔑</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor="#9CA3AF"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Verify button */}
              <TouchableOpacity
                style={[styles.loginBtn, loading && {opacity: 0.7}]}
                onPress={handleVerifyEmail}
                activeOpacity={0.85}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.loginBtnText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

              {/* Resend OTP */}
              <TouchableOpacity
                style={[styles.resendBtn, resendLoading && { opacity: 0.6 }]}
                onPress={handleResendOtp}
                disabled={resendLoading}>
                {resendLoading ? (
                  <ActivityIndicator color="#0077B6" size="small" />
                ) : (
                  <Text style={styles.resendBtnText}>Resend Verification Code</Text>
                )}
              </TouchableOpacity>

              {/* Back to login */}
              <TouchableOpacity
                onPress={() => {
                  setError('');
                  setResendStatus('');
                  setStep('login');
                }}
                style={styles.backBtn}>
                <Text style={styles.backBtnText}>← Back to Sign In</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const brandStyle = StyleSheet.create({
  brand: {fontSize: 28, fontWeight: '800', color: '#0F172A', letterSpacing: 0.5},
});

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F0F4FF'},
  scroll: {flexGrow: 1, paddingHorizontal: 24},
  logoWrap: {alignItems: 'center', marginBottom: 28},
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#0077B6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0077B6',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    marginBottom: 12,
  },
  logoText: {color: '#FFF', fontSize: 26, fontWeight: '900', letterSpacing: 1},
  appBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  appBadgeText: {fontSize: 13, fontWeight: '700', color: '#1D4ED8'},
  tagline: {fontSize: 13, color: '#6B7280', marginTop: 6},
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  cardTitle: {fontSize: 22, fontWeight: '800', color: '#0F172A', marginBottom: 4},
  cardSub: {fontSize: 14, color: '#6B7280', marginBottom: 20},
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {fontSize: 13, color: '#DC2626', fontWeight: '600'},
  successBanner: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#0077B6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {fontSize: 13, color: '#0353A4', fontWeight: '600'},
  inputGroup: {marginBottom: 16},
  label: {fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 7},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {fontSize: 16, marginRight: 8},
  input: {flex: 1, fontSize: 15, color: '#111827'},
  showBtn: {fontSize: 13, fontWeight: '700', color: '#0077B6'},
  loginBtn: {
    backgroundColor: '#0077B6',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#0077B6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  loginBtnText: {color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5},
  switchBtn: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 8,
  },
  switchBtnText: {
    fontSize: 14,
    color: '#0077B6',
    fontWeight: '700',
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 8,
  },
  resendBtnText: {
    fontSize: 14,
    color: '#0077B6',
    fontWeight: '700',
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  hintCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
  },
  hintTitle: {fontSize: 12, fontWeight: '700', color: '#1D4ED8', marginBottom: 6},
  hintLine: {fontSize: 13, color: '#374151', marginBottom: 2},
  hintNote: {fontSize: 11, color: '#6B7280', fontStyle: 'italic', marginTop: 4},
});
