import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';

interface Props {
  name?: string;
  initials?: string;
  avatarUri?: string | null;
  accuracy?: number;
}

/**
 * UserLocationMarker — Custom Mapbox MarkerView component
 * Shows the logged-in nurse's profile photo (or initials fallback)
 * inside a styled green ring with a pulsing accuracy halo.
 */
export default function UserLocationMarker({
  name = 'You',
  initials = 'FA',
  avatarUri = null,
  accuracy = 20,
}: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse, {
            toValue: 1.6,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [pulse, opacity]);

  const safeName = name || 'You';
  const safeInitials = initials || 'FA';

  return (
    <View style={styles.wrapper}>
      {/* Pulsing accuracy halo */}
      <Animated.View
        style={[
          styles.halo,
          {
            transform: [{ scale: pulse }],
            opacity,
          },
        ]}
      />

      {/* Outer green ring */}
      <View style={styles.outerRing}>
        {/* Inner white ring */}
        <View style={styles.innerRing}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{safeInitials}</Text>
            </View>
          )}
        </View>
      </View>

      {/* YOU label */}
      <View style={styles.label}>
        <View style={styles.youDot} />
        <Text style={styles.labelText}>{safeName === 'You' ? 'You' : safeName.split(' ')[0]}</Text>
      </View>

      {/* Caret pointer */}
      <View style={styles.caret} />
    </View>
  );
}

const MARKER_SIZE = 56;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    // Extra padding so pulse halo isn't clipped
    padding: 24,
    paddingBottom: 0,
  },
  halo: {
    position: 'absolute',
    top: 8,
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: '#16A34A',
    zIndex: 0,
  },
  outerRing: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 2,
  },
  innerRing: {
    width: MARKER_SIZE - 6,
    height: MARKER_SIZE - 6,
    borderRadius: (MARKER_SIZE - 6) / 2,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: MARKER_SIZE - 6,
    height: MARKER_SIZE - 6,
    borderRadius: (MARKER_SIZE - 6) / 2,
  },
  initialsCircle: {
    width: MARKER_SIZE - 6,
    height: MARKER_SIZE - 6,
    borderRadius: (MARKER_SIZE - 6) / 2,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 0.5,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 5,
    gap: 5,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 2,
  },
  youDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#BBF7D0',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  caret: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#16A34A',
    marginTop: -1,
    zIndex: 2,
  },
});
