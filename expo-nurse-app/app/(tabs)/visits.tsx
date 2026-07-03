import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

type VisitStatus = 'pending' | 'in_progress' | 'completed';

interface Visit {
  id: string;
  patient: string;
  initials: string;
  address: string;
  zone: string;
  timeSlot: string;
  status: VisitStatus;
  visitType: string;
  notes: string;
}

const VISITS: Visit[] = [];

const STATUS_COLOR: Record<VisitStatus, string> = {
  pending: '#F59E0B',
  in_progress: '#3B82F6',
  completed: '#16A34A',
};
const STATUS_BG: Record<VisitStatus, string> = {
  pending: '#FFFBEB',
  in_progress: '#EFF6FF',
  completed: '#DCFCE7',
};
const STATUS_LABEL: Record<VisitStatus, string> = {
  pending: 'Pending',
  in_progress: '● In Progress',
  completed: '✓ Completed',
};

type FilterType = 'all' | VisitStatus;

export default function VisitsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all' ? VISITS : VISITS.filter(v => v.status === filter);
  const completed = VISITS.filter(v => v.status === 'completed').length;

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'Active' },
    { key: 'completed', label: 'Done' },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Today's Visits</Text>
        <Text style={s.headerSub}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={[s.statCard, { backgroundColor: '#DCFCE7' }]}>
          <Text style={[s.statNum, { color: '#15803D' }]}>{completed}</Text>
          <Text style={s.statLabel}>Done</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: '#EFF6FF' }]}>
          <Text style={[s.statNum, { color: '#1D4ED8' }]}>
            {VISITS.filter(v => v.status === 'in_progress').length}
          </Text>
          <Text style={s.statLabel}>Active</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: '#FFFBEB' }]}>
          <Text style={[s.statNum, { color: '#B45309' }]}>
            {VISITS.filter(v => v.status === 'pending').length}
          </Text>
          <Text style={s.statLabel}>Pending</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: '#F3F4F6' }]}>
          <Text style={[s.statNum, { color: '#374151' }]}>{VISITS.length}</Text>
          <Text style={s.statLabel}>Total</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroll}
        contentContainerStyle={s.filterRow}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[s.filterTab, filter === f.key && s.filterTabActive]}>
            <Text style={[s.filterTabText, filter === f.key && s.filterTabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Visit List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={s.listPad}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => router.push({ pathname: '/visit-detail', params: { visitId: item.id } })}
            activeOpacity={0.75}>
            {/* Left: avatar */}
            <View style={[s.avatar, { borderColor: STATUS_COLOR[item.status] }]}>
              <Text style={s.avatarText}>{item.initials}</Text>
            </View>

            {/* Middle: info */}
            <View style={s.info}>
              <Text style={s.patientName} numberOfLines={1}>{item.patient}</Text>
              <Text style={s.visitType}>{item.visitType}</Text>
              <View style={s.metaRow}>
                <Text style={s.metaText}>🕐 {item.timeSlot}</Text>
                <Text style={s.metaDot}>·</Text>
                <Text style={s.metaText}>📍 {item.zone}</Text>
              </View>
            </View>

            {/* Right: status */}
            <View style={[s.badge, { backgroundColor: STATUS_BG[item.status] }]}>
              <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] }]}>
                {STATUS_LABEL[item.status]}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
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
  headerSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  filterScroll: { backgroundColor: '#FFF' },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: 22,
    height: 29,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTabActive: { backgroundColor: '#16A34A' },
  filterTabText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  filterTabTextActive: { color: '#FFF' },
  listPad: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2.5,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
  info: { flex: 1 },
  patientName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  visitType: { fontSize: 12, color: '#16A34A', fontWeight: '600', marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#6B7280' },
  metaDot: { color: '#D1D5DB', fontSize: 11 },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
