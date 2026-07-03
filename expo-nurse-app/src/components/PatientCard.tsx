import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Patient } from '../types';

interface Props {
  patient: Patient;
  isSelected: boolean;
  onPress: () => void;
}

export default function PatientCard({ patient, isSelected, onPress }: Props) {
  if (!patient) return null;
  const name = patient.name || 'Patient';
  const address = patient.address || '—';
  const phone = patient.phone || '—';
  const condition = patient.condition;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, isSelected && styles.cardActive]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarIcon}>🏥</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.meta} numberOfLines={1}>📍 {address}</Text>
        {condition ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{condition}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.right}>
        <Text style={styles.phoneLabel}>📞</Text>
        <Text style={styles.phone} numberOfLines={1}>{phone}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFF',
  },
  cardActive: {
    backgroundColor: '#FFF1F2',
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2.5,
    borderColor: '#EF4444',
    backgroundColor: '#FFF1F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  avatarIcon: { fontSize: 22 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  meta: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#EF4444' },
  right: { alignItems: 'flex-end', gap: 2 },
  phoneLabel: { fontSize: 14 },
  phone: { fontSize: 11, color: '#6B7280', maxWidth: 80 },
});
