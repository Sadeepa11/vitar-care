import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {AssignedNurse, NurseStatus} from '../types';

const STATUS_COLOR: Record<NurseStatus, string> = {
  waiting: '#F59E0B',
  picked_up: '#22C55E',
  skipped: '#9CA3AF',
};

interface Props {
  nurse: AssignedNurse;
  isNext: boolean;
  onPress: () => void;
}

export default function NursePinMarker({nurse, isNext, onPress}: Props) {
  if (!nurse) return null;
  const status = nurse.status || 'waiting';
  const color = STATUS_COLOR[status] || STATUS_COLOR.waiting;
  const size = isNext ? 48 : 38;
  const order = nurse.pickupOrder ?? 0;
  const safeName = nurse.name || 'Nurse';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={s.wrapper}>
      <View
        style={[
          s.pin,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            shadowColor: color,
          },
          isNext && s.pinNext,
        ]}>
        {status === 'picked_up' ? (
          <Text style={s.checkIcon}>✓</Text>
        ) : (
          <Text style={[s.order, {fontSize: isNext ? 17 : 14}]}>
            {order}
          </Text>
        )}
      </View>
      {isNext && (
        <View style={s.nextLabel}>
          <Text style={s.nextText}>NEXT</Text>
        </View>
      )}
      <View style={[s.nameTag, status === 'picked_up' && {backgroundColor: '#22C55E'}]}>
        <Text style={[s.nameText, status === 'picked_up' && {color: '#FFF'}]} numberOfLines={1}>
          {safeName.split(' ')[0]}
        </Text>
      </View>
      <View style={[s.caret, {borderTopColor: isNext ? color : '#FFF'}]} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  wrapper: {alignItems: 'center'},
  pin: {
    borderWidth: 3,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 7,
  },
  pinNext: {borderWidth: 3.5},
  order: {fontWeight: '800', color: '#0F172A'},
  checkIcon: {fontSize: 16, color: '#22C55E', fontWeight: '800'},
  nextLabel: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nextText: {fontSize: 9, fontWeight: '800', color: '#FFF'},
  nameTag: {
    backgroundColor: '#FFF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  nameText: {fontSize: 11, fontWeight: '700', color: '#111827'},
  caret: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
