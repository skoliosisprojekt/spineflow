import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../../stores/profileStore';

const C = { bg: '#F2F2F7', card: '#FFFFFF', accent: '#00B894', text: '#1C1C1E', text3: '#8E8E93', sep: '#E5E5EA' };

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useProfileStore();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{getGreeting()}</Text>
            <Text style={s.title}>Your Training</Text>
          </View>
          <TouchableOpacity style={s.settingsBtn}>
            <MaterialIcons name="settings" size={22} color={C.text3} />
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <MaterialIcons name="fitness-center" size={32} color={C.accent} />
          <Text style={s.cardTitle}>Ready to train</Text>
          <Text style={s.cardSub}>
            Curve: {profile.curveType || 'Not set'} | Surgery: {profile.surgery || 'None'}
          </Text>
          <TouchableOpacity style={s.startBtn} onPress={() => router.push('/(tabs)/workout')}>
            <Text style={s.startBtnText}>Start Workout</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.placeholder}>Home dashboard coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { flex: 1, padding: 20, paddingTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 14, color: C.text3 },
  title: { fontSize: 26, fontWeight: '700', color: C.text },
  settingsBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.sep, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 24 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  cardSub: { fontSize: 13, color: C.text3 },
  startBtn: { backgroundColor: C.accent, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12, marginTop: 8 },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  placeholder: { textAlign: 'center', color: C.text3, fontSize: 14, marginTop: 20 },
});
