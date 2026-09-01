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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/context/AuthContext';
import { useLocation } from '../../src/context/LocationContext';
import { trackingApi } from '../../src/services/api';

export interface ActiveTripNurse {
  id: string; // tripNurse.id
  expectedArrivalTime: string;
  expectedArrivalTimeFormatted: string;
  nurse: {
    id: string;
    name: string;
    mobile: string | null;
    address: string | null;
    lat: number;
    lng: number;
  };
  patient: {
    id: string;
    name: string;
    mobile: string | null;
    address: string;
    lat: number;
    lng: number;
    diagnosis: string;
  };
}

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

function parseTripNurses(rawList: any[]): ActiveTripNurse[] {
  const parsed: ActiveTripNurse[] = [];
  (rawList || []).forEach((item: any) => {
    if (!item) return;
    const nurseObj = item.nurse || {};
    const nurseLoc = nurseObj.location || {};
    const patientObj = item.patient || {};
    
    // Parse nurse coordinates
    const nurseCoords = parseCoordinates(nurseLoc) || parseCoordinates(nurseObj) || { lat: 0, lng: 0 };
    // Parse patient coordinates
    const patientCoords = parseCoordinates(patientObj) || { lat: 0, lng: 0 };

    const arrivalTime = item.expectedArrivalTime || '';
    let formattedTime = 'N/A';
    if (arrivalTime) {
      try {
        const date = new Date(arrivalTime);
        formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        formattedTime = arrivalTime;
      }
    }

    parsed.push({
      id: String(item.id),
      expectedArrivalTime: arrivalTime,
      expectedArrivalTimeFormatted: formattedTime,
      nurse: {
        id: String(nurseObj.id || item.nurseId || ''),
        name: String(nurseObj.name || 'Nurse'),
        mobile: nurseObj.mobile || null,
        address: nurseObj.address || null,
        lat: nurseCoords.lat,
        lng: nurseCoords.lng,
      },
      patient: {
        id: String(patientObj.id || item.patientId || ''),
        name: String(patientObj.name || 'Patient'),
        mobile: patientObj.mobile || null,
        address: String(patientObj.address || 'No Address'),
        lat: patientCoords.lat,
        lng: patientCoords.lng,
        diagnosis: String(patientObj.diagnosis || '-'),
      },
    });
  });

  // Sort by expectedArrivalTime ascending
  return parsed.sort((a, b) => {
    return new Date(a.expectedArrivalTime).getTime() - new Date(b.expectedArrivalTime).getTime();
  });
}

