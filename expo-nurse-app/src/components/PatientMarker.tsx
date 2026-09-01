import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Patient } from '../types';

const PATIENT_COLOR = '#EF4444';

interface Props {
  patient: Patient;
  isSelected: boolean;
  onPress: () => void;
  distance?: string | null;
  duration?: string | null;
}

export default function PatientMarker({ patient, isSelected, onPress, distance, duration }: Props) {
  const size = isSelected ? 48 : 40;
  const svgSize = isSelected ? 24 : 20;
  const firstName = (patient.name || 'Patient').split(' ')[0];
  const hasPopover = Boolean(distance || duration);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.wrapper}>
      {/* Popover showing Distance & Estimated Time */}
      {hasPopover && (
        <View style={styles.popoverContainer}>
          <View style={styles.popoverBubble}>
            {distance ? (
              <View style={styles.popoverItem}>
                <Text style={styles.popoverIcon}>📍</Text>
                <Text style={styles.popoverText}>{distance}</Text>
              </View>
            ) : null}
            {distance && duration ? <Text style={styles.popoverDot}>•</Text> : null}
            {duration ? (
              <View style={styles.popoverItem}>
                <Text style={styles.popoverIcon}>⏱️</Text>
                <Text style={styles.popoverText}>{duration}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.popoverPointer} />
        </View>
      )}

      <View
        style={[
          styles.pin,
          { width: size, height: size, borderRadius: size / 2 },
          isSelected && styles.pinSelected,
        ]}>
        <Svg
          width={svgSize}
          height={svgSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke={PATIENT_COLOR}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path
            d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            fill={isSelected ? '#FFE4E6' : '#FFF'}
          />
          <Path d="M9 22V12h6v10" />
        </Svg>
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
  popoverContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  popoverBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    gap: 5,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  popoverIcon: {
    fontSize: 11,
  },
  popoverText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  popoverDot: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    marginHorizontal: 2,
  },
  popoverPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0F172A',
    alignSelf: 'center',
    marginTop: -1,
  },
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
