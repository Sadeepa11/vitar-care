import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useLocation } from '../../src/context/LocationContext';
import { Nurse, Patient } from '../../src/types';
import NurseAvatarMarker from '../../src/components/NurseAvatarMarker';
import VehicleMarker from '../../src/components/VehicleMarker';
import NurseMemberCard from '../../src/components/NurseMemberCard';
import UserLocationMarker from '../../src/components/UserLocationMarker';
import PatientMarker from '../../src/components/PatientMarker';
import PatientCard from '../../src/components/PatientCard';
import { trackingApi } from '../../src/services/api';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_PK ?? '');

const DOHA_CENTER: [number, number] = [51.515, 25.298];

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

function haversineDistance(coords1: [number, number], coords2: [number, number]): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(coords2[1] - coords1[1]);
  const dLon = toRad(coords2[0] - coords1[0]);
  const lat1 = toRad(coords1[1]);
  const lat2 = toRad(coords2[1]);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userEmail, userId, authToken, userCountry } = useAuth();
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [nurseTeam, setNurseTeam] = useState<Nurse[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeTab, setActiveTab] = useState<'nurses' | 'patients'>('nurses');
  const { userCoords: rawUserCoords, requestLocation } = useLocation();
  const userCoords = rawUserCoords || DOHA_CENTER;

  const [routeGeojson, setRouteGeojson] = useState<any>(null);
  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  const [routeDuration, setRouteDuration] = useState<string | null>(null);

  const [driverDistance, setDriverDistance] = useState<string | null>(null);
  const [driverDuration, setDriverDuration] = useState<string | null>(null);

  const [hasFlippedToUser, setHasFlippedToUser] = useState(false);
  const hasFlippedToDataRef = useRef(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const snapPoints = useMemo(() => ['14%', '48%', '88%'], []);

  const shiftName = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      return 'Morning Shift';
    } else if (hour >= 12 && hour < 17) {
      return 'Afternoon Shift';
    } else if (hour >= 17 && hour < 21) {
      return 'Evening Shift';
    } else {
      return 'Night Shift';
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

  // Exclude the logged-in user from the team list to remove duplication
  const loggedInNurseId = userId || '1';
  const teamNurses = useMemo(() => {
    return nurseTeam.filter(n => n.id !== loggedInNurseId);
  }, [nurseTeam, loggedInNurseId]);

  // Derive dynamic details for the logged-in nurse
  const myNurseInfo = useMemo(() => {
    let name = 'Nurse';
    let initials = 'N';

    if (userEmail) {
      const parts = userEmail.split('@')[0].split(/[._-]/);
      const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : '';
      const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : '';
      name = `${firstName} ${lastName}`.trim() || userEmail.split('@')[0];
      initials = ((firstName.charAt(0) || '') + (lastName.charAt(0) || '')).toUpperCase() || 'N';
    }

    const baseNurse = (nurseTeam.find(n => n.id === loggedInNurseId) || {}) as Partial<Nurse>;

    return {
      id: loggedInNurseId,
      status: baseNurse.status || 'at_home',
      battery: baseNurse.battery ?? 100,
      lastSeen: baseNurse.lastSeen || 'Just now',
      zone: baseNurse.zone || 'Doha',
      phone: baseNurse.phone || '',
      lat: baseNurse.lat ?? DOHA_CENTER[1],
      lng: baseNurse.lng ?? DOHA_CENTER[0],
      name: baseNurse.name || name,
      initials: baseNurse.initials || initials,
    };
  }, [userEmail, loggedInNurseId, nurseTeam]);

  const activeCount = teamNurses.filter(n => n.status === 'at_work').length;
  const transitCount = teamNurses.filter(n => n.status === 'in_transit').length;
  const sosCount = teamNurses.filter(n => n.status === 'sos').length;

  useEffect(() => {
    if (rawUserCoords && isValidCoordinate(rawUserCoords) && !hasFlippedToUser) {
      cameraRef.current?.flyTo(rawUserCoords, 900);
      setHasFlippedToUser(true);
    }
  }, [rawUserCoords, hasFlippedToUser]);

  // Single API call: GET /api/tracking/nurse/driver-location every 30 seconds
  useEffect(() => {
    if (!authToken) return;

    async function fetchRealTimeDetails() {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const res = await trackingApi.getDriverLocation(authToken, todayStr);
      if (res.success && res.data) {
        const { driver, patient } = res.data;

        // Process driver location and vehicle
        if (driver && driver.location) {
          const vLat = Number(driver.location.latitude);
          const vLng = Number(driver.location.longitude);

          if (!isNaN(vLat) && !isNaN(vLng)) {
            setVehicles([{
              id: String(driver.id ?? 'driver'),
              name: 'Van',
              driver: driver.name ?? 'Driver',
              lat: vLat,
              lng: vLng,
              heading: driver.location.heading ?? 0,
              speed: driver.location.speed != null ? Math.round(Number(driver.location.speed)) : 0,
              vehicleNumber: driver.vehicleNumber || 'N/A',
              mobile: driver.mobile || null,
            }]);

            // Map driver to nurseTeam to display in Nurses tab
            const driverParts = (driver.name || 'Driver').trim().split(/\s+/);
            const driverInitials = ((driverParts[0]?.[0] ?? '') + (driverParts[1]?.[0] ?? '')).toUpperCase() || 'D';
            setNurseTeam([{
              id: String(driver.id ?? 'driver'),
              name: `${driver.name ?? 'Driver'} (Driver)`,
              initials: driverInitials,
              lat: vLat,
              lng: vLng,
              status: 'in_transit',
              battery: 100,
              lastSeen: 'Active now',
              zone: driver.vehicleNumber || 'Van',
              phone: driver.mobile || '',
            }]);
          } else {
            setVehicles([]);
            setNurseTeam([]);
          }
        } else {
          setVehicles([]);
          setNurseTeam([]);
        }

        // Process patient location
        let patientCoords: { lat: number; lng: number } | null = null;
        if (patient) {
          let pLat = Number(patient.latitude);
          let pLng = Number(patient.longitude);

          // Fallback: Parse map_link to extract coordinates if lat/lng are missing, zero, or NaN
          if ((!pLat || !pLng || isNaN(pLat) || isNaN(pLng)) && patient.map_link) {
            const match = patient.map_link.match(/[?&]q=([^&]+)/);
            if (match && match[1]) {
              const parts = match[1].split(',');
              const parsedLat = parseFloat(parts[0]);
              const parsedLng = parseFloat(parts[1]);
              if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
                pLat = parsedLat;
                pLng = parsedLng;
              }
            }
          }

          const pName = patient.name || 'Patient';
          const pParts = pName.trim().split(/\s+/);
          const pInitials = ((pParts[0]?.[0] ?? '') + (pParts[1]?.[0] ?? '')).toUpperCase() || 'P';

          if (!isNaN(pLat) && !isNaN(pLng) && pLat !== 0 && pLng !== 0) {
            patientCoords = { lat: pLat, lng: pLng };
            setPatients([{
              id: String(patient.id ?? 'patient'),
              name: pName,
              initials: pInitials,
              lat: pLat,
              lng: pLng,
              address: patient.address || '',
              phone: patient.mobile || '',
              condition: patient.diagnosis || undefined,
            }]);
          } else {
            setPatients([]);
          }
        } else {
          setPatients([]);
        }

        // Auto fly camera to show patient or driver on initial load
        if (!hasFlippedToDataRef.current) {
          if (patientCoords) {
            cameraRef.current?.setCamera({
              centerCoordinate: [patientCoords.lng, patientCoords.lat],
              zoomLevel: 13,
              animationDuration: 1000,
            });
            hasFlippedToDataRef.current = true;
          } else if (driver && driver.location && !isNaN(Number(driver.location.longitude)) && !isNaN(Number(driver.location.latitude))) {
            const dLng = Number(driver.location.longitude);
            const dLat = Number(driver.location.latitude);
            if (dLng !== 0 && dLat !== 0) {
              cameraRef.current?.setCamera({
                centerCoordinate: [dLng, dLat],
                zoomLevel: 13,
                animationDuration: 1000,
              });
              hasFlippedToDataRef.current = true;
            }
          }
        }
      } else {
        setVehicles([]);
        setPatients([]);
        setNurseTeam([]);
      }
    }

    fetchRealTimeDetails();
    const interval = setInterval(fetchRealTimeDetails, 10000);
    return () => clearInterval(interval);
  }, [authToken]);

  // Real-time Mapbox Route & Distance/Duration computation
  useEffect(() => {
    let startCoords: [number, number] | null = null;
    if (vehicles.length > 0 && isValidCoordinate([vehicles[0].lng, vehicles[0].lat])) {
      startCoords = [vehicles[0].lng, vehicles[0].lat];
    } else if (isValidCoordinate(userCoords)) {
      startCoords = userCoords;
    }

    const targetPatient = selectedPatient || (patients.length > 0 ? patients[0] : null);

    if (!startCoords || !targetPatient || targetPatient.lat === 0 || targetPatient.lng === 0) {
      setRouteGeojson(null);
      setRouteDistance(null);
      setRouteDuration(null);
      return;
    }

    const endCoords: [number, number] = [targetPatient.lng, targetPatient.lat];
    const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_PK ?? '';

    let active = true;

    async function fetchRoute() {
      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoords![0]},${startCoords![1]};${endCoords[0]},${endCoords[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`;
        const res = await fetch(url);
        const data = await res.json();

        if (active && data && data.routes && data.routes[0]) {
          const route = data.routes[0];
          const distMeters = route.distance;
          const durSeconds = route.duration;

          let distStr = '';
          if (distMeters < 1000) {
            distStr = `${Math.round(distMeters)} m`;
          } else {
            distStr = `${(distMeters / 1000).toFixed(1)} km`;
          }

          let durStr = '';
          if (durSeconds < 60) {
            durStr = '< 1 min';
          } else if (durSeconds < 3600) {
            durStr = `${Math.round(durSeconds / 60)} min`;
          } else {
            const hrs = Math.floor(durSeconds / 3600);
            const mins = Math.round((durSeconds % 3600) / 60);
            durStr = `${hrs}h ${mins}m`;
          }

          setRouteDistance(distStr);
          setRouteDuration(durStr);

          if (route.geometry) {
            setRouteGeojson({
              type: 'Feature',
              properties: {},
              geometry: route.geometry,
            });
          }
        } else {
          throw new Error('No route returned');
        }
      } catch (e) {
        if (active) {
          const distKm = haversineDistance(startCoords!, endCoords);
          const distStr = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;
          const durMins = Math.max(1, Math.round((distKm / 30) * 60));
          const durStr = durMins >= 60 ? `${Math.floor(durMins / 60)}h ${durMins % 60}m` : `${durMins} min`;

          setRouteDistance(distStr);
          setRouteDuration(durStr);
          setRouteGeojson({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [startCoords!, endCoords],
            },
          });
        }
      }
    }

    fetchRoute();

    // Driver pickup distance & ETA computation (Nurse -> Driver/Vehicle)
    if (vehicles.length > 0 && isValidCoordinate([vehicles[0].lng, vehicles[0].lat]) && isValidCoordinate(userCoords)) {
      const vCoords: [number, number] = [vehicles[0].lng, vehicles[0].lat];

      async function fetchDriverPickup() {
        try {
          const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userCoords[0]},${userCoords[1]};${vCoords[0]},${vCoords[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_ACCESS_TOKEN}`;
          const res = await fetch(url);
          const data = await res.json();
          if (active && data && data.routes && data.routes[0]) {
            const route = data.routes[0];
            const distM = route.distance;
            const durS = route.duration;

            const distStr = distM < 1000 ? `${Math.round(distM)} m` : `${(distM / 1000).toFixed(1)} km`;
            const durStr = durS < 60 ? '< 1 min' : durS < 3600 ? `${Math.round(durS / 60)} min` : `${Math.floor(durS / 3600)}h ${Math.round((durS % 3600) / 60)}m`;

            setDriverDistance(distStr);
            setDriverDuration(durStr);
          } else {
            throw new Error('No driver route');
          }
        } catch (e) {
          if (active) {
            const distKm = haversineDistance(userCoords, vCoords);
            const distStr = distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`;
            const durMins = Math.max(1, Math.round((distKm / 30) * 60));
            const durStr = durMins >= 60 ? `${Math.floor(durMins / 60)}h ${durMins % 60}m` : `${durMins} min`;

            setDriverDistance(distStr);
            setDriverDuration(durStr);
          }
        }
      }

      fetchDriverPickup();
    } else {
      setDriverDistance(null);
      setDriverDuration(null);
    }

    return () => {
      active = false;
    };
  }, [vehicles, userCoords, patients, selectedPatient]);

  const handleNursePress = useCallback((nurse: Nurse) => {
    if (!nurse) return;
    setSelectedNurse(prev => (prev?.id === nurse.id ? null : nurse));
    const nurseLng = typeof nurse.lng === 'number' && !isNaN(nurse.lng) ? nurse.lng : DOHA_CENTER[0];
    const nurseLat = typeof nurse.lat === 'number' && !isNaN(nurse.lat) ? nurse.lat : DOHA_CENTER[1];
    cameraRef.current?.flyTo([nurseLng, nurseLat], 900);
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const flyToUser = useCallback(async () => {
    const coords = await requestLocation();
    if (coords) {
      cameraRef.current?.setCamera({
        centerCoordinate: coords,
        zoomLevel: 15,
        animationDuration: 700,
      });
    } else if (rawUserCoords) {
      cameraRef.current?.setCamera({
        centerCoordinate: rawUserCoords,
        zoomLevel: 15,
        animationDuration: 700,
      });
    } else {
      cameraRef.current?.setCamera({
        centerCoordinate: DOHA_CENTER,
        zoomLevel: 12,
        animationDuration: 700,
      });
    }
  }, [rawUserCoords, requestLocation]);

  const handlePatientPress = useCallback((patient: Patient) => {
    if (!patient) return;
    setSelectedPatient(prev => (prev?.id === patient.id ? null : patient));
    const pLng = typeof patient.lng === 'number' && !isNaN(patient.lng) ? patient.lng : DOHA_CENTER[0];
    const pLat = typeof patient.lat === 'number' && !isNaN(patient.lat) ? patient.lat : DOHA_CENTER[1];
    if (pLat !== 0 || pLng !== 0) {
      cameraRef.current?.flyTo([pLng, pLat], 900);
    }
  }, []);

  const renderCard = useCallback(
    ({ item }: { item: Nurse }) => (
      <NurseMemberCard
        nurse={item}
        isSelected={selectedNurse?.id === item.id}
        onPress={() => handleNursePress(item)}
      />
    ),
    [selectedNurse, handleNursePress]
  );

  const renderPatientCard = useCallback(
    ({ item }: { item: any }) => (
      <PatientCard
        patient={item}
        isSelected={selectedPatient?.id === item.id}
        onPress={() => handlePatientPress(item)}
      />
    ),
    [selectedPatient, handlePatientPress]
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
        onPress={() => setSelectedNurse(null)}>
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={isValidCoordinate(userCoords) ? 15 : 12}
          centerCoordinate={isValidCoordinate(userCoords) ? userCoords : DOHA_CENTER}
          animationMode="flyTo"
          animationDuration={800}
        />


        {/* Real-time Mapbox Route Polyline */}
        {routeGeojson && (
          <MapboxGL.ShapeSource id="patientRouteSource" shape={routeGeojson}>
            <MapboxGL.LineLayer
              id="patientRouteLine"
              style={{
                lineColor: '#16A34A',
                lineWidth: 5,
                lineJoin: 'round',
                lineCap: 'round',
                lineOpacity: 0.85,
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Vehicle markers */}
        {vehicles.filter(v => v !== null && v !== undefined).map(v => {
          const vLng = typeof v.lng === 'number' && !isNaN(v.lng) ? v.lng : DOHA_CENTER[0];
          const vLat = typeof v.lat === 'number' && !isNaN(v.lat) ? v.lat : DOHA_CENTER[1];
          const vId = v.id || `vehicle-${Math.random()}`;
          return (
            <MapboxGL.MarkerView
              key={vId}
              coordinate={[vLng, vLat]}
              anchor={{ x: 0.5, y: 0.5 }}>
              <VehicleMarker
                vehicle={v}
                onPress={() => cameraRef.current?.flyTo([vLng, vLat], 900)}
                distance={driverDistance}
                duration={driverDuration}
              />
            </MapboxGL.MarkerView>
          );
        })}

        {/* Patient markers */}
        {patients.filter(p => p.lat !== 0 || p.lng !== 0).map(patient => {
          const isThisSelected = selectedPatient?.id === patient.id || patients.length === 1;
          return (
            <MapboxGL.MarkerView
              key={`patient-${patient.id}`}
              coordinate={[patient.lng, patient.lat]}
              anchor={{ x: 0.5, y: 1 }}>
              <PatientMarker
                patient={patient}
                isSelected={selectedPatient?.id === patient.id}
                onPress={() => handlePatientPress(patient)}
                distance={isThisSelected ? routeDistance : null}
                duration={isThisSelected ? routeDuration : null}
              />
            </MapboxGL.MarkerView>
          );
        })}

        {/* Custom User Location Marker — profile image in green ring */}
        {isValidCoordinate(userCoords) && (
          <MapboxGL.MarkerView
            key="user-location"
            coordinate={userCoords}
            anchor={{ x: 0.5, y: 1 }}>
            <UserLocationMarker
              name={myNurseInfo.name}
              initials={myNurseInfo.initials}
              avatarUri={null} // set to profile photo URI when available
              accuracy={20}
            />
          </MapboxGL.MarkerView>
        )}

        {/* Fallback: show marker at nurse's recorded coords when GPS not granted */}
        {!isValidCoordinate(userCoords) && (
          <MapboxGL.MarkerView
            key="user-fallback"
            coordinate={[
              typeof myNurseInfo.lng === 'number' && !isNaN(myNurseInfo.lng) ? myNurseInfo.lng : DOHA_CENTER[0],
              typeof myNurseInfo.lat === 'number' && !isNaN(myNurseInfo.lat) ? myNurseInfo.lat : DOHA_CENTER[1]
            ]}
            anchor={{ x: 0.5, y: 1 }}>
            <UserLocationMarker
              name={myNurseInfo.name}
              initials={myNurseInfo.initials}
              avatarUri={null}
              accuracy={50}
            />
          </MapboxGL.MarkerView>
        )}
      </MapboxGL.MapView>

      {/* TOP BAR */}
      <View
        style={[
          s.topBar,
          { paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4) },
        ]}>
        <View style={s.topLeft}>
          <View style={s.logo}>
            <Text style={s.logoText}>VN</Text>
          </View>
          <View>
            <Text style={s.appName}>VitaCare</Text>
            <Text style={s.shift}>{shiftName} · {displayLocation}</Text>
          </View>
        </View>
        <View style={s.topRight}>
          {sosCount > 0 && (
            <View style={s.sosPill}>
              <Text style={s.sosText}>🆘 {sosCount} SOS</Text>
            </View>
          )}
        </View>
      </View>

      {/* STAT CHIPS */}
      <View
        style={[
          s.chips,
          { top: insets.top + (Platform.OS === 'android' ? 56 : 52) },
        ]}>
        {routeDistance && routeDuration && (
          <View style={[s.chip, { backgroundColor: '#F0FDF4', borderColor: '#16A34A', borderWidth: 1 }]}>
            <Text style={[s.chipText, { color: '#15803D' }]}>
              🏥 Patient: {routeDistance} ({routeDuration})
            </Text>
          </View>
        )}
        {driverDistance && driverDuration && (
          <View style={[s.chip, { backgroundColor: '#EFF6FF', borderColor: '#3B82F6', borderWidth: 1 }]}>
            <Text style={[s.chipText, { color: '#1D4ED8' }]}>
              🚐 Driver: {driverDistance} ({driverDuration})
            </Text>
          </View>
        )}
        <View style={[s.chip, { backgroundColor: '#DCFCE7' }]}>
          <View style={[s.chipDot, { backgroundColor: '#16A34A' }]} />
          <Text style={[s.chipText, { color: '#15803D' }]}>{activeCount} Active</Text>
        </View>
      </View>

      <View style={s.fab}>
        <TouchableOpacity style={s.fabBtn} onPress={flyToUser}>
          <Text style={s.fabIcon}>📍</Text>
        </TouchableOpacity>
      </View>


    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  map: { flex: 1 },
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
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  appName: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  shift: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sosPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  sosText: { fontSize: 12, fontWeight: '800', color: '#DC2626' },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconChar: { fontSize: 16 },
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
    gap: 5,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: { fontSize: 12, fontWeight: '700' },
  fab: { position: 'absolute', right: 16, bottom: 40, gap: 10 },
  fabBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#16A34A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 9,
  },
  fabWhite: { backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.2 },
  fabIcon: { fontSize: 22 },
  sheetBg: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  sheetHandle: { backgroundColor: '#D1D5DB', width: 38 },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  tabActive: { backgroundColor: '#16A34A' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  tabTextActive: { color: '#FFF' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginTop: 8 },
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
          backgroundColor: '#16A34A',
          paddingHorizontal: 20,
          paddingVertical: 10,
          borderRadius: 8,
        }}>
        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}
