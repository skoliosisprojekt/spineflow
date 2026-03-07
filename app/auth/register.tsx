import { useState } from 'react';
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

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string; age?: string; form?: string }>({});
  const { t } = useTranslation();

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.emailInvalid');
    }

    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (password.length < 8) {
      newErrors.password = t('auth.passwordTooShort');
    }

    if (password !== confirmPassword) {
      newErrors.confirm = t('auth.passwordsNoMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    const valid = validate();
    if (!ageConfirmed) {
      setErrors((prev) => ({ ...prev, age: t('auth.ageRequired') }));
    }
    if (!valid || !ageConfirmed) return;

    setLoading(true);
    setErrors({});
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setErrors({ form: error.message });
      } else if (data.user) {
        // Auth state change will trigger navigation automatically
      }
    } catch (e) {
      setErrors({ form: t('common.somethingWrong') });
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
          <Text style={styles.title}>{t('auth.createAccount')}</Text>

          {/* Email */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.emailPlaceholder')}
              placeholderTextColor="#AEAEB2"
              value={email}
              onChangeText={(v) => { setEmail(v); setErrors({ ...errors, email: undefined }); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Password */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={t('auth.passwordMin')}
              placeholderTextColor="#AEAEB2"
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors({ ...errors, password: undefined }); }}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.confirmPassword')}
              placeholderTextColor="#AEAEB2"
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setErrors({ ...errors, confirm: undefined }); }}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
            />
          </View>
          {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}

          {/* Age Confirmation */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => { setAgeConfirmed(!ageConfirmed); setErrors((prev) => ({ ...prev, age: undefined })); }}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: ageConfirmed }}
            accessibilityLabel="I confirm I am at least 16 years old"
          >
            <MaterialIcons
              name={ageConfirmed ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={ageConfirmed ? '#00B894' : '#8E8E93'}
            />
            <Text style={styles.checkboxLabel}>{t('auth.ageConfirm')}</Text>
          </TouchableOpacity>
          {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}

          {/* Form Error */}
          {errors.form && (
            <View style={styles.formError}>
              <MaterialIcons name="error-outline" size={18} color="#FF3B30" />
              <Text style={styles.formErrorText}>{errors.form}</Text>
            </View>
          )}

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Create account"
          >
            {loading ? (
              <Text style={styles.buttonText}>{t('auth.creatingAccount')}</Text>
            ) : (
              <Text style={styles.buttonText}>{t('auth.createAccount')}</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => router.push('/auth/login' as any)}
            accessibilityRole="link"
            accessibilityLabel="Go to login screen"
          >
            <Text style={styles.linkText}>
              {t('auth.alreadyHaveAccount')} <Text style={styles.linkBold}>{t('auth.logIn')}</Text>
            </Text>
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
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    minHeight: 48,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#3C3C43',
    marginLeft: 8,
    flex: 1,
  },
  button: {
    backgroundColor: '#00B894',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  buttonDisabled: {
    backgroundColor: '#AEAEB2',
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
    color: '#8E8E93',
  },
  linkBold: {
    color: '#00B894',
    fontWeight: '600',
  },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0EF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  formErrorText: {
    flex: 1,
    color: '#FF3B30',
    fontSize: 13,
    lineHeight: 18,
  },
});
