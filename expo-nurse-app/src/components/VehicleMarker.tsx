import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';

export interface Vehicle {
  id: string | number;
  name: string;
  driver: string;
  lat: number;
  lng: number;
  speed: number;
  heading?: number;
  vehicleNumber?: string;
  mobile?: string | null;
}

interface Props {
  vehicle: Vehicle;
  onPress?: () => void;
  distance?: string | null;
  duration?: string | null;
}

export default function VehicleMarker({ vehicle, onPress, distance, duration }: Props) {
  const [showPopover, setShowPopover] = useState(false);

  if (!vehicle) return null;
  const speed = typeof vehicle.speed === 'number' && !isNaN(vehicle.speed) ? vehicle.speed : 0;
  const moving = speed > 0;
  const name = vehicle.name || 'Vehicle';
  const heading = vehicle.heading ?? 0;

  const handlePress = () => {
    setShowPopover(!showPopover);
    if (onPress) onPress();
  };

  const hasDistanceInfo = Boolean(distance || duration);

  return (
    <View style={styles.wrapper}>
      {/* Real-time Distance & Time Popover for Pickup */}
      {hasDistanceInfo && !showPopover && (
        <View style={styles.topPopoverContainer}>
          <View style={styles.topPopoverBubble}>
            <Text style={styles.topPopoverTitle}>🚐 Driver Pickup</Text>
            <View style={styles.topPopoverRow}>
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
          </View>
          <View style={styles.topPopoverPointer} />
        </View>
      )}

      {/* Popover Bubble */}
      {showPopover && (
        <View style={styles.popover}>
          <View style={styles.popoverHeader}>
            <Text style={styles.driverName} numberOfLines={1}>
              👤 {vehicle.driver || 'Driver'}
            </Text>
            <TouchableOpacity onPress={() => setShowPopover(false)} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.popoverBody}>
            <Text style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle: </Text>
              <Text style={styles.infoVal}>{vehicle.vehicleNumber || 'N/A'}</Text>
            </Text>
            <Text style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone: </Text>
              <Text style={styles.infoVal}>{vehicle.mobile || 'N/A'}</Text>
            </Text>
            {moving && (
              <Text style={styles.infoRow}>
                <Text style={styles.infoLabel}>Speed: </Text>
                <Text style={styles.infoVal}>{speed} km/h</Text>
              </Text>
            )}
          </View>
          {vehicle.mobile ? (
            <TouchableOpacity
              style={styles.callBtn}
              activeOpacity={0.8}
              onPress={() => Linking.openURL(`tel:${vehicle.mobile}`)}
            >
              <Text style={styles.callBtnText}>📞 Call Driver</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.callBtn, styles.callBtnDisabled]}>
              <Text style={styles.callBtnTextDisabled}>📞 No Phone Number</Text>
            </View>
          )}
          {/* Arrow */}
          <View style={styles.popoverArrow} />
        </View>
      )}

      {/* Top View Vehicle SVG */}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
        <View style={[styles.svgContainer, { transform: [{ rotate: `${heading}deg` }] }]}>
          <Svg width={40} height={40} viewBox="0 0 40 40">
            {/* Wheels */}
            <Rect x="5" y="8" width="4" height="8" rx="1.5" fill="#1E293B" />
            <Rect x="31" y="8" width="4" height="8" rx="1.5" fill="#1E293B" />
            <Rect x="5" y="24" width="4" height="8" rx="1.5" fill="#1E293B" />
            <Rect x="31" y="24" width="4" height="8" rx="1.5" fill="#1E293B" />

            {/* Side Mirrors */}
            <Rect x="3" y="14" width="3" height="5" rx="1" fill="#475569" />
            <Rect x="34" y="14" width="3" height="5" rx="1" fill="#475569" />

            {/* Main Body */}
            <Rect x="7" y="4" width="26" height="32" rx="6" fill="#16A34A" stroke="#15803D" strokeWidth="2" />

            {/* Windshield */}
            <Path d="M11 12 Q20 8 29 12 L29 15 Q20 12 11 15 Z" fill="#E2E8F0" />

            {/* Cabin glass roof */}
            <Rect x="11" y="17" width="18" height="13" rx="2" fill="#34D399" opacity="0.6" />

            {/* Rear Window */}
            <Path d="M11 31 Q20 33 29 31 L29 32 Q20 34 11 32 Z" fill="#E2E8F0" />

            {/* Headlights */}
            <Circle cx="11" cy="6" r="1.2" fill="#FEF08A" />
            <Circle cx="29" cy="6" r="1.2" fill="#FEF08A" />
          </Svg>
        </View>

        {/* Small speed / status badge below vehicle */}
        <View style={[styles.badge, moving && styles.badgeMoving]}>
          <Text style={styles.badgeName}>{name}</Text>
          {moving ? (
            <Text style={styles.badgeSpeed}>{speed} km/h</Text>
          ) : (
            <Text style={styles.badgeSpeed}>Stopped</Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    position: 'relative',
    zIndex: 9999,
  },
  topPopoverContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  topPopoverBubble: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    alignItems: 'center',
  },
  topPopoverTitle: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topPopoverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  topPopoverPointer: {
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
  svgContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
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
  popover: {
    position: 'absolute',
    bottom: 85,
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    alignItems: 'stretch',
    zIndex: 99999,
  },
  popoverArrow: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderTopColor: '#FFFFFF',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  popoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 6,
    marginBottom: 6,
  },
  driverName: {
    fontWeight: '700',
    fontSize: 13,
    color: '#1F2937',
    flex: 1,
  },
  closeBtn: {
    padding: 2,
  },
  closeText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  popoverBody: {
    marginBottom: 8,
  },
  infoRow: {
    fontSize: 11,
    marginBottom: 4,
  },
  infoLabel: {
    color: '#6B7280',
    fontWeight: '600',
  },
  infoVal: {
    color: '#111827',
    fontWeight: '700',
  },
  callBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  callBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  callBtnTextDisabled: {
    color: '#9CA3AF',
    fontWeight: '700',
    fontSize: 11,
  },
});
