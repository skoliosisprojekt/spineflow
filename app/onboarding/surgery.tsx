import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useProfileStore } from '../../stores/profileStore';

const C = { bg: '#F2F2F7', card: '#FFFFFF', accent: '#00B894', accentLight: '#E8FAF5', text: '#1C1C1E', text2: '#3C3C43', text3: '#8E8E93', sep: '#E5E5EA' };

const options = [
  { key: 'none', icon: 'check-circle', title: 'No surgery', desc: 'No spinal operations' },
  { key: 'partial', icon: 'build', title: 'Partial spinal fusion', desc: 'Some vertebrae fused (e.g. T4-T12)' },
  { key: 'full', icon: 'warning', title: 'Long/full spinal fusion', desc: 'Most of the spine fused' },
  { key: 'vbt', icon: 'link', title: 'Vertebral Body Tethering', desc: 'VBT / flexible correction' },
  { key: 'rods', icon: 'straighten', title: 'Growing rods / MAGEC', desc: 'Adjustable rod system' },
] as const;

export default function SurgeryScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfileStore();

  const handleSelect = (surgery: string) => {
    updateProfile({ surgery: surgery as any });
    router.push('/onboarding/curve-type');
  };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.step}>Step 1 of 6</Text>
        <Text style={s.title}>Have you had spinal surgery?</Text>
        <Text style={s.subtitle}>This significantly affects which exercises are safe</Text>

        {options.map((o) => (
          <TouchableOpacity
            key={o.key}
            style={[s.option, profile.surgery === o.key && s.optionSelected]}
            onPress={() => handleSelect(o.key)}
          >
            <MaterialIcons name={o.icon as any} size={24} color={profile.surgery === o.key ? C.accent : C.text3} />
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
