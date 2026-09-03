import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ToastAndroid,
  Platform,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';

interface FcmTokenModalProps {
  visible: boolean;
  token: string | null;
  onClose: () => void;
}

export function FcmTokenModal({ visible, token, onClose }: FcmTokenModalProps) {
  const [copied, setCopied] = useState(false);

  if (!visible || !token) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(token);
      setCopied(true);
      if (Platform.OS === 'android') {
        ToastAndroid.show('FCM Token copied to clipboard!', ToastAndroid.SHORT);
      }
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Error copying token to clipboard:', e);
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🔔</Text>
            </View>
            <Text style={styles.title}>FCM Push Token</Text>
            <Text style={styles.subtitle}>
              Here is your FCM device token generated at login:
            </Text>
          </View>

          <View style={styles.tokenBox}>
            <ScrollView
              nestedScrollEnabled
              style={{ maxHeight: 120 }}
              contentContainerStyle={{ padding: 4 }}>
              <Text style={styles.tokenText} selectable>
                {token}
              </Text>
            </ScrollView>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.btn, styles.copyBtn, copied && styles.copiedBtn]}
              onPress={handleCopy}
              activeOpacity={0.8}>
              <Text style={styles.copyBtnText}>
                {copied ? '✓ Copied to Clipboard!' : '📋 Copy FCM Token'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.closeBtn]}
              onPress={onClose}
              activeOpacity={0.8}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  tokenBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  tokenText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#0F172A',
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 10,
  },
  btn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyBtn: {
    backgroundColor: '#16A34A',
  },
  copiedBtn: {
    backgroundColor: '#15803D',
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  closeBtnText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
  },
});
