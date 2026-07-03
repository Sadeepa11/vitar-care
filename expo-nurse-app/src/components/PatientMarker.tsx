import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Patient } from '../types';

const PATIENT_COLOR = '#EF4444';

interface Props {
  patient: Patient;
  isSelected: boolean;
  onPress: () => void;
}

export default function PatientMarker({ patient, isSelected, onPress }: Props) {
  const size = isSelected ? 48 : 40;
  const firstName = (patient.name || 'Patient').split(' ')[0];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.wrapper}>
      <View
        style={[
          styles.pin,
          { width: size, height: size, borderRadius: size / 2 },
          isSelected && styles.pinSelected,
        ]}>
        <Text style={[styles.icon, isSelected && styles.iconSelected]}>🏥</Text>
      </View>
      <View style={[styles.label, isSelected && styles.labelSelected]}>
        <Text
          style={[styles.labelText, isSelected && styles.labelTextSelected]}
          numberOfLines={1}>
          {firstName}
        </Text>
      </View>
      <View style={[styles.caret, isSelected && styles.caretSelected]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  pin: {
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: PATIENT_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PATIENT_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7,
  },
  pinSelected: {
    backgroundColor: '#FFF1F2',
    borderWidth: 3.5,
  },
  icon: { fontSize: 16 },
  iconSelected: { fontSize: 20 },
  label: {
    backgroundColor: '#FFF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 3,
  },
  labelSelected: { backgroundColor: PATIENT_COLOR },
  labelText: { fontSize: 11, fontWeight: '600', color: '#111827' },
  labelTextSelected: { color: '#FFF' },
  caret: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderTopColor: '#FFF',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  caretSelected: { borderTopColor: PATIENT_COLOR },
});
