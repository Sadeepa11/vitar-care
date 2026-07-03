import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';

const NURSE = {
  name: 'Fatima Al-Mansouri',
  initials: 'FA',
  id: 'NRS-2024-001',
  role: 'Senior Nurse',
  email: 'nurse@vitacare.com',
  phone: '+974 5551 0001',
  zone: 'Al Sadd',
  vehicle: 'Van-01 (Ahmed Khalid)',
  joinDate: 'March 2023',
  todayVisits: 6,
  completedVisits: 2,
  hoursWorked: '5h 20m',
};

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={[sc.card, { backgroundColor: color + '20' }]}>
      <Text style={[sc.value, { color }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  value: { fontSize: 22, fontWeight: '800', marginBottom: 3 },
  label: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
});

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { logout, userEmail } = useAuth();

  // Dynamic user details
  const emailToShow = userEmail || NURSE.email;
  let nameToShow = NURSE.name;
  let initialsToShow = NURSE.initials;

  if (userEmail && userEmail.toLowerCase() !== NURSE.email.toLowerCase()) {
    const parts = userEmail.split('@')[0].split(/[._-]/);
    const firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : '';
    const lastName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : '';
    nameToShow = `${firstName} ${lastName}`.trim() || userEmail.split('@')[0];
    initialsToShow = ((firstName.charAt(0) || '') + (lastName.charAt(0) || '')).toUpperCase() || 'US';
  }

  const menuItems = [
    { icon: '🔔', label: 'Notifications', sub: 'Vehicle proximity alerts' },
    { icon: '📍', label: 'Location Sharing', sub: 'Currently active' },
    { icon: '🔒', label: 'Change Password', sub: '' },
    { icon: '📄', label: 'Attendance Report', sub: 'Download monthly report' },
    { icon: '❓', label: 'Help & Support', sub: 'Contact VitaCare team' },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Hero */}
        <View style={s.hero}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initialsToShow}</Text>
          </View>
          <Text style={s.name}>{nameToShow}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleText}>🏥 {NURSE.role}</Text>
          </View>
          <Text style={s.id}>ID: {NURSE.id}</Text>
        </View>

        {/* Today Stats */}
        <View style={s.statsSection}>
          <Text style={s.sectionTitle}>Today's Summary</Text>
          <View style={s.statsRow}>
            <StatCard value={String(NURSE.todayVisits)} label="Visits" color="#16A34A" />
            <StatCard value={String(NURSE.completedVisits)} label="Completed" color="#22C55E" />
            <StatCard value={NURSE.hoursWorked} label="Hours" color="#3B82F6" />
          </View>
        </View>

        {/* Info */}
        <View style={s.infoCard}>
          <InfoRow icon="✉" label="Email" value={emailToShow} />
          <InfoRow icon="📞" label="Phone" value={NURSE.phone} />
          <InfoRow icon="📍" label="Zone" value={NURSE.zone} />
          <InfoRow icon="🚐" label="Assigned Vehicle" value={NURSE.vehicle} />
          <InfoRow icon="📅" label="Joined" value={NURSE.joinDate} last />
        </View>

        {/* Menu */}
        <View style={s.menu}>
          {menuItems.map((item, i) => (
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

        {/* Logout */}
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}>
          <Text style={s.logoutText}>🚪  Sign Out</Text>
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, last }: any) {
  return (
    <View style={[ir.row, !last && ir.rowBorder]}>
      <Text style={ir.icon}>{icon}</Text>
      <View style={ir.info}>
        <Text style={ir.label}>{label}</Text>
        <Text style={ir.value}>{value}</Text>
      </View>
    </View>
  );
}

const ir = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6' },
  icon: { fontSize: 18, width: 28, textAlign: 'center' },
  info: { flex: 1 },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 2 },
  value: { fontSize: 14, color: '#111827', fontWeight: '600' },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
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
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#16A34A',
    marginBottom: 12,
  },
  avatarText: { fontSize: 26, fontWeight: '900', color: '#15803D' },
  name: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  roleBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 6,
  },
  roleText: { fontSize: 13, fontWeight: '700', color: '#15803D' },
  id: { fontSize: 12, color: '#9CA3AF' },
  statsSection: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 10 },
  infoCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  menu: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: { fontSize: 20, width: 32 },
  menuText: { flex: 1 },
  menuLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  menuSub: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  menuArrow: { fontSize: 20, color: '#D1D5DB' },
  logoutBtn: {
    marginHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: { fontSize: 15, fontWeight: '800', color: '#DC2626' },
});
