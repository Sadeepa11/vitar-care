import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/context/AuthContext';
import { trackingApi } from '../../src/services/api';

export interface AssignedRouteStop {
  id: string; // trip nurse id
  patientName: string;
  nurseName: string;
  nursePhone: string;
  address: string;
  lat: number;
  lng: number;
  pickupOrder: number;
  status: 'dropped' | 'waiting';
  etaMinutes: number;
}

const parseCoordinates = (item: any): { lat: number; lng: number } | null => {
  if (!item) return null;
  let lat = Number(item.latitude ?? item.lat);
  let lng = Number(item.longitude ?? item.lng);

  if ((!lat || !lng || isNaN(lat) || isNaN(lng)) && item.map_link) {
    const match = item.map_link.match(/[?&]q=([^&]+)/);
    if (match && match[1]) {
      const parts = match[1].split(',');
      const parsedLat = parseFloat(parts[0]);
      const parsedLng = parseFloat(parts[1]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        lat = parsedLat;
        lng = parsedLng;
      }
    }
  }

  if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
    return { lat, lng };
  }
  return null;
};

export default function RouteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { authToken } = useAuth();

  const [stops, setStops] = useState<AssignedRouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [droppedMap, setDroppedMap] = useState<Record<string, number>>({});

  const loadData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setLoading(true);
    try {
      const stored = await AsyncStorage.getItem('driver_dropped_nurses');
      const parsedDropped = stored ? JSON.parse(stored) : {};
      
      const cleanedDropped: Record<string, number> = {};
      const now = Date.now();
      const limit = 24 * 60 * 60 * 1000; // 24 hours
      Object.entries(parsedDropped).forEach(([key, val]) => {
        if (typeof val === 'number' && now - val < limit) {
          cleanedDropped[key] = val;
        }
      });
      setDroppedMap(cleanedDropped);

      if (!authToken) {
        setStops([]);
        return;
      }

      const result = await trackingApi.getDriverNurses(authToken);
      if (result.success && result.data && result.data.tripNurses) {
        const parsed = result.data.tripNurses.map((item: any, index: number) => {
          const nurseObj = item.nurse || {};
          const patientObj = item.patient || {};
          const patientCoords = parseCoordinates(patientObj) || { lat: 0, lng: 0 };

          const idStr = String(item.id);
          const isDropped = cleanedDropped[idStr] !== undefined;

          return {
            id: idStr,
            patientName: String(patientObj.name || 'Patient'),
            nurseName: String(nurseObj.name || 'Nurse'),
            nursePhone: String(nurseObj.phone || nurseObj.mobile || ''),
            address: String(patientObj.address || 'No Address'),
            lat: patientCoords.lat,
            lng: patientCoords.lng,
            pickupOrder: index + 1,
            status: isDropped ? 'dropped' : 'waiting',
            etaMinutes: item.etaMinutes || 15,
          } as AssignedRouteStop;
        });
        setStops(parsed);
      } else {
        setStops([]);
      }
    } catch (err) {
      console.error("Error loading today's route stops:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authToken]);

  useFocusEffect(
    useCallback(() => {
      loadData(true);
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [loadData]);

  const droppedCount = stops.filter(s => s.status === 'dropped').length;
  const nextStop = stops.find(s => s.status === 'waiting');

  const handleDropOff = async (id: string) => {
    try {
      const updated = { ...droppedMap, [id]: Date.now() };
      setDroppedMap(updated);
      await AsyncStorage.setItem('driver_dropped_nurses', JSON.stringify(updated));

      setStops(prev =>
        prev.map(s => (s.id === id ? {...s, status: 'dropped'} : s)),
      );
      Alert.alert('Dropped Off ✓', 'Nurse marked as dropped off.');
    } catch (e) {
      console.error('Failed to save drop-off status:', e);
    }
  };

  const handleNavigate = (stop: AssignedRouteStop) => {
    router.push({
      pathname: '/active-pickup',
      params: { nurseId: stop.id }
    });
  };

  return (
    <View style={[s.root, {paddingTop: insets.top}]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Today's Route</Text>
        <Text style={s.headerSub}>Van-01 · Morning Shift</Text>
      </View>

      {/* Progress Card */}
      <View style={s.progressCard}>
        <View style={s.progressInfo}>
          <Text style={s.progressNum}>
            {droppedCount}
            <Text style={s.progressTotal}>/{stops.length}</Text>
          </Text>
          <Text style={s.progressLabel}>Nurses Dropped Off</Text>
        </View>
        <View style={s.progressRight}>
          {nextStop ? (
            <TouchableOpacity
              style={s.startBtn}
              onPress={() => handleNavigate(nextStop)}
              activeOpacity={0.85}>
              <Text style={s.startBtnText}>▶  Navigate</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.completedBadge}>
              <Text style={s.completedText}>✓ All Done</Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={s.barWrap}>
        <View
          style={[
            s.barFill,
            {width: `${stops.length > 0 ? (droppedCount / stops.length) * 100 : 0}%` as any},
          ]}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0077B6" />
        </View>
      ) : stops.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center' }}>
            No assigned routes for today.
          </Text>
        </View>
      ) : (
        <FlatList
          data={stops}
          keyExtractor={item => item.id}
          contentContainerStyle={s.listPad}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({item, index}) => {
            const isDone = item.status === 'dropped';
            const isNext = item.id === nextStop?.id;

            return (
              <View style={[s.card, isNext && s.cardNext, isDone && s.cardDone]}>
                {/* Order + connector */}
                <View style={s.leftCol}>
                  <View style={[s.orderCircle, isDone && s.orderCircleDone, isNext && s.orderCircleNext]}>
                    <Text style={s.orderText}>
                      {isDone ? '✓' : item.pickupOrder}
                    </Text>
                  </View>
                  {index < stops.length - 1 && (
                    <View style={[s.connector, isDone && {backgroundColor: '#22C55E'}]} />
                  )}
                </View>

                {/* Info */}
                <View style={s.cardBody}>
                  <View style={s.cardTop}>
                    <View style={{flex: 1, paddingRight: 8}}>
                      <Text style={[s.nurseName, isDone && {color: '#9CA3AF'}]}>
                        {item.patientName}
                      </Text>
                      <Text style={s.nurseAddr} numberOfLines={1}>
                        📍 {item.address}
                      </Text>
                      <Text style={[s.nurseAddr, {fontWeight: '600'}]} numberOfLines={1}>
                        👩‍⚕️ Nurse: {item.nurseName}
                      </Text>
                      <Text style={s.nurseZone}>
                        🕐 ETA: {item.etaMinutes} min
                      </Text>
                    </View>
                    <View style={s.actionCol}>
                      {!isDone && (
                        <>
                          <TouchableOpacity
                            style={[s.actionBtn, isNext && s.actionBtnPrimary]}
                            onPress={() => handleNavigate(item)}>
                            <Text style={[s.actionBtnText, isNext && {color: '#FFF'}]}>
                              🧭 Nav
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={s.pickupBtn}
                            onPress={() => handleDropOff(item.id)}>
                            <Text style={s.pickupBtnText}>✓ Drop</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      {isDone && (
                        <View style={s.doneBadge}>
                          <Text style={s.doneText}>✓ Dropped</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F8FAFC'},
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {fontSize: 22, fontWeight: '800', color: '#0F172A'},
  headerSub: {fontSize: 13, color: '#6B7280', marginTop: 2},
  progressCard: {
    backgroundColor: '#0077B6',
    margin: 16,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0077B6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  progressInfo: {},
  progressNum: {fontSize: 40, fontWeight: '900', color: '#FFF'},
  progressTotal: {fontSize: 22, fontWeight: '600', color: 'rgba(255,255,255,0.6)'},
  progressLabel: {fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2},
  progressRight: {},
  startBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
  },
  startBtnText: {fontSize: 14, fontWeight: '800', color: '#0077B6'},
  completedBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  completedText: {fontSize: 14, fontWeight: '700', color: '#FFF'},
  barWrap: {
    marginHorizontal: 16,
    marginBottom: 16,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {height: '100%', backgroundColor: '#22C55E', borderRadius: 3},
  listPad: {paddingHorizontal: 16, paddingBottom: 40},
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardNext: {
    borderWidth: 2,
    borderColor: '#0077B6',
    backgroundColor: '#F0F4FF',
  },
  cardDone: {opacity: 0.55},
  leftCol: {alignItems: 'center', marginRight: 14, width: 28},
  orderCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCircleNext: {backgroundColor: '#0077B6'},
  orderCircleDone: {backgroundColor: '#22C55E'},
  orderText: {fontSize: 13, fontWeight: '800', color: '#FFF'},
  connector: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
    minHeight: 30,
  },
  cardBody: {flex: 1},
  cardTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  nurseName: {fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 3},
  nurseAddr: {fontSize: 12, color: '#6B7280', marginBottom: 2},
  nurseZone: {fontSize: 12, color: '#9CA3AF'},
  actionCol: {alignItems: 'flex-end', gap: 6, minWidth: 70},
  actionBtn: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  actionBtnPrimary: {backgroundColor: '#0077B6'},
  actionBtnText: {fontSize: 12, fontWeight: '700', color: '#374151'},
  pickupBtn: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    width: '100%',
  },
  pickupBtnText: {fontSize: 12, fontWeight: '700', color: '#15803D'},
  doneBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  doneText: {fontSize: 12, fontWeight: '700', color: '#15803D'},
});
