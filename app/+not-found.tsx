import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View style={s.container}>
      <Text style={s.title}>Page not found</Text>
      <Link href="/" style={s.link}>
        <Text style={s.linkText}>Go to home screen</Text>
      </Link>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#F2F2F7' },
  title: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },
  link: { marginTop: 15, paddingVertical: 15 },
  linkText: { fontSize: 14, color: '#00B894' },
});
