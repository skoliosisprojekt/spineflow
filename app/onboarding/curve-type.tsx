import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useProfileStore } from '../../stores/profileStore';

const C = { bg: '#F2F2F7', card: '#FFFFFF', accent: '#00B894', accentLight: '#E8FAF5', text: '#1C1C1E', text3: '#8E8E93', sep: '#E5E5EA' };

const options = [
  { key: 'thoracic', icon: 'accessibility', title: 'Thoracic', desc: 'Upper/mid spine curve' },
  { key: 'lumbar', icon: 'accessibility', title: 'Lumbar', desc: 'Lower spine curve' },
  { key: 'thoracolumbar', icon: 'accessibility', title: 'Thoracolumbar', desc: 'Transition area' },
  { key: 'scurve', icon: 'accessibility', title: 'S-Curve', desc: 'Double curve' },
  { key: 'unsure', icon: 'help-outline', title: 'Not sure', desc: "I don't know yet" },
] as const;

export default function CurveTypeScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfileStore();

  const handleSelect = (curveType: string) => {
    updateProfile({ curveType: curveType as any });
    router.push('/onboarding/goal');
  };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={20} color={C.text3} />
          <Text style={s.backText}> Back</Text>
        </TouchableOpacity>
        <Text style={s.step}>Step 2 of 6</Text>
        <Text style={s.title}>What's your scoliosis type?</Text>
        <Text style={s.subtitle}>Determines curve-specific exercise modifications</Text>

        {options.map((o) => (
          <TouchableOpacity
            key={o.key}
            style={[s.option, profile.curveType === o.key && s.optionSelected]}
            onPress={() => handleSelect(o.key)}
          >
            <MaterialIcons name={o.icon as any} size={24} color={profile.curveType === o.key ? C.accent : C.text3} />
            <View style={s.optionText}>
              <Text style={s.optionTitle}>{o.title}</Text>
              <Text style={s.optionDesc}>{o.desc}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={C.text3} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 24, paddingTop: 60 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backText: { fontSize: 14, color: C.text3 },
  step: { fontSize: 13, color: C.accent, fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: C.text3, marginBottom: 24, lineHeight: 20 },
  option: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
    padding: 16, borderRadius: 12, borderWidth: 2, borderColor: C.sep, marginBottom: 12, gap: 12,
  },
  optionSelected: { borderColor: C.accent, backgroundColor: C.accentLight },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 2 },
  optionDesc: { fontSize: 13, color: C.text3 },
});
