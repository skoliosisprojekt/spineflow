import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function NutritionScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>Nutrition</Text>
        <MaterialIcons name="restaurant" size={48} color="#8E8E93" />
        <Text style={s.sub}>Nutrition tracking coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
  container: { flex: 1, padding: 24, paddingTop: 60, alignItems: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#1C1C1E', alignSelf: 'flex-start' },
  sub: { fontSize: 14, color: '#8E8E93' },
});
