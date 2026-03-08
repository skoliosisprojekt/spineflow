import { useState } from 'react';
import { trackEvent } from '../../lib/posthog';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError(t('auth.enterEmailPassword'));
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError(authError.message);
        trackEvent('login_failed', { reason: authError.message });
      } else {
        trackEvent('login_success');
      }
    } catch (e) {
      setError(t('common.somethingWrong'));
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <MaterialIcons name="fitness-center" size={48} color="#00B894" />
          <Text style={styles.logoText}>SpineFlow</Text>
          <Text style={styles.subtitle}>{t('auth.tagline')}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.title}>{t('auth.welcomeBack')}</Text>

          {/* Error Banner */}
          {error !== '' && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={18} color="#FF3B30" />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Email */}
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

          {/* Password */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={t('auth.passwordPlaceholder')}
              placeholderTextColor="#AEAEB2"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="current-password"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotContainer}
            onPress={() => router.push('/auth/forgot-password' as any)}
            accessibilityRole="link"
            accessibilityLabel="Reset your password"
          >
            <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Log in"
          >
            <Text style={styles.buttonText}>{loading ? t('auth.loggingIn') : t('auth.logIn')}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('common.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/auth/register' as any)}
            accessibilityRole="button"
            accessibilityLabel="Create a new account"
          >
            <Text style={styles.registerButtonText}>{t('auth.createNewAccount')}</Text>
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
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
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
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
  eyeIcon: {
    padding: 8,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
    minHeight: 48,
    justifyContent: 'center',
  },
  forgotText: {
    fontSize: 14,
    color: '#00B894',
    fontWeight: '500',
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0EF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorBannerText: {
    flex: 1,
    color: '#FF3B30',
    fontSize: 13,
    lineHeight: 18,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#8E8E93',
  },
  registerButton: {
    borderWidth: 2,
    borderColor: '#00B894',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
  },
  registerButtonText: {
    color: '#00B894',
    fontSize: 16,
    fontWeight: '600',
  },
});