function DropOffCard({
  tripNurse,
  onPress,
  isNext,
}: {
  tripNurse: ActiveTripNurse;
  onPress: () => void;
  isNext: boolean;
}) {
  if (!tripNurse) return null;
  const patient = tripNurse.patient;
  const nurse = tripNurse.nurse;
  const name = patient.name || 'Patient';
  const address = patient.address || 'Address';
  const time = tripNurse.expectedArrivalTimeFormatted;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.pickupCard, isNext && s.pickupCardNext]}
      activeOpacity={0.75}>
      <View style={[s.orderBadge, isNext && { backgroundColor: '#1D4ED8' }]}>
        <Text style={s.orderText}>🏠</Text>
      </View>
      <View style={s.pickupInfo}>
        <Text style={s.pickupName} numberOfLines={1}>{name}</Text>
        <Text style={s.pickupAddr} numberOfLines={1}>Assigned Nurse: {nurse.name}</Text>
        <Text style={s.pickupAddr} numberOfLines={1}>Address: {address}</Text>
      </View>
      <View style={s.pickupRight}>
        <Text style={[s.etaText, isNext && { color: '#1D4ED8' }]}>{time}</Text>
        <Text style={s.etaLabel}>Expected</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userEmail, userId, authToken, userCountry } = useAuth();
  const { userCoords: rawUserCoords, requestLocation } = useLocation();
  const userCoords = rawUserCoords || DOHA_CENTER;

  const [tripNurses, setTripNurses] = useState<ActiveTripNurse[]>([]);
  const [droppedNurses, setDroppedNurses] = useState<Record<string, number>>({});
  const [selectedTripNurse, setSelectedTripNurse] = useState<ActiveTripNurse | null>(null);
  const [hasFlippedToUser, setHasFlippedToUser] = useState(false);
  const [routeGeojson, setRouteGeojson] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
  
  const bottomSheetRef = useRef<BottomSheet>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const snapPoints = useMemo(() => ['16%', '50%', '90%'], []);

  const shiftName = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      return 'Morning Route';
    } else if (hour >= 12 && hour < 17) {
      return 'Afternoon Route';
    } else if (hour >= 17 && hour < 21) {
      return 'Evening Route';
    } else {
      return 'Night Route';
    }
  }, []);

  const displayLocation = useMemo(() => {
    if (!userCountry) return 'Doha';
    const norm = userCountry.trim().toLowerCase();
    if (norm.includes('lanka') || norm === 'sri lanka' || norm === 'lk') {
      return 'Sri Lanka';
    }
    if (norm.includes('qatar') || norm === 'qa') {
      return 'Doha';
    }
    return userCountry;
  }, [userCountry]);

  // Filter out nurses that have been dropped
  const activeTripNurses = useMemo(() => {
    return tripNurses.filter(n => !droppedNurses[n.id]);
  }, [tripNurses, droppedNurses]);

  const totalNurses = tripNurses.length;
  const droppedCount = useMemo(() => {
    return tripNurses.filter(n => droppedNurses[n.id]).length;
  }, [tripNurses, droppedNurses]);

  const nameToShow = useMemo(() => {
    if (userEmail) {
      const parts = userEmail.split('@')[0].split(/[._-]/);
      const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : '';
      const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : '';
      return `${firstName} ${lastName}`.trim() || userEmail.split('@')[0];
    }
    return 'Driver';
  }, [userEmail]);

  // Load dropped status on mount
  useEffect(() => {
    async function loadDroppedNurses() {
      try {
        const stored = await AsyncStorage.getItem('driver_dropped_nurses');
        if (stored) {
          const parsed = JSON.parse(stored);
          const cleaned: Record<string, number> = {};
          const now = Date.now();
          const limit = 24 * 60 * 60 * 1000; // 24 hours
          
          Object.entries(parsed).forEach(([key, val]) => {
            if (typeof val === 'number' && now - val < limit) {
              cleaned[key] = val;
            }
          });
          
          setDroppedNurses(cleaned);
          await AsyncStorage.setItem('driver_dropped_nurses', JSON.stringify(cleaned));
        }
      } catch (e) {
        console.error('Error loading dropped nurses from storage:', e);
      }
    }
    loadDroppedNurses();
  }, []);

  const markAsDropped = useCallback(async (tripNurseId: string) => {
    try {
      const updated = { ...droppedNurses, [tripNurseId]: Date.now() };
      setDroppedNurses(updated);
      await AsyncStorage.setItem('driver_dropped_nurses', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving dropped nurse:', e);
    }
  }, [droppedNurses]);

  useEffect(() => {
    if (rawUserCoords && isValidCoordinate(rawUserCoords) && !hasFlippedToUser) {
      cameraRef.current?.flyTo(rawUserCoords, 800);
      setHasFlippedToUser(true);
    }
  }, [rawUserCoords, hasFlippedToUser]);

  // Dynamic route connection to remaining patient locations
  useEffect(() => {
    if (activeTripNurses.length === 0 || !rawUserCoords || !isValidCoordinate(rawUserCoords)) {
      setRouteGeojson(null);
      return;
    }

    const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_PK ?? '';
    const start = rawUserCoords;
    
    // Construct coordinates string: start;stop1;stop2...
    const coordsString = [
      start.join(','),
      ...activeTripNurses.map(tn => `${tn.patient.lng},${tn.patient.lat}`)
    ].join(';');

    let active = true;

    async function getRoute() {
      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsString}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`;
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
          const coordinates = [
            start,
            ...activeTripNurses.map(tn => [tn.patient.lng, tn.patient.lat] as [number, number])
          ];
          setRouteGeojson({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates,
            },
          });
        }
      }
    }

    getRoute();

    return () => {
      active = false;
    };
  }, [rawUserCoords, activeTripNurses]);

  // Fetch API every 30 seconds
  useEffect(() => {
    if (!authToken) return;

    async function fetchNurses() {
      const result = await trackingApi.getDriverNurses(authToken);
      if (result.success && result.data && result.data.tripNurses) {
        const parsed = parseTripNurses(result.data.tripNurses);
        setTripNurses(parsed);
      }
    }

    fetchNurses();
    const interval = setInterval(fetchNurses, 30000);
    return () => clearInterval(interval);
  }, [authToken]);

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

  const handlePatientPress = useCallback((tn: ActiveTripNurse) => {
    if (!tn) return;
    setSelectedTripNurse(tn);
    const pLng = typeof tn.patient.lng === 'number' && !isNaN(tn.patient.lng) ? tn.patient.lng : DOHA_CENTER[0];
    const pLat = typeof tn.patient.lat === 'number' && !isNaN(tn.patient.lat) ? tn.patient.lat : DOHA_CENTER[1];
    cameraRef.current?.flyTo([pLng, pLat], 800);
  }, []);

  const renderCard = useCallback(
    ({item, index}: {item: ActiveTripNurse; index: number}) => (
      <DropOffCard tripNurse={item} onPress={() => handlePatientPress(item)} isNext={index === 0} />
    ),
    [handlePatientPress],
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
        onPress={() => setSelectedTripNurse(null)}>
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={isValidCoordinate(userCoords) ? 15 : 12}
          centerCoordinate={isValidCoordinate(userCoords) ? userCoords : DOHA_CENTER}
          animationMode="flyTo"
          animationDuration={800}
        />

        {/* Route line connecting all remaining patient locations */}
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

        {/* Patient Location Pins */}
        {activeTripNurses.map((tn, index) => {
          const isNext = index === 0;
          const pinColor = isNext ? '#1D4ED8' : '#4B5563'; // blue for next, gray for later
          const patient = tn.patient;
          return (
            <MapboxGL.MarkerView
              key={tn.id}
              coordinate={[patient.lng, patient.lat]}
              anchor={{x: 0.5, y: 1}}>
              <TouchableOpacity
                onPress={() => handlePatientPress(tn)}
                activeOpacity={0.8}
                style={{ alignItems: 'center' }}>
                {isNext && (
                  <View style={s.nextLabel}>
                    <Text style={s.nextText}>NEXT</Text>
                  </View>
                )}
                <View style={{
                  width: isNext ? 46 : 36,
                  height: isNext ? 46 : 36,
                  borderRadius: isNext ? 23 : 18,
                  backgroundColor: '#FFF',
                  borderWidth: 3,
                  borderColor: pinColor,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 6,
                }}>
                  <Text style={{ fontSize: isNext ? 20 : 16 }}>🏠</Text>
                </View>
                <View style={{
                  backgroundColor: pinColor,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 10,
                  marginTop: 4,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFF' }} numberOfLines={1}>
                    {patient.name.split(' ')[0]}
                  </Text>
                </View>
              </TouchableOpacity>
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
            <Text style={s.logoText}>VD</Text>
          </View>
          <View>
            <Text style={s.appName}>Van-01  ·  {nameToShow}</Text>
            <Text style={s.shift}>{shiftName} · {displayLocation}</Text>
          </View>
        </View>
        <View style={s.topRight}>
          <View style={s.progressPill}>
            <Text style={s.progressText}>{droppedCount}/{totalNurses}</Text>
            <Text style={s.progressLabel}> dropped</Text>
          </View>
        </View>
      </View>

      {/* STAT CHIPS */}
      <View
        style={[
          s.chips,
          { top: insets.top + (Platform.OS === 'android' ? 56 : 52) },
        ]}>
        <View style={[s.chip, {backgroundColor: '#DCFCE7'}]}>
          <Text style={[s.chipText, {color: '#15803D'}]}>✓ {droppedCount} Dropped</Text>
        </View>
        <View style={[s.chip, {backgroundColor: '#FEF3C7'}]}>
          <Text style={[s.chipText, {color: '#B45309'}]}>
            ⏳ {activeTripNurses.length} Waiting
          </Text>
        </View>
        {activeTripNurses[0] && (
          <View style={[s.chip, {backgroundColor: '#EFF6FF'}]}>
            <Text style={[s.chipText, {color: '#1D4ED8'}]}>
              🎯 Next: {activeTripNurses[0].patient.name.split(' ')[0]}
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

      {/* PATIENT DETAILS POPOVER */}
      {selectedTripNurse && (
        <View style={s.popoverCard}>
          <View style={s.popoverHeader}>
            <Text style={s.popoverTitle}>Drop-off Details</Text>
            <TouchableOpacity onPress={() => setSelectedTripNurse(null)} style={s.popoverCloseBtn}>
              <Text style={s.popoverCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={s.popoverBody}>
            {/* Patient details */}
            <View style={s.popoverRow}>
              <Text style={s.popoverLabel}>Patient:</Text>
              <Text style={s.popoverValue} numberOfLines={1}>{selectedTripNurse.patient.name}</Text>
            </View>
            <View style={s.popoverRow}>
              <Text style={s.popoverLabel}>Mobile:</Text>
              <Text style={s.popoverValue}>{selectedTripNurse.patient.mobile || 'N/A'}</Text>
            </View>
            <View style={s.popoverRow}>
              <Text style={s.popoverLabel}>Address:</Text>
              <Text style={s.popoverValue} numberOfLines={2}>{selectedTripNurse.patient.address}</Text>
            </View>
            <View style={s.popoverRow}>
              <Text style={s.popoverLabel}>Diagnosis:</Text>
              <Text style={s.popoverValue}>{selectedTripNurse.patient.diagnosis}</Text>
            </View>

            <View style={s.popoverDivider} />

            {/* Nurse details */}
            <View style={s.popoverRow}>
              <Text style={s.popoverLabel}>Nurse:</Text>
              <Text style={s.popoverValue} numberOfLines={1}>{selectedTripNurse.nurse.name}</Text>
            </View>
            <View style={s.popoverRow}>
              <Text style={s.popoverLabel}>Nurse Mobile:</Text>
              <Text style={s.popoverValue}>{selectedTripNurse.nurse.mobile || 'N/A'}</Text>
            </View>
            <View style={s.popoverRow}>
              <Text style={s.popoverLabel}>Expected Arrival:</Text>
              <Text style={s.popoverValue}>{selectedTripNurse.expectedArrivalTimeFormatted}</Text>
            </View>
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={s.dropBtn}
            onPress={() => {
              markAsDropped(selectedTripNurse.id);
              setSelectedTripNurse(null);
            }}>
            <Text style={s.dropBtnText}>Mark Nurse as Dropped</Text>
          </TouchableOpacity>
        </View>
      )}

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
              {droppedCount} of {totalNurses} nurses dropped
            </Text>
          </View>
          <View style={s.progressBar}>
            <View
              style={[
                s.progressFill,
                {width: `${(droppedCount / (totalNurses || 1)) * 100}%` as any},
              ]}
            />
          </View>
        </View>
        <View style={s.divider} />
        <BottomSheetFlatList
          data={activeTripNurses}
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
  popoverCard: {
    position: 'absolute',
    bottom: 240,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  popoverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  popoverTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  popoverCloseBtn: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  popoverCloseText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  popoverBody: {
    gap: 6,
    marginBottom: 14,
  },
  popoverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  popoverLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    width: '35%',
  },
  popoverValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    width: '65%',
    textAlign: 'right',
  },
  popoverDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginVertical: 6,
  },
  dropBtn: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  nextLabel: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 5,
  },
  nextText: {fontSize: 8, fontWeight: '800', color: '#FFF'},
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
