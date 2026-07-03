import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Nurse, NurseStatus } from '../types';

const STATUS_COLORS: Record<NurseStatus, string> = {
  at_home: '#22C55E',
  in_transit: '#F59E0B',
  at_work: '#16A34A',
  sos: '#EF4444',
};

interface Props {
  nurse: Nurse;
  isSelected: boolean;
  onPress: () => void;
}

export default function NurseAvatarMarker({ nurse, isSelected, onPress }: Props) {
  if (!nurse) return null;
  const status = nurse.status || 'at_home';
  const ringColor = STATUS_COLORS[status] || STATUS_COLORS.at_home;
  const size = isSelected ? 52 : 44;
  const fontSize = isSelected ? 15 : 13;
  const initials = nurse.initials || 'N';
  const name = nurse.name || 'Nurse';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.wrapper}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: ringColor,
            shadowColor: ringColor,
          },
          isSelected && styles.ringSelected,
        ]}>
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        <View style={[styles.dot, { backgroundColor: ringColor }]} />
      </View>
      <View style={[styles.label, isSelected && { backgroundColor: ringColor }]}>
        <Text
          style={[styles.labelText, isSelected && { color: '#FFF' }]}
          numberOfLines={1}>
          {name.split(' ')[0]}
        </Text>
      </View>
      <View style={[styles.caret, { borderTopColor: isSelected ? ringColor : '#FFF' }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  ring: {
    borderWidth: 3,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 7,
  },
  ringSelected: {
    borderWidth: 3.5,
  },
  initials: {
    fontWeight: '700',
    color: '#1A1A2E',
  },
  dot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
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
  labelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  caret: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
