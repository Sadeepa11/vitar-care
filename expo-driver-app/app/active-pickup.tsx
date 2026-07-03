import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
const ASSIGNED_NURSES: any[] = [];

function getHaversineDistance(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ActivePickupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { nurseId } = useLocalSearchParams<{ nurseId: string }>();
  const actualNurseId = nurseId ?? '1';
  const nurse = ASSIGNED_NURSES.find(n => n.id === actualNurseId) ?? ASSIGNED_NURSES[0] ?? {
    id: '',
    name: 'Unknown Nurse',
    initials: 'UN',
    lat: 0,
    lng: 0,
    address: 'No Address',
    zone: 'None',
    phone: '',
    pickupOrder: 0,
    status: 'waiting',
    etaMinutes: 0,
  };

  const [distance, setDistance] = useState(2.4);
  const [isUsingGps, setIsUsingGps] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const currentDist = getHaversineDistance(
        loc.coords.longitude,
        loc.coords.latitude,
        nurse.lng,
        nurse.lat
      );
      setDistance(currentDist);
      setIsUsingGps(true);

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10,
        },
        (newLoc) => {
          const newDist = getHaversineDistance(
            newLoc.coords.longitude,
            newLoc.coords.latitude,
            nurse.lng,
            nurse.lat
          );
          setDistance(newDist);
          setIsUsingGps(true);
        }
      );
    })();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [nurse.lng, nurse.lat]);

  const handleCall = () => {
    Linking.openURL(`tel:${nurse.phone}`);
  };

  const handleNavigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${nurse.lat},${nurse.lng}&travelmode=driving`;
    Linking.openURL(url);
  };

  const handleConfirm = () => {
    Alert.alert(
      'Confirm Pickup',
      `Mark ${nurse.name} as picked up?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Confirm',
          onPress: () => {
            setConfirmed(true);
            setTimeout(() => router.back(), 1200);
          },
        },
      ],
    );
  };

  const total = ASSIGNED_NURSES.length;
  const progress = nurse.pickupOrder;

  const displayEta = Math.max(1, Math.round(distance * 2.5));

  return (
    <View style={[s.root, {paddingTop: insets.top}]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Active Pickup</Text>
        <View style={s.progressChip}>
          <Text style={s.progressChipText}>{progress}/{total}</Text>
        </View>
      </View>

      <View style={[s.body, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {/* Distance indicator */}
        <View style={s.distanceCard}>
          <Text style={s.distanceNum}>{distance.toFixed(2)}</Text>
          <Text style={s.distanceUnit}>km away</Text>
          <View style={s.distanceBar}>
            <View style={[s.distanceFill, {width: `${Math.max(10, Math.min(100, (1 - distance / 5) * 100))}%` as any}]} />
          </View>
          <Text style={s.distanceEta}>
            {isUsingGps ? '🟢 Live GPS' : '⏳ Estimating'} · ETA: {displayEta} minutes
          </Text>
        </View>

        {/* Nurse info */}
        <View style={s.nurseCard}>
          <View style={s.nurseAvatar}>
            <Text style={s.nurseAvatarText}>{nurse.initials}</Text>
            <View style={s.orderBadge}>
              <Text style={s.orderText}>{nurse.pickupOrder}</Text>
            </View>
          </View>
          <View style={s.nurseInfo}>
            <Text style={s.nurseName}>{nurse.name}</Text>
            <Text style={s.nursePhone}>{nurse.phone}</Text>
            <Text style={s.nurseAddr} numberOfLines={2}>📍 {nurse.address}</Text>
          </View>
        </View>

        {/* Proximity alerts */}
        <View style={s.alertsCard}>
          <Text style={s.alertsTitle}>Auto Notifications Sent To Nurse</Text>
          <View style={s.alertRow}>
            <View style={[s.alertDot, distance < 1 ? s.alertDotActive : {}]} />
            <Text style={[s.alertText, distance < 1 ? s.alertTextActive : {}]}>
              1 km away — "Get ready"
            </Text>
            {distance < 1 && <Text style={s.alertSent}>✓ Sent</Text>}
          </View>
          <View style={s.alertRow}>
            <View style={[s.alertDot, distance < 0.5 ? s.alertDotActive : {}]} />
            <Text style={[s.alertText, distance < 0.5 ? s.alertTextActive : {}]}>
              500 m away — "Come outside"
            </Text>
            {distance < 0.5 && <Text style={s.alertSent}>✓ Sent</Text>}
          </View>
          <View style={s.alertRow}>
            <View style={[s.alertDot, distance < 0.1 ? s.alertDotActive : {}]} />
            <Text style={[s.alertText, distance < 0.1 ? s.alertTextActive : {}]}>
              100 m away — "Vehicle arrived"
            </Text>
            {distance < 0.1 && <Text style={s.alertSent}>✓ Sent</Text>}
          </View>
        </View>

        {/* Action buttons */}
        <View style={s.actions}>
          <TouchableOpacity style={s.callBtn} onPress={handleCall}>
            <Text style={s.callBtnIcon}>📞</Text>
            <Text style={s.callBtnText}>Call Nurse</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.navBtn} onPress={handleNavigate}>
            <Text style={s.navBtnIcon}>🧭</Text>
            <Text style={s.navBtnText}>Navigate</Text>
          </TouchableOpacity>
        </View>

        {/* Confirm button */}
        <TouchableOpacity
          style={[s.confirmBtn, confirmed && s.confirmBtnDone]}
          onPress={handleConfirm}
          disabled={confirmed}
          activeOpacity={0.85}>
          <Text style={s.confirmIcon}>{confirmed ? '✓' : '🚌'}</Text>
          <Text style={s.confirmText}>
            {confirmed ? 'Picked Up!' : 'Confirm Pickup'}
          </Text>
        </TouchableOpacity>

        {/* Simulate approach (only if GPS permission is not active or for testing) */}
        {!isUsingGps && (
          <TouchableOpacity
            style={s.simBtn}
            onPress={() => setDistance(d => Math.max(0, d - 0.5))}>
            <Text style={s.simText}>⚡ Simulate approach (demo)</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F8FAFC'},
  header: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {width: 36, height: 36, justifyContent: 'center'},
  backIcon: {fontSize: 22, color: '#374151'},
  headerTitle: {fontSize: 17, fontWeight: '800', color: '#0F172A'},
  progressChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  progressChipText: {fontSize: 13, fontWeight: '800', color: '#0077B6'},
  body: {flex: 1, padding: 16},
  distanceCard: {
    backgroundColor: '#0077B6',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#0077B6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  distanceNum: {fontSize: 56, fontWeight: '900', color: '#FFF', lineHeight: 64},
  distanceUnit: {fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 12},
  distanceBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  distanceFill: {height: '100%', backgroundColor: '#FFF', borderRadius: 4},
  distanceEta: {fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600'},
  nurseCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  nurseAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#0077B6',
    position: 'relative',
  },
  nurseAvatarText: {fontSize: 20, fontWeight: '900', color: '#0077B6'},
  orderBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0077B6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  orderText: {fontSize: 10, fontWeight: '800', color: '#FFF'},
  nurseInfo: {flex: 1},
  nurseName: {fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 3},
  nursePhone: {fontSize: 13, color: '#0077B6', fontWeight: '600', marginBottom: 4},
  nurseAddr: {fontSize: 12, color: '#6B7280'},
  alertsCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  alertsTitle: {fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 10, textTransform: 'uppercase'},
  alertRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8},
  alertDot: {width: 10, height: 10, borderRadius: 5, backgroundColor: '#E5E7EB'},
  alertDotActive: {backgroundColor: '#22C55E'},
  alertText: {flex: 1, fontSize: 13, color: '#9CA3AF'},
  alertTextActive: {color: '#111827', fontWeight: '600'},
  alertSent: {fontSize: 11, fontWeight: '700', color: '#22C55E'},
  actions: {flexDirection: 'row', gap: 10, marginBottom: 12},
  callBtn: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  callBtnIcon: {fontSize: 24, marginBottom: 4},
  callBtnText: {fontSize: 13, fontWeight: '700', color: '#15803D'},
  navBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  navBtnIcon: {fontSize: 24, marginBottom: 4},
  navBtnText: {fontSize: 13, fontWeight: '700', color: '#1D4ED8'},
  confirmBtn: {
    backgroundColor: '#0077B6',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    shadowColor: '#0077B6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmBtnDone: {backgroundColor: '#22C55E'},
  confirmIcon: {fontSize: 22},
  confirmText: {fontSize: 17, fontWeight: '800', color: '#FFF'},
  simBtn: {alignItems: 'center', paddingVertical: 8},
  simText: {fontSize: 12, color: '#9CA3AF'},
});
