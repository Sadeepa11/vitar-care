import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AssignedNurse, NurseStatus } from '../../src/types';
const ASSIGNED_NURSES: AssignedNurse[] = [];

const STATUS_COLOR: Record<NurseStatus, string> = {
  waiting: '#F59E0B',
  picked_up: '#22C55E',
  skipped: '#9CA3AF',
};

export default function RouteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [nurses, setNurses] = useState<AssignedNurse[]>(ASSIGNED_NURSES);

  const pickedUp = nurses.filter(n => n.status === 'picked_up').length;
  const nextNurse = nurses.find(n => n.status === 'waiting');

  const handlePickup = (id: string) => {
    setNurses(prev =>
      prev.map(n => (n.id === id ? {...n, status: 'picked_up'} : n)),
    );
    Alert.alert('Picked Up ✓', 'Nurse marked as picked up.');
  };

  const handleNavigate = (nurse: AssignedNurse) => {
    router.push({
      pathname: '/active-pickup',
      params: { nurseId: nurse.id }
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
            {pickedUp}
            <Text style={s.progressTotal}>/{nurses.length}</Text>
          </Text>
          <Text style={s.progressLabel}>Nurses Picked Up</Text>
        </View>
        <View style={s.progressRight}>
          {nextNurse ? (
            <TouchableOpacity
              style={s.startBtn}
              onPress={() => handleNavigate(nextNurse)}
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
            {width: `${nurses.length > 0 ? (pickedUp / nurses.length) * 100 : 0}%` as any},
          ]}
        />
      </View>

      {/* List */}
      <FlatList
        data={nurses}
        keyExtractor={item => item.id}
        contentContainerStyle={s.listPad}
        showsVerticalScrollIndicator={false}
        renderItem={({item, index}) => {
          const isDone = item.status === 'picked_up';
          const isNext = item.id === nextNurse?.id;

          return (
            <View style={[s.card, isNext && s.cardNext, isDone && s.cardDone]}>
              {/* Order + connector */}
              <View style={s.leftCol}>
                <View style={[s.orderCircle, isDone && s.orderCircleDone, isNext && s.orderCircleNext]}>
                  <Text style={s.orderText}>
                    {isDone ? '✓' : item.pickupOrder}
                  </Text>
                </View>
                {index < nurses.length - 1 && (
                  <View style={[s.connector, isDone && {backgroundColor: '#22C55E'}]} />
                )}
              </View>

              {/* Info */}
              <View style={s.cardBody}>
                <View style={s.cardTop}>
                  <View style={{flex: 1, paddingRight: 8}}>
                    <Text style={[s.nurseName, isDone && {color: '#9CA3AF'}]}>
                      {item.name}
                    </Text>
                    <Text style={s.nurseAddr} numberOfLines={1}>
                      📍 {item.address}
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
                          onPress={() => handlePickup(item.id)}>
                          <Text style={s.pickupBtnText}>✓ Picked</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {isDone && (
                      <View style={s.doneBadge}>
                        <Text style={s.doneText}>✓ Done</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          );
        }}
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
