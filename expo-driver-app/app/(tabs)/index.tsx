import React, {useRef, useState, useCallback, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import BottomSheet, {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../../src/context/AuthContext';
import { useLocation } from '../../src/context/LocationContext';
import { AssignedNurse, DriverVehicle } from '../../src/types';
import NursePinMarker from '../../src/components/NursePinMarker';
import { trackingApi } from '../../src/services/api';
const MY_VEHICLE: DriverVehicle = {
  id: '',
  name: '',
  driver: '',
  lat: 0,
  lng: 0,
  speed: 0,
  capacity: 0,
  nursesOnBoard: 0,
};

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_PK ?? '');

const DOHA_CENTER: [number, number] = [51.505, 25.3];

const isValidCoordinate = (coords: any): coords is [number, number] => {
  return (
    Array.isArray(coords) &&
    coords.length === 2 &&
    typeof coords[0] === 'number' &&
    !isNaN(coords[0]) &&
    typeof coords[1] === 'number' &&
    !isNaN(coords[1])
  );
};

function PickupCard({
  nurse,
  onPress,
}: {
  nurse: AssignedNurse;
  onPress: () => void;
}) {
  if (!nurse) return null;
  const status = nurse.status || 'waiting';
  const isPicked = status === 'picked_up';
  const isNext = nurse.pickupOrder === 1 && status === 'waiting';
  const name = nurse.name || 'Nurse';
  const address = nurse.address || 'Address';
  const order = nurse.pickupOrder ?? 0;
  const etaMinutes = nurse.etaMinutes ?? 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.pickupCard, isNext && s.pickupCardNext, isPicked && s.pickupCardDone]}
      activeOpacity={0.75}>
      <View style={[s.orderBadge, isPicked && {backgroundColor: '#22C55E'}]}>
        <Text style={s.orderText}>{isPicked ? '✓' : order}</Text>
      </View>
      <View style={s.pickupInfo}>
        <Text style={s.pickupName} numberOfLines={1}>{name}</Text>
        <Text style={s.pickupAddr} numberOfLines={1}>{address}</Text>
      </View>
      <View style={s.pickupRight}>
        {!isPicked ? (
          <>
            <Text style={s.etaText}>{etaMinutes} min</Text>
            <Text style={s.etaLabel}>ETA</Text>
          </>
        ) : (
          <Text style={s.doneText}>Picked Up</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userEmail, userId, authToken } = useAuth();
  const { userCoords: rawUserCoords, requestLocation } = useLocation();
  const userCoords = rawUserCoords || DOHA_CENTER;

  const [selected, setSelected] = useState<AssignedNurse | null>(null);
  const [assignedNurses, setAssignedNurses] = useState<AssignedNurse[]>([]);
  const [hasFlippedToUser, setHasFlippedToUser] = useState(false);
  const [routeGeojson, setRouteGeojson] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const snapPoints = useMemo(() => ['16%', '50%', '90%'], []);

  const nextNurse = assignedNurses.find(n => n.status === 'waiting');
  const pickedUp = assignedNurses.filter(n => n.status === 'picked_up').length;

  const nameToShow = useMemo(() => {
    if (userEmail) {
      const parts = userEmail.split('@')[0].split(/[._-]/);
      const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : '';
      const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : '';
      return `${firstName} ${lastName}`.trim() || userEmail.split('@')[0];
    }
    return 'Driver';
  }, [userEmail]);

  useEffect(() => {
    if (rawUserCoords && isValidCoordinate(rawUserCoords) && !hasFlippedToUser) {
      cameraRef.current?.flyTo(rawUserCoords, 800);
      setHasFlippedToUser(true);
    }
  }, [rawUserCoords, hasFlippedToUser]);

  useEffect(() => {
    if (!nextNurse || !rawUserCoords || !isValidCoordinate(rawUserCoords)) {
      setRouteGeojson(null);
      return;
    }
    const start = rawUserCoords;
    const nextLng = typeof nextNurse.lng === 'number' && !isNaN(nextNurse.lng) ? nextNurse.lng : DOHA_CENTER[0];
    const nextLat = typeof nextNurse.lat === 'number' && !isNaN(nextNurse.lat) ? nextNurse.lat : DOHA_CENTER[1];
    const end = [nextLng, nextLat];
    const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_PK ?? '';

    let active = true;

    async function getRoute() {
      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();
        if (active && data && data.routes && data.routes[0] && data.routes[0].geometry) {
          setRouteGeojson({
            type: 'Feature',
            properties: {},
            geometry: data.routes[0].geometry,
          });
        }
      } catch (error) {
        console.warn('Error fetching Mapbox directions:', error);
        if (active) {
          // Fallback to straight line on error
          setRouteGeojson({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [start, end],
            },
          });
        }
      }
    }

    getRoute();

    return () => {
      active = false;
    };
  }, [rawUserCoords, nextNurse]);

  useEffect(() => {
    if (!userId) return;

    function mapNurse(raw: any, index: number): AssignedNurse {
      const name = String(raw.name ?? raw.full_name ?? raw.fullName ?? 'Nurse');
      const parts = name.trim().split(/\s+/);
      const initials = ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'N';
      return {
        id: String(raw.id ?? raw.user_id ?? raw.userId ?? index),
        name,
        initials,
        lat: Number(raw.lat ?? raw.latitude ?? 0),
        lng: Number(raw.lng ?? raw.longitude ?? 0),
        address: String(raw.address ?? raw.location ?? ''),
        zone: String(raw.zone ?? ''),
        phone: String(raw.phone ?? raw.phone_number ?? ''),
        pickupOrder: Number(raw.pickup_order ?? raw.pickupOrder ?? index + 1),
        status: raw.status ?? 'waiting',
        etaMinutes: Number(raw.eta_minutes ?? raw.etaMinutes ?? 0),
      };
    }

    async function fetchNurses() {
      const result = await trackingApi.getDriverNurses(userId!, authToken);
      if (result.success && result.nurses.length > 0) {
        setAssignedNurses(result.nurses.map(mapNurse));
      }
    }

    fetchNurses();
    const interval = setInterval(fetchNurses, 10000);
    return () => clearInterval(interval);
  }, [userId, authToken]);

  const flyToUser = useCallback(async () => {
    const coords = await requestLocation();
    if (coords) {
      cameraRef.current?.flyTo(coords, 700);
      cameraRef.current?.zoomTo(15, 600);
    } else if (rawUserCoords) {
      cameraRef.current?.flyTo(rawUserCoords, 700);
      cameraRef.current?.zoomTo(15, 600);
    } else {
      cameraRef.current?.flyTo(DOHA_CENTER, 700);
      cameraRef.current?.zoomTo(12, 600);
    }
  }, [rawUserCoords, requestLocation]);

  const handleNursePress = useCallback((nurse: AssignedNurse) => {
    if (!nurse) return;
    setSelected(prev => (prev?.id === nurse.id ? null : nurse));
    const nurseLng = typeof nurse.lng === 'number' && !isNaN(nurse.lng) ? nurse.lng : DOHA_CENTER[0];
    const nurseLat = typeof nurse.lat === 'number' && !isNaN(nurse.lat) ? nurse.lat : DOHA_CENTER[1];
    cameraRef.current?.flyTo([nurseLng, nurseLat], 800);
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const renderCard = useCallback(
    ({item}: {item: AssignedNurse}) => (
      <PickupCard nurse={item} onPress={() => handleNursePress(item)} />
    ),
    [handleNursePress],
  );

  return (
    <View style={s.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* MAP */}
      <MapboxGL.MapView
        style={s.map}
        styleURL="mapbox://styles/mapbox/streets-v12"
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        onPress={() => setSelected(null)}>
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={isValidCoordinate(userCoords) ? 15 : 12}
          centerCoordinate={isValidCoordinate(userCoords) ? userCoords : DOHA_CENTER}
          animationMode="flyTo"
          animationDuration={800}
        />

        {/* Route line to next nurse */}
        {routeGeojson && (
          <MapboxGL.ShapeSource id="routeSrc" shape={routeGeojson}>
            <MapboxGL.LineLayer
              id="routeLine"
              style={{
                lineColor: '#0077B6',
                lineWidth: 4,
                lineDasharray: [2, 1.5],
                lineOpacity: 0.85,
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Nurse pins */}
        {assignedNurses.filter(nurse => nurse !== null && nurse !== undefined).map(nurse => {
          const nurseLng = typeof nurse.lng === 'number' && !isNaN(nurse.lng) ? nurse.lng : DOHA_CENTER[0];
          const nurseLat = typeof nurse.lat === 'number' && !isNaN(nurse.lat) ? nurse.lat : DOHA_CENTER[1];
          const nurseId = nurse.id || `nurse-${Math.random()}`;
          return (
            <MapboxGL.MarkerView
              key={nurseId}
              coordinate={[nurseLng, nurseLat]}
              anchor={{x: 0.5, y: 1}}>
              <NursePinMarker
                nurse={nurse}
                isNext={nurse.pickupOrder === 1 && nurse.status === 'waiting'}
                onPress={() => handleNursePress(nurse)}
              />
            </MapboxGL.MarkerView>
          );
        })}

        {/* My vehicle */}
        {isValidCoordinate(userCoords) && (
          <MapboxGL.MarkerView
            coordinate={userCoords}
            anchor={{x: 0.5, y: 0.5}}>
            <View style={s.myVehicle}>
              <Text style={s.myVehicleIcon}>🚐</Text>
            </View>
          </MapboxGL.MarkerView>
        )}
      </MapboxGL.MapView>

      {/* TOP BAR */}
      <View
        style={[
          s.topBar,
          {paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4)},
        ]}>
        <View style={s.topLeft}>
          <View style={s.logo}>
            <Text style={s.logoText}>VC</Text>
          </View>
          <View>
            <Text style={s.appName}>Van-01  ·  {nameToShow}</Text>
            <Text style={s.shift}>Morning Route · Doha</Text>
          </View>
        </View>
        <View style={s.topRight}>
          <View style={s.progressPill}>
            <Text style={s.progressText}>{pickedUp}/{assignedNurses.length}</Text>
            <Text style={s.progressLabel}> picked</Text>
          </View>
          <TouchableOpacity style={s.iconBtn}>
            <Text style={s.iconChar}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* STAT CHIPS */}
      <View
        style={[
          s.chips,
          { top: insets.top + (Platform.OS === 'android' ? 56 : 52) },
        ]}>
        <View style={[s.chip, {backgroundColor: '#DCFCE7'}]}>
          <Text style={[s.chipText, {color: '#15803D'}]}>✓ {pickedUp} Picked Up</Text>
        </View>
        <View style={[s.chip, {backgroundColor: '#FEF3C7'}]}>
          <Text style={[s.chipText, {color: '#B45309'}]}>
            ⏳ {assignedNurses.length - pickedUp} Waiting
          </Text>
        </View>
        {nextNurse && (
          <View style={[s.chip, {backgroundColor: '#EFF6FF'}]}>
            <Text style={[s.chipText, {color: '#1D4ED8'}]}>
              🎯 Next: {(nextNurse.name || 'Nurse').split(' ')[0]}
            </Text>
          </View>
        )}
      </View>

      {/* FAB */}
      <View style={s.fab}>
        <TouchableOpacity
          style={s.fabBtn}
          onPress={flyToUser}>
          <Text style={s.fabIcon}>🎯</Text>
        </TouchableOpacity>
      </View>

      {/* BOTTOM SHEET */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={s.sheetBg}
        handleIndicatorStyle={s.sheetHandle}>
        <View style={s.sheetHeader}>
          <View>
            <Text style={s.sheetTitle}>Today's Route</Text>
            <Text style={s.sheetSub}>
              {pickedUp} of {assignedNurses.length} nurses picked up
            </Text>
          </View>
          <View style={s.progressBar}>
            <View
              style={[
                s.progressFill,
                {width: `${(pickedUp / (assignedNurses.length || 1)) * 100}%` as any},
              ]}
            />
          </View>
        </View>
        <View style={s.divider} />
        <BottomSheetFlatList
          data={assignedNurses}
          keyExtractor={item => item?.id || Math.random().toString()}
          renderItem={renderCard}
          contentContainerStyle={{paddingBottom: 80}}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheet>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1},
  map: {flex: 1},
  myVehicle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0077B6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0077B6',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  myVehicleIcon: {fontSize: 24},
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  topLeft: {flexDirection: 'row', alignItems: 'center', gap: 10},
  logo: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#0077B6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {color: '#FFF', fontWeight: '800', fontSize: 14},
  appName: {fontSize: 15, fontWeight: '800', color: '#0F172A'},
  shift: {fontSize: 11, color: '#6B7280', marginTop: 1},
  topRight: {flexDirection: 'row', alignItems: 'center', gap: 8},
  progressPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
  },
  progressText: {fontSize: 13, fontWeight: '800', color: '#1D4ED8'},
  progressLabel: {fontSize: 13, color: '#1D4ED8'},
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconChar: {fontSize: 16},
  chips: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    zIndex: 19,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.97)',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
  },
  chipText: {fontSize: 12, fontWeight: '700'},
  fab: {position: 'absolute', right: 16, bottom: 220},
  fabBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0077B6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0077B6',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 9,
  },
  fabIcon: {fontSize: 22, color: '#FFF'},
  sheetBg: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  sheetHandle: {backgroundColor: '#D1D5DB', width: 38},
  sheetHeader: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  sheetTitle: {fontSize: 18, fontWeight: '800', color: '#0F172A'},
  sheetSub: {fontSize: 12, color: '#6B7280', marginTop: 2, marginBottom: 8},
  progressBar: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0077B6',
    borderRadius: 3,
  },
  divider: {height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB'},
  pickupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFF',
  },
  pickupCardNext: {backgroundColor: '#F0F4FF'},
  pickupCardDone: {opacity: 0.5},
  orderBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0077B6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderText: {fontSize: 15, fontWeight: '800', color: '#FFF'},
  pickupInfo: {flex: 1},
  pickupName: {fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 3},
  pickupAddr: {fontSize: 12, color: '#6B7280'},
  pickupRight: {alignItems: 'flex-end'},
  etaText: {fontSize: 15, fontWeight: '800', color: '#0077B6'},
  etaLabel: {fontSize: 10, color: '#9CA3AF', fontWeight: '600'},
  doneText: {fontSize: 12, fontWeight: '700', color: '#22C55E'},
});

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  const { View, Text, TouchableOpacity } = require('react-native');
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 24 }}>
      <Text style={{ fontSize: 44 }}>⚠️</Text>
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 16, marginBottom: 8 }}>
        Map Loading Issue
      </Text>
      <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 18 }}>
        {error?.message || 'An unexpected error occurred while loading the map rendering engine.'}
      </Text>
      <TouchableOpacity
        onPress={retry}
        activeOpacity={0.8}
        style={{
          backgroundColor: '#0077B6',
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 8,
        }}>
        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}
