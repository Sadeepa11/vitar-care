import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Vehicle } from '../types';

interface Props {
  vehicle: Vehicle;
  onPress?: () => void;
}

export default function VehicleMarker({ vehicle, onPress }: Props) {
  if (!vehicle) return null;
  const speed = typeof vehicle.speed === 'number' && !isNaN(vehicle.speed) ? vehicle.speed : 0;
  const moving = speed > 0;
  const name = vehicle.name || 'Vehicle';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.wrapper}>
      <View style={[styles.box, moving && styles.boxMoving]}>
        <Text style={styles.icon}>🚐</Text>
      </View>
      <View style={[styles.badge, moving && styles.badgeMoving]}>
        <Text style={styles.badgeName}>{name}</Text>
        {moving ? (
          <Text style={styles.badgeSpeed}>{speed} km/h</Text>
        ) : (
          <Text style={styles.badgeSpeed}>Stopped</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  box: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7,
  },
  boxMoving: {
    backgroundColor: '#15803D',
  },
  icon: {
    fontSize: 22,
  },
  badge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 3,
    alignItems: 'center',
  },
  badgeMoving: {
    backgroundColor: '#15803D',
  },
  badgeName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  badgeSpeed: {
    fontSize: 9,
    color: '#BBF7D0',
  },
});
