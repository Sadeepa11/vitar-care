import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';

const DRIVER = {
  name: 'Ahmed Khalid',
  initials: 'AK',
  id: 'DRV-2024-001',
  email: 'driver@vitacare.com',
  phone: '+974 5550 1001',
  vehicle: 'Van-01',
  plate: 'QAT 4521',
  capacity: 18,
  joinDate: 'January 2023',
  todayPickups: 0,
  totalKmToday: 0,
  rating: '4.9',
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { logout, userEmail } = useAuth();

  // Dynamic user details
  const emailToShow = userEmail || DRIVER.email;
  let nameToShow = DRIVER.name;
  let initialsToShow = DRIVER.initials;

  if (userEmail && userEmail.toLowerCase() !== DRIVER.email.toLowerCase()) {
    const parts = userEmail.split('@')[0].split(/[._-]/);
    const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : '';
    const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : '';
    nameToShow = `${firstName} ${lastName}`.trim() || userEmail.split('@')[0];
    initialsToShow = ((firstName.charAt(0) || '') + (lastName.charAt(0) || '')).toUpperCase() || 'US';
  }

  const menu = [
    {icon: '🔔', label: 'Notifications', sub: 'Route and dispatch alerts'},
    {icon: '🗺', label: 'Navigation Preference', sub: 'Google Maps'},
    {icon: '🔒', label: 'Change Password', sub: ''},
    {icon: '📄', label: 'Trip Reports', sub: 'Download monthly report'},
    {icon: '❓', label: 'Help & Support', sub: 'Contact VitaCare dispatch'},
  ];

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', onPress: logout, style: 'destructive' },
    ]);
  };

  return (
    <View style={[s.root, {paddingTop: insets.top}]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Driver Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initialsToShow}</Text>
          </View>
          <Text style={s.name}>{nameToShow}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleText}>🚐 {DRIVER.vehicle} Driver</Text>
          </View>
          <View style={s.ratingRow}>
            <Text style={s.ratingStar}>⭐</Text>
            <Text style={s.ratingNum}>{DRIVER.rating}</Text>
          </View>
          <Text style={s.id}>ID: {DRIVER.id}</Text>
        </View>

        {/* Vehicle card */}
        <View style={s.vehicleCard}>
          <Text style={s.vehicleTitle}>Assigned Vehicle</Text>
          <View style={s.vehicleRow}>
            <Text style={s.vehicleIcon}>🚐</Text>
            <View style={s.vehicleInfo}>
              <Text style={s.vehicleName}>{DRIVER.vehicle} · Toyota Coaster</Text>
              <Text style={s.vehiclePlate}>🪧 {DRIVER.plate}</Text>
              <Text style={s.vehicleCapacity}>👥 Capacity: {DRIVER.capacity} nurses</Text>
            </View>
          </View>
        </View>

        {/* Today stats */}
        <View style={s.statsSection}>
          <Text style={s.sectionTitle}>Today's Summary</Text>
          <View style={s.statsRow}>
            <View style={[s.statCard, {backgroundColor: '#EFF6FF'}]}>
              <Text style={[s.statNum, {color: '#0077B6'}]}>{DRIVER.todayPickups}</Text>
              <Text style={s.statLabel}>Pickups</Text>
            </View>
            <View style={[s.statCard, {backgroundColor: '#F0FDF4'}]}>
              <Text style={[s.statNum, {color: '#15803D'}]}>{DRIVER.totalKmToday}</Text>
              <Text style={s.statLabel}>km Driven</Text>
            </View>
            <View style={[s.statCard, {backgroundColor: '#FFF7ED'}]}>
              <Text style={[s.statNum, {color: '#C2410C'}]}>6</Text>
              <Text style={s.statLabel}>Assigned</Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={s.infoCard}>
          {[
            {icon: '✉', label: 'Email', value: emailToShow},
            {icon: '📞', label: 'Phone', value: DRIVER.phone},
            {icon: '📅', label: 'Joined', value: DRIVER.joinDate},
          ].map((item, i, arr) => (
            <View key={i} style={[s.infoRow, i < arr.length - 1 && s.infoRowBorder]}>
              <Text style={s.infoIcon}>{item.icon}</Text>
              <View>
                <Text style={s.infoLabel}>{item.label}</Text>
                <Text style={s.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={s.menu}>
          {menu.map((item, i) => (
            <TouchableOpacity key={i} style={s.menuItem} activeOpacity={0.7}>
              <Text style={s.menuIcon}>{item.icon}</Text>
              <View style={s.menuText}>
                <Text style={s.menuLabel}>{item.label}</Text>
                {item.sub ? <Text style={s.menuSub}>{item.sub}</Text> : null}
              </View>
              <Text style={s.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={s.logoutBtn}
          onPress={handleLogout}>
          <Text style={s.logoutText}>🚪  Sign Out</Text>
        </TouchableOpacity>
        <View style={{height: 32}} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#F8FAFC'},
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {fontSize: 22, fontWeight: '800', color: '#0F172A'},
  hero: {
    backgroundColor: '#FFF',
    alignItems: 'center',
    paddingVertical: 28,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0077B6',
    marginBottom: 12,
  },
  avatarText: {fontSize: 26, fontWeight: '900', color: '#0077B6'},
  name: {fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 6},
  roleBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  roleText: {fontSize: 13, fontWeight: '700', color: '#1D4ED8'},
  ratingRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4},
  ratingStar: {fontSize: 16},
  ratingNum: {fontSize: 16, fontWeight: '800', color: '#F59E0B'},
  id: {fontSize: 12, color: '#9CA3AF'},
  vehicleCard: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#0077B6',
  },
  vehicleTitle: {fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 10, textTransform: 'uppercase'},
  vehicleRow: {flexDirection: 'row', alignItems: 'center'},
  vehicleIcon: {fontSize: 36, marginRight: 14},
  vehicleInfo: {},
  vehicleName: {fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 4},
  vehiclePlate: {fontSize: 13, color: '#374151', marginBottom: 3},
  vehicleCapacity: {fontSize: 13, color: '#6B7280'},
  statsSection: {paddingHorizontal: 16, paddingBottom: 4},
  sectionTitle: {fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 10},
  statsRow: {flexDirection: 'row', gap: 10, marginBottom: 16},
  statCard: {flex: 1, borderRadius: 14, padding: 14, alignItems: 'center'},
  statNum: {fontSize: 22, fontWeight: '800', marginBottom: 3},
  statLabel: {fontSize: 11, color: '#6B7280', fontWeight: '600'},
  infoCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12},
  infoRowBorder: {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6'},
  infoIcon: {fontSize: 18, width: 28, textAlign: 'center'},
  infoLabel: {fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 2},
  infoValue: {fontSize: 14, color: '#111827', fontWeight: '600'},
  menu: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: {fontSize: 20, width: 32},
  menuText: {flex: 1},
  menuLabel: {fontSize: 14, fontWeight: '700', color: '#111827'},
  menuSub: {fontSize: 12, color: '#9CA3AF', marginTop: 1},
  menuArrow: {fontSize: 20, color: '#D1D5DB'},
  logoutBtn: {
    marginHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {fontSize: 15, fontWeight: '800', color: '#DC2626'},
});
