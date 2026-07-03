import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AttendanceRecord {
  id: string;
  checkIn: string;
  checkOut: string | null;
  date: string;
  location: string;
  status: 'present' | 'late' | 'absent';
}

const HISTORY: AttendanceRecord[] = [];

const STATUS_COLOR = { present: '#16A34A', late: '#F59E0B', absent: '#EF4444' };
const STATUS_BG = { present: '#F0FDF4', late: '#FFFBEB', absent: '#FFF1F2' };

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);

  const handleCheckIn = () => {
    const now = formatTime(new Date());
    setCheckedIn(true);
    setCheckInTime(now);
    Alert.alert('Checked In ✅', `You checked in at ${now}\nLocation: Al Sadd, Doha`);
  };

  const handleCheckOut = () => {
    const now = formatTime(new Date());
    setCheckedIn(false);
    setCheckOutTime(now);
    Alert.alert('Checked Out 👋', `You checked out at ${now}`);
  };

  const todayDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Attendance</Text>
        <Text style={s.headerDate}>{todayDate}</Text>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Today Status Card */}
        <View style={s.todayCard}>
          <View style={s.shiftRow}>
            <View style={s.shiftBadge}>
              <Text style={s.shiftText}>🌅  Morning Shift  06:00 – 18:00</Text>
            </View>
          </View>

          {/* Times row */}
          <View style={s.timesRow}>
            <View style={s.timeBox}>
              <Text style={s.timeLabel}>Check In</Text>
              <Text style={[s.timeValue, { color: checkInTime ? '#16A34A' : '#9CA3AF' }]}>
                {checkInTime ?? '--:--'}
              </Text>
            </View>
            <View style={s.timeDivider} />
            <View style={s.timeBox}>
              <Text style={s.timeLabel}>Check Out</Text>
              <Text style={[s.timeValue, { color: checkOutTime ? '#EF4444' : '#9CA3AF' }]}>
                {checkOutTime ?? '--:--'}
              </Text>
            </View>
            <View style={s.timeDivider} />
            <View style={s.timeBox}>
              <Text style={s.timeLabel}>Hours</Text>
              <Text style={[s.timeValue, { color: '#3B82F6' }]}>
                {checkInTime && checkOutTime ? '11h 10m' : '--'}
              </Text>
            </View>
          </View>

          {/* Status */}
          <View style={[s.statusRow, { backgroundColor: checkedIn ? '#F0FDF4' : '#F8FAFC' }]}>
            <View style={[s.statusDot, { backgroundColor: checkedIn ? '#16A34A' : '#9CA3AF' }]} />
            <Text style={[s.statusText, { color: checkedIn ? '#15803D' : '#6B7280' }]}>
              {checkedIn ? 'Currently On Shift' : checkInTime ? 'Shift Completed' : 'Not Checked In'}
            </Text>
          </View>

          {/* Location */}
          <View style={s.locationRow}>
            <Text style={s.locationIcon}>📍</Text>
            <Text style={s.locationText}>Al Sadd, Doha, Qatar</Text>
          </View>
        </View>

        {/* Check In / Out Button */}
        {!checkOutTime && (
          <TouchableOpacity
            style={[s.actionBtn, checkedIn && s.actionBtnOut]}
            onPress={checkedIn ? handleCheckOut : handleCheckIn}
            activeOpacity={0.85}>
            <Text style={s.actionBtnIcon}>{checkedIn ? '🔴' : '🟢'}</Text>
            <Text style={s.actionBtnText}>
              {checkedIn ? 'Check Out' : 'Check In'}
            </Text>
            <Text style={s.actionBtnSub}>
              {checkedIn ? 'Tap to end your shift' : 'Tap to start your shift'}
            </Text>
          </TouchableOpacity>
        )}

        {/* History */}
        <Text style={s.sectionTitle}>Recent History</Text>
        {HISTORY.map(record => (
          <View key={record.id} style={s.historyCard}>
            <View style={s.historyLeft}>
              <Text style={s.historyDate}>{record.date}</Text>
              <Text style={s.historyLocation}>📍 {record.location}</Text>
            </View>
            <View style={s.historyMid}>
              <Text style={s.historyTime}>↓ {record.checkIn}</Text>
              <Text style={s.historyTime}>↑ {record.checkOut ?? '—'}</Text>
            </View>
            <View style={[s.historyBadge, { backgroundColor: STATUS_BG[record.status] }]}>
              <Text style={[s.historyBadgeText, { color: STATUS_COLOR[record.status] }]}>
                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
              </Text>
            </View>
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerDate: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  todayCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  shiftRow: { marginBottom: 14 },
  shiftBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  shiftText: { fontSize: 13, fontWeight: '700', color: '#15803D' },
  timesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  timeBox: { flex: 1, alignItems: 'center' },
  timeDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },
  timeLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  timeValue: { fontSize: 20, fontWeight: '800' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    marginBottom: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationIcon: { fontSize: 14 },
  locationText: { fontSize: 13, color: '#6B7280' },
  actionBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  actionBtnOut: { backgroundColor: '#EF4444', shadowColor: '#EF4444' },
  actionBtnIcon: { fontSize: 32, marginBottom: 6 },
  actionBtnText: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 4 },
  actionBtnSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  historyLeft: { flex: 1 },
  historyDate: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 3 },
  historyLocation: { fontSize: 12, color: '#6B7280' },
  historyMid: { marginHorizontal: 12 },
  historyTime: { fontSize: 13, color: '#374151', fontWeight: '600', marginBottom: 2 },
  historyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  historyBadgeText: { fontSize: 12, fontWeight: '700' },
});
