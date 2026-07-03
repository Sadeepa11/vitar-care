import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const VISIT_DATA: Record<string, any> = {};

export default function VisitDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { visitId } = useLocalSearchParams<{ visitId: string }>();
  const visit = (visitId && VISIT_DATA[visitId]) ?? {
    id: '',
    patient: 'Unknown Patient',
    initials: 'UP',
    age: 0,
    condition: 'None',
    address: 'No Address',
    timeSlot: '--:--',
    visitType: 'None',
    doctor: 'Unknown Doctor',
    status: 'pending',
  };

  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(visit.status === 'completed');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to upload visit photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take visit photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleComplete = () => {
    if (!notes.trim() && photos.length === 0) {
      Alert.alert('Add Notes', 'Please add visit notes or photos before completing.');
      return;
    }
    setSubmitted(true);
    Alert.alert('Visit Completed ✅', 'Visit report submitted successfully.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Visit Detail</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Patient Card */}
          <View style={s.patientCard}>
            <View style={s.patientAvatar}>
              <Text style={s.patientAvatarText}>{visit.initials}</Text>
            </View>
            <View style={s.patientInfo}>
              <Text style={s.patientName}>{visit.patient}</Text>
              <Text style={s.patientMeta}>Age {visit.age} · {visit.condition}</Text>
              <Text style={s.patientDoctor}>👨‍⚕️ {visit.doctor}</Text>
            </View>
          </View>

          {/* Visit Info */}
          <View style={s.infoCard}>
            <Row icon="🏥" label="Visit Type" value={visit.visitType} />
            <Row icon="🕐" label="Time Slot" value={visit.timeSlot} />
            <Row icon="📍" label="Address" value={visit.address} />
          </View>

          {/* Notes */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Visit Notes</Text>
            <TextInput
              style={s.notesInput}
              placeholder="Describe the visit, patient condition, procedures performed..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
              editable={!submitted}
            />
          </View>

          {/* Photos */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Photos</Text>
            <View style={s.photoRow}>
              {!submitted && (
                <>
                  <TouchableOpacity style={s.photoAdd} onPress={takePhoto}>
                    <Text style={s.photoAddIcon}>📷</Text>
                    <Text style={s.photoAddText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.photoAdd} onPress={pickImage}>
                    <Text style={s.photoAddIcon}>🖼</Text>
                    <Text style={s.photoAddText}>Gallery</Text>
                  </TouchableOpacity>
                </>
              )}
              {photos.map((uri, idx) => (
                <View key={idx} style={s.photoThumb}>
                  <Image source={{ uri }} style={s.photoImg} />
                  {!submitted && (
                    <TouchableOpacity
                      style={s.photoRemove}
                      onPress={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}>
                      <Text style={s.photoRemoveText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.submitBtn, submitted && { backgroundColor: '#16A34A' }]}
            onPress={handleComplete}
            disabled={submitted}
            activeOpacity={0.85}>
            <Text style={s.submitIcon}>{submitted ? '✓' : '🏁'}</Text>
            <Text style={s.submitText}>
              {submitted ? 'Completed' : 'Complete Visit'}
            </Text>
          </TouchableOpacity>
          <View style={{ height: Math.max(insets.bottom, 24) }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={rowS.wrap}>
      <Text style={rowS.icon}>{icon}</Text>
      <View>
        <Text style={rowS.label}>{label}</Text>
        <Text style={rowS.value}>{value}</Text>
      </View>
    </View>
  );
}

const rowS = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  icon: { fontSize: 18, marginTop: 1 },
  label: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 2 },
  value: { fontSize: 14, color: '#111827', fontWeight: '600' },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backIcon: { fontSize: 22, color: '#374151' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  patientCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  patientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  patientAvatarText: { fontSize: 20, fontWeight: '800', color: '#15803D' },
  patientInfo: { flex: 1 },
  patientName: { fontSize: 17, fontWeight: '800', color: '#0F172A', marginBottom: 3 },
  patientMeta: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  patientDoctor: { fontSize: 13, color: '#16A34A', fontWeight: '600' },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  notesInput: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 14,
    fontSize: 14,
    color: '#111827',
    minHeight: 120,
  },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoAdd: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#16A34A',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
  },
  photoAddIcon: { fontSize: 24, marginBottom: 4 },
  photoAddText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRemoveText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  submitBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  submitIcon: { fontSize: 22 },
  submitText: { fontSize: 17, fontWeight: '800', color: '#FFF' },
});
