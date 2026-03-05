import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const C = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  accent: '#00B894',
  text: '#1C1C1E',
  text3: '#8E8E93',
  sep: '#E5E5EA',
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setSent(true);
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
            <MaterialIcons name="lock-reset" size={48} color={C.accent} />
          </View>

          <Text style={s.heading}>Reset Password</Text>
          <Text style={s.sub}>Enter your email and we'll send you a reset link.</Text>

          {sent ? (
            <View style={s.successBox}>
              <MaterialIcons name="check-circle" size={40} color={C.accent} />
              <Text style={s.successTitle}>Email sent</Text>
              <Text style={s.successText}>
                Check your inbox at {email} for password reset instructions.
              </Text>
              <TouchableOpacity style={s.btn} onPress={() => router.replace('/auth/login')}>
                <Text style={s.btnText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
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

              <TouchableOpacity
                style={[s.btn, (!email || loading) && s.btnDisabled]}
                onPress={handleSend}
                disabled={!email || loading}
              >
                <Text style={s.btnText}>{loading ? 'Sending...' : 'Send Reset Link'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={() => router.back()} style={s.linkBtn}>
            <MaterialIcons name="arrow-back" size={16} color={C.text3} />
            <Text style={s.linkText}> Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 80, alignItems: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 24 },
  heading: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 4 },
  sub: { fontSize: 14, color: C.text3, marginBottom: 28, textAlign: 'center', maxWidth: 300 },
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
  linkBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 24 },
  linkText: { color: C.text3, fontSize: 14 },
  successBox: { alignItems: 'center', maxWidth: 320, gap: 12 },
  successTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  successText: { fontSize: 14, color: C.text3, textAlign: 'center', lineHeight: 20 },
});
