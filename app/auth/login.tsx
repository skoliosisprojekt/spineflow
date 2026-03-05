import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

const C = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  accent: '#00B894',
  text: '#1C1C1E',
  text2: '#3C3C43',
  text3: '#8E8E93',
  sep: '#E5E5EA',
};

export default function LoginScreen() {
  const router = useRouter();
  const auth = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert('Login Error', error.message);
      } else if (data.session) {
        auth.setSession(data.session);
        auth.setUser(data.session.user);
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const valid = email.length > 0 && password.length > 0;

  return (
    <View style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.logoWrap}>
            <MaterialIcons name="fitness-center" size={48} color={C.accent} />
            <Text style={s.logoText}>SpineFlow</Text>
          </View>

          <Text style={s.heading}>Welcome back</Text>
          <Text style={s.sub}>Sign in to your account</Text>

          <View style={s.form}>
            <View style={s.inputWrap}>
              <MaterialIcons name="email" size={20} color={C.text3} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Email"
                placeholderTextColor={C.text3}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={s.inputWrap}>
              <MaterialIcons name="lock" size={20} color={C.text3} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Password"
                placeholderTextColor={C.text3}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[s.btn, (!valid || loading) && s.btnDisabled]}
              onPress={handleLogin}
              disabled={!valid || loading}
            >
              <Text style={s.btnText}>{loading ? 'Signing in...' : 'Log In'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/auth/forgot-password')} style={s.linkBtn}>
              <Text style={s.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={s.footerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 80, alignItems: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  logoText: { fontSize: 28, fontWeight: '700', color: C.text, marginTop: 8 },
  heading: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 4 },
  sub: { fontSize: 14, color: C.text3, marginBottom: 28 },
  form: { width: '100%', maxWidth: 400 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.sep,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: C.text },
  btn: {
    backgroundColor: C.accent,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { backgroundColor: C.sep },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkBtn: { alignItems: 'center', paddingVertical: 16 },
  linkText: { color: C.text3, fontSize: 14 },
  footer: { flexDirection: 'row', marginTop: 24 },
  footerText: { fontSize: 14, color: C.text3 },
  footerLink: { fontSize: 14, color: C.accent, fontWeight: '600' },
});
