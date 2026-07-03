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
import * as Location from 'expo-location';
import { useAuth } from '../../src/context/AuthContext';
import { useLocation } from '../../src/context/LocationContext';
import { Nurse } from '../../src/types';
import NurseAvatarMarker from '../../src/components/NurseAvatarMarker';

const SAMPLE_NURSES: Nurse[] = [];
const SAMPLE_VEHICLES: any[] = [];
import VehicleMarker from '../../src/components/VehicleMarker';
import NurseMemberCard from '../../src/components/NurseMemberCard';
import UserLocationMarker from '../../src/components/UserLocationMarker';

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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userEmail, userId } = useAuth();
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const { userCoords: rawUserCoords, requestLocation } = useLocation();
  const userCoords = rawUserCoords || DOHA_CENTER;

  const [hasFlippedToUser, setHasFlippedToUser] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const snapPoints = useMemo(() => ['14%', '48%', '88%'], []);

  // Exclude the logged-in user from the team list to remove duplication
  const loggedInNurseId = userId || '1';
  const teamNurses = useMemo(() => {
    return SAMPLE_NURSES.filter(n => n.id !== loggedInNurseId);
  }, [loggedInNurseId]);

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

    const baseNurse = (SAMPLE_NURSES.find(n => n.id === loggedInNurseId) || {}) as Partial<Nurse>;

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
  }, [userEmail, loggedInNurseId]);

  const activeCount = teamNurses.filter(n => n.status === 'at_work').length;
  const transitCount = teamNurses.filter(n => n.status === 'in_transit').length;
  const sosCount = teamNurses.filter(n => n.status === 'sos').length;

  useEffect(() => {
    if (rawUserCoords && isValidCoordinate(rawUserCoords) && !hasFlippedToUser) {
      cameraRef.current?.flyTo(rawUserCoords, 900);
      setHasFlippedToUser(true);
    }
  }, [rawUserCoords, hasFlippedToUser]);

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

        {/* Nurse team markers */}
        {teamNurses.filter(n => n !== null && n !== undefined).map(nurse => {
          const nurseLng = typeof nurse.lng === 'number' && !isNaN(nurse.lng) ? nurse.lng : DOHA_CENTER[0];
          const nurseLat = typeof nurse.lat === 'number' && !isNaN(nurse.lat) ? nurse.lat : DOHA_CENTER[1];
          const nurseId = nurse.id || `nurse-${Math.random()}`;
          return (
            <MapboxGL.MarkerView
              key={nurseId}
              coordinate={[nurseLng, nurseLat]}
              anchor={{ x: 0.5, y: 1 }}>
              <NurseAvatarMarker
                nurse={nurse}
                isSelected={selectedNurse?.id === nurseId}
                onPress={() => handleNursePress(nurse)}
              />
            </MapboxGL.MarkerView>
          );
        })}

        {/* Vehicle markers */}
        {SAMPLE_VEHICLES.filter(v => v !== null && v !== undefined).map(v => {
          const vLng = typeof v.lng === 'number' && !isNaN(v.lng) ? v.lng : DOHA_CENTER[0];
          const vLat = typeof v.lat === 'number' && !isNaN(v.lat) ? v.lat : DOHA_CENTER[1];
          const vId = v.id || `vehicle-${Math.random()}`;
          return (
            <MapboxGL.MarkerView
              key={vId}
              coordinate={[vLng, vLat]}
              anchor={{ x: 0.5, y: 0.5 }}>
              <VehicleMarker vehicle={v} />
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
            <Text style={s.logoText}>VC</Text>
          </View>
          <View>
            <Text style={s.appName}>VitaCare</Text>
            <Text style={s.shift}>Morning Shift · Doha</Text>
          </View>
        </View>
        <View style={s.topRight}>
          {sosCount > 0 && (
            <View style={s.sosPill}>
              <Text style={s.sosText}>🆘 {sosCount} SOS</Text>
            </View>
          )}
          <TouchableOpacity style={s.iconBtn}>
            <Text style={s.iconChar}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn}>
            <Text style={s.iconChar}>⋯</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* STAT CHIPS */}
      <View
        style={[
          s.chips,
          { top: insets.top + (Platform.OS === 'android' ? 56 : 52) },
        ]}>
        <View style={[s.chip, { backgroundColor: '#DCFCE7' }]}>
          <View style={[s.chipDot, { backgroundColor: '#16A34A' }]} />
          <Text style={[s.chipText, { color: '#15803D' }]}>{activeCount} Working</Text>
        </View>
        <View style={[s.chip, { backgroundColor: '#FEF3C7' }]}>
          <View style={[s.chipDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[s.chipText, { color: '#B45309' }]}>{transitCount} Transit</Text>
        </View>
        <View style={[s.chip, { backgroundColor: '#F0FDF4' }]}>
          <Text style={[s.chipText, { color: '#15803D' }]}>
            🚐 {SAMPLE_VEHICLES.length} Vans
          </Text>
        </View>
      </View>

      {/* FAB */}
      <View style={s.fab}>
        <TouchableOpacity style={s.fabBtn} onPress={flyToUser}>
          <Text style={s.fabIcon}>📍</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.fabBtn, s.fabWhite]}
          onPress={() => {
            cameraRef.current?.setCamera({
              centerCoordinate: DOHA_CENTER,
              zoomLevel: 12,
              animationDuration: 700,
            });
          }}>
          <Text style={s.fabIcon}>🗺️</Text>
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
            <Text style={s.sheetTitle}>Nurse Team</Text>
            <Text style={s.sheetSub}>{teamNurses.length} nurses tracked</Text>
          </View>
          <TouchableOpacity style={s.filterBtn}>
            <Text style={s.filterText}>Filter ▾</Text>
          </TouchableOpacity>
        </View>
        <View style={s.divider} />
        <BottomSheetFlatList
          data={teamNurses}
          keyExtractor={item => item?.id || Math.random().toString()}
          renderItem={renderCard}
          contentContainerStyle={{ paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheet>
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
  fab: { position: 'absolute', right: 16, bottom: 220, gap: 10 },
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
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  sheetSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
  },
  filterText: { fontSize: 13, fontWeight: '700', color: '#16A34A' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB' },
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
