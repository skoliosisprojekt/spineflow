import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { t } = useTranslation();

  const handleReset = async () => {
    if (!email.trim()) {
      Alert.alert(t('auth.missingEmail'), t('auth.enterEmail'));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) {
        Alert.alert(t('common.error'), error.message);
      } else {
        setSent(true);
      }
    } catch (e) {
      Alert.alert(t('common.error'), t('common.somethingWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back to login"
        >
          <MaterialIcons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>

        <View style={styles.form}>
          <MaterialIcons name="lock-reset" size={48} color="#00B894" style={styles.icon} />
          <Text style={styles.title}>{t('auth.resetPassword')}</Text>

          {sent ? (
            <>
              <View style={styles.successBox}>
                <MaterialIcons name="check-circle" size={24} color="#00B894" />
                <Text style={styles.successText}>
                  {t('auth.resetSent')}
                </Text>
              </View>
              <TouchableOpacity style={styles.button} onPress={() => router.replace('/auth/login')}>
                <Text style={styles.buttonText}>{t('auth.backToLogin')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.description}>
                {t('auth.resetDescription')}
              </Text>

              <View style={styles.inputContainer}>
                <MaterialIcons name="email" size={20} color="#8E8E93" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor="#AEAEB2"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleReset}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? t('auth.sending') : t('auth.sendResetLink')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkContainer}
                onPress={() => router.back()}
              >
                <Text style={styles.linkText}>{t('auth.backToLogin')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
    paddingVertical: 12,
  },
  button: {
    backgroundColor: '#00B894',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 20,
    minHeight: 48,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#00B894',
    fontWeight: '500',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FAF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  successText: {
    fontSize: 14,
    color: '#009B7D',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
