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
  red: '#FF3B30',
};

export default function RegisterScreen() {
  const router = useRouter();
  const auth = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordMismatch = password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword;
  const valid = email.length > 0 && password.length >= 8 && password === confirmPassword && ageConfirmed;

  const handleRegister = async () => {
    if (!valid) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { age_confirmed: true } },
      });
      if (error) {
        Alert.alert('Registration Error', error.message);
      } else if (data.session) {
        auth.setSession(data.session);
        auth.setUser(data.session.user);
      } else {
        Alert.alert(
          'Check your email',
          'We sent a verification link to ' + email + '. Please verify your email, then log in.'
        );
        router.replace('/auth/login');
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.logoWrap}>
            <MaterialIcons name="fitness-center" size={48} color={C.accent} />
            <Text style={s.logoText}>SpineFlow</Text>
          </View>

          <Text style={s.heading}>Create Account</Text>
          <Text style={s.sub}>Join SpineFlow today</Text>

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
                placeholder="Password (min 8 characters)"
                placeholderTextColor={C.text3}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            <View style={s.inputWrap}>
              <MaterialIcons name="lock-outline" size={20} color={C.text3} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Confirm Password"
                placeholderTextColor={C.text3}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
            {passwordMismatch && (
              <Text style={s.errorText}>Passwords do not match</Text>
            )}

            <TouchableOpacity style={s.checkRow} onPress={() => setAgeConfirmed(!ageConfirmed)}>
              <MaterialIcons
                name={ageConfirmed ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color={ageConfirmed ? C.accent : C.text3}
              />
              <Text style={s.checkText}>I confirm I am at least 16 years old</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btn, (!valid || loading) && s.btnDisabled]}
              onPress={handleRegister}
              disabled={!valid || loading}
            >
              <Text style={s.btnText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={s.footerLink}>Log in</Text>
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
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  checkText: { fontSize: 14, color: C.text2, flex: 1 },
  errorText: { color: C.red, fontSize: 12, marginBottom: 8, marginLeft: 4 },
  footer: { flexDirection: 'row', marginTop: 24 },
  footerText: { fontSize: 14, color: C.text3 },
  footerLink: { fontSize: 14, color: C.accent, fontWeight: '600' },
});

