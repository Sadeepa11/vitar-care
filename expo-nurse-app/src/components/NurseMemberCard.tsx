import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Nurse, NurseStatus } from '../types';

const STATUS_COLOR: Record<NurseStatus, string> = {
  at_home: '#22C55E',
  in_transit: '#F59E0B',
  at_work: '#16A34A',
  sos: '#EF4444',
};
const STATUS_BG: Record<NurseStatus, string> = {
  at_home: '#F0FDF4',
  in_transit: '#FFFBEB',
  at_work: '#DCFCE7',
  sos: '#FFF1F2',
};
const STATUS_LABEL: Record<NurseStatus, string> = {
  at_home: 'At Home',
  in_transit: 'In Transit',
  at_work: 'Working',
  sos: '🆘 SOS Alert',
};

function Battery({ level }: { level: number }) {
  const color =
    level > 60 ? '#22C55E' : level > 20 ? '#F59E0B' : '#EF4444';
  return (
    <View style={batt.shell}>
      <View style={[batt.fill, { width: `${level}%` as any, backgroundColor: color }]} />
      <Text style={batt.label}>{level}%</Text>
    </View>
  );
}

const batt = StyleSheet.create({
  shell: {
    width: 38,
    height: 13,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  label: {
    fontSize: 7,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    zIndex: 1,
  },
});

interface Props {
  nurse: Nurse;
  isSelected: boolean;
  onPress: () => void;
}

export default function NurseMemberCard({ nurse, isSelected, onPress }: Props) {
  if (!nurse) return null;
  const status = nurse.status || 'at_home';
  const ringColor = STATUS_COLOR[status] || STATUS_COLOR.at_home;
  const initials = nurse.initials || 'N';
  const name = nurse.name || 'Nurse';
  const zone = nurse.zone || 'Doha';
  const lastSeen = nurse.lastSeen || 'Just now';
  const batteryLevel = typeof nurse.battery === 'number' && !isNaN(nurse.battery) ? nurse.battery : 100;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, isSelected && styles.cardActive]}>
      {/* Avatar */}
      <View style={[styles.avatar, { borderColor: ringColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
        <View style={[styles.dot, { backgroundColor: ringColor }]} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.meta}>
          {zone} · {lastSeen}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: STATUS_BG[status] || STATUS_BG.at_home },
          ]}>
          <Text style={[styles.badgeText, { color: ringColor }]}>
            {STATUS_LABEL[status] || STATUS_LABEL.at_home}
          </Text>
        </View>
      </View>

      {/* Right side */}
      <View style={styles.right}>
        <Battery level={batteryLevel} />
        <TouchableOpacity style={styles.callBtn}>
          <Text style={styles.callIcon}>📞</Text>
        </TouchableOpacity>
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
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2.5,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  dot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  right: {
    alignItems: 'center',
    gap: 8,
  },
  callBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    fontSize: 15,
  },
});
