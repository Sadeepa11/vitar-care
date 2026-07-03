import React from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { TripHistory } from '../../src/types';
const TRIP_HISTORY: TripHistory[] = [];

function TripCard({trip}: {trip: TripHistory}) {
  const dateObj = new Date(trip.date);
  const isToday = trip.date === '2026-05-29';
  const label = dateObj.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const hours = Math.floor(trip.durationMinutes / 60);
  const mins = trip.durationMinutes % 60;

  return (
    <View style={[c.card, isToday && c.cardToday]}>
      {isToday && (
        <View style={c.todayBadge}>
          <Text style={c.todayText}>Today</Text>
        </View>
      )}
      <View style={c.top}>
        <View>
          <Text style={c.date}>{label}</Text>
          <View style={c.shiftRow}>
            <Text style={c.shiftIcon}>{trip.shift === 'morning' ? '🌅' : '🌆'}</Text>
            <Text style={c.shiftLabel}>
              {trip.shift === 'morning' ? 'Morning Shift' : 'Evening Shift'}
            </Text>
          </View>
        </View>
        <View style={c.nursesCircle}>
          <Text style={c.nursesNum}>{trip.nursesCount}</Text>
          <Text style={c.nursesLabel}>nurses</Text>
        </View>
      </View>
      <View style={c.statsRow}>
        <View style={c.stat}>
          <Text style={c.statIcon}>🛣</Text>
          <Text style={c.statValue}>{trip.totalKm} km</Text>
          <Text style={c.statLabel}>Distance</Text>
        </View>
        <View style={c.statDivider} />
        <View style={c.stat}>
          <Text style={c.statIcon}>⏱</Text>
          <Text style={c.statValue}>{hours}h {mins}m</Text>
          <Text style={c.statLabel}>Duration</Text>
        </View>
        <View style={c.statDivider} />
        <View style={c.stat}>
          <Text style={c.statIcon}>⚡</Text>
          <Text style={c.statValue}>
            {(trip.totalKm / (trip.durationMinutes / 60)).toFixed(0)} km/h
          </Text>
          <Text style={c.statLabel}>Avg Speed</Text>
        </View>
      </View>
    </View>
  );
}

const c = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  cardToday: {borderWidth: 2, borderColor: '#0077B6'},
  todayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0077B6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 10,
  },
  todayText: {fontSize: 11, fontWeight: '800', color: '#FFF'},
  top: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14},
  date: {fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4},
  shiftRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  shiftIcon: {fontSize: 14},
  shiftLabel: {fontSize: 13, color: '#6B7280', fontWeight: '600'},
  nursesCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  nursesNum: {fontSize: 20, fontWeight: '900', color: '#0077B6'},
  nursesLabel: {fontSize: 9, fontWeight: '700', color: '#93C5FD'},
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  stat: {flex: 1, alignItems: 'center'},
  statIcon: {fontSize: 16, marginBottom: 3},
  statValue: {fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 2},
  statLabel: {fontSize: 10, color: '#9CA3AF', fontWeight: '600'},
  statDivider: {width: 1, height: 36, backgroundColor: '#E5E7EB'},
});

export default function TripHistoryScreen() {
  const insets = useSafeAreaInsets();

  const totalKm = TRIP_HISTORY.reduce((s, t) => s + t.totalKm, 0);
  const totalNurses = TRIP_HISTORY.reduce((s, t) => s + t.nursesCount, 0);
  const totalTrips = TRIP_HISTORY.length;

  return (
    <View style={[s.root, {paddingTop: insets.top}]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Trip History</Text>
        <Text style={s.headerSub}>Van-01 · Last 7 days</Text>
      </View>

      {/* Summary */}
      <View style={s.summary}>
        <View style={s.summaryItem}>
          <Text style={s.summaryNum}>{totalTrips}</Text>
          <Text style={s.summaryLabel}>Trips</Text>
        </View>
        <View style={s.summaryDiv} />
        <View style={s.summaryItem}>
          <Text style={s.summaryNum}>{totalNurses}</Text>
          <Text style={s.summaryLabel}>Nurses Transported</Text>
        </View>
        <View style={s.summaryDiv} />
        <View style={s.summaryItem}>
          <Text style={s.summaryNum}>{totalKm.toFixed(0)}</Text>
          <Text style={s.summaryLabel}>Total km</Text>
        </View>
      </View>

      <FlatList
        data={TRIP_HISTORY}
        keyExtractor={t => t.id}
        renderItem={({item}) => <TripCard trip={item} />}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />
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
  summary: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    marginBottom: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  summaryItem: {flex: 1, alignItems: 'center'},
  summaryNum: {fontSize: 24, fontWeight: '900', color: '#0077B6', marginBottom: 3},
  summaryLabel: {fontSize: 11, color: '#6B7280', fontWeight: '600', textAlign: 'center'},
  summaryDiv: {width: 1, backgroundColor: '#F3F4F6'},
  list: {padding: 16, paddingBottom: 40},
});
