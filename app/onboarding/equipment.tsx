import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useProfileStore } from '../../stores/profileStore';

const C = { bg: '#F2F2F7', card: '#FFFFFF', accent: '#00B894', accentLight: '#E8FAF5', text: '#1C1C1E', text3: '#8E8E93', sep: '#E5E5EA' };

const equipmentList = [
  { id: 'dumbbells', name: 'Dumbbells', icon: 'fitness-center' },
  { id: 'barbell', name: 'Barbell & Rack', icon: 'sports-martial-arts' },
  { id: 'trapbar', name: 'Trap/Hex Bar', icon: 'hexagon' },
  { id: 'cables', name: 'Cable Machine', icon: 'link' },
  { id: 'latpull', name: 'Lat Pulldown', icon: 'arrow-downward' },
  { id: 'legpress', name: 'Leg Press', icon: 'airline-seat-legroom-extra' },
  { id: 'chestpress', name: 'Chest Press Machine', icon: 'settings-input-svideo' },
  { id: 'smithm', name: 'Smith Machine', icon: 'view-column' },
  { id: 'bench', name: 'Adjustable Bench', icon: 'event-seat' },
  { id: 'bands', name: 'Resistance Bands', icon: 'waves' },
  { id: 'pullupbar', name: 'Pull-Up Bar', icon: 'vertical-align-top' },
  { id: 'foam', name: 'Foam Roller', icon: 'circle' },
];

export default function EquipmentScreen() {
  const router = useRouter();
  const { profile, updateProfile, setOnboardingComplete } = useProfileStore();

  const toggleEquipment = (id: string) => {
    const current = profile.equipment || [];
    const updated = current.includes(id) ? current.filter(e => e !== id) : [...current, id];
    updateProfile({ equipment: updated });
  };

  const handleDone = () => {
    setOnboardingComplete();
    router.replace('/(tabs)');
  };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={20} color={C.text3} />
          <Text style={s.backText}> Back</Text>
        </TouchableOpacity>
        <Text style={s.step}>Step 6 of 6</Text>
        <Text style={s.title}>What equipment is available?</Text>
        <Text style={s.subtitle}>Select everything in your gym</Text>

        <View style={s.grid}>
          {equipmentList.map((eq) => {
            const selected = profile.equipment?.includes(eq.id);
            return (
              <TouchableOpacity
                key={eq.id}
                style={[s.gridItem, selected && s.gridItemSelected]}
                onPress={() => toggleEquipment(eq.id)}
              >
                <MaterialIcons name={eq.icon as any} size={28} color={selected ? C.accent : C.text3} />
                <Text style={[s.gridLabel, selected && s.gridLabelSelected]}>{eq.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={s.doneBtn} onPress={handleDone}>
          <Text style={s.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backText: { fontSize: 14, color: C.text3 },
  step: { fontSize: 13, color: C.accent, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: C.text3, marginBottom: 24, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 32 },
  gridItem: {
    width: '47%', backgroundColor: C.card, padding: 14, borderRadius: 12,
    borderWidth: 2, borderColor: C.sep, alignItems: 'center', gap: 6,
  },
  gridItemSelected: { borderColor: C.accent, backgroundColor: C.accentLight },
  gridLabel: { fontSize: 12, fontWeight: '500', color: C.text, textAlign: 'center' },
  gridLabelSelected: { color: C.accent },
  doneBtn: { backgroundColor: C.accent, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
