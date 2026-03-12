import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../lib/theme';
import type { ThemeColors } from '../lib/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

const CURRENT_VERSION = '1.0';

export default function ConsentScreen() {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [ageAccepted, setAgeAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setConsentGiven, userId } = useAuthStore();
  const { t } = useTranslation();

  const allAccepted = tosAccepted && privacyAccepted && disclaimerAccepted && ageAccepted;

  const handleContinue = async () => {
    if (!allAccepted) return;
    setLoading(true);

    try {
      // Store consent in Supabase
      if (userId) {
        const now = new Date().toISOString();
        await supabase.from('consent_records').insert({
          user_id: userId,
          tos_version: CURRENT_VERSION,
          tos_accepted_at: now,
          privacy_version: CURRENT_VERSION,
          privacy_accepted_at: now,
          disclaimer_version: CURRENT_VERSION,
          disclaimer_accepted_at: now,
          locale: 'en',
          app_version: '1.0.0',
        });
      }

      // Store locally
      await setConsentGiven(true);
    } catch (e) {
      // Even if Supabase fails, store locally so user can proceed
      await setConsentGiven(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialIcons name="verified-user" size={48} color="#00B894" />
          <Text style={styles.title}>{t('consent.title')}</Text>
          <Text style={styles.subtitle}>
            {t('consent.subtitle')}
          </Text>
        </View>

        {/* Terms of Service */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="description" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>{t('consent.tosTitle')}</Text>
          </View>
          <View style={styles.legalText}>
            <Text style={styles.legalContent}>
              {t('consent.tosContent')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setTosAccepted(!tosAccepted)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: tosAccepted }}
            accessibilityLabel="Accept Terms of Service"
          >
            <MaterialIcons
              name={tosAccepted ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={tosAccepted ? '#00B894' : '#8E8E93'}
            />
            <Text style={styles.checkboxLabel}>{t('consent.tosAccept')}</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Policy */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="privacy-tip" size={24} color="#AF52DE" />
            <Text style={styles.cardTitle}>{t('consent.privacyTitle')}</Text>
          </View>
          <View style={styles.legalText}>
            <Text style={styles.legalContent}>
              {t('consent.privacyContent')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setPrivacyAccepted(!privacyAccepted)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: privacyAccepted }}
            accessibilityLabel="Accept Privacy Policy"
          >
            <MaterialIcons
              name={privacyAccepted ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={privacyAccepted ? '#00B894' : '#8E8E93'}
            />
            <Text style={styles.checkboxLabel}>{t('consent.privacyAccept')}</Text>
          </TouchableOpacity>
        </View>

        {/* Medical Disclaimer */}
        <View style={[styles.card, styles.disclaimerCard]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="health-and-safety" size={24} color="#FF3B30" />
            <Text style={styles.cardTitle}>{t('consent.disclaimerTitle')}</Text>
          </View>
          <View style={styles.legalText}>
            <Text style={styles.legalContent}>
              {t('consent.disclaimerContent')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setDisclaimerAccepted(!disclaimerAccepted)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: disclaimerAccepted }}
            accessibilityLabel="Accept Medical and Liability Disclaimer"
          >
            <MaterialIcons
              name={disclaimerAccepted ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={disclaimerAccepted ? '#00B894' : '#8E8E93'}
            />
            <Text style={styles.checkboxLabel}>{t('consent.disclaimerAccept')}</Text>
          </TouchableOpacity>
        </View>

        {/* Age Confirmation */}
        <TouchableOpacity
          style={styles.ageCheckboxRow}
          onPress={() => setAgeAccepted(!ageAccepted)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: ageAccepted }}
          accessibilityLabel="I confirm I am at least 18 years old"
        >
          <MaterialIcons
            name={ageAccepted ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color={ageAccepted ? '#00B894' : '#8E8E93'}
          />
          <Text style={styles.ageCheckboxLabel}>{t('consent.ageConfirmLabel')}</Text>
        </TouchableOpacity>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.button, !allAccepted && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!allAccepted || loading}
          accessibilityRole="button"
          accessibilityLabel="Continue to app setup"
        >
          <Text style={styles.buttonText}>
            {loading ? t('consent.saving') : t('consent.continue')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 26, fontWeight: '700', color: C.text, marginTop: 12 },
    subtitle: { fontSize: 14, color: C.text3, textAlign: 'center', marginTop: 8, lineHeight: 20 },
    card: {
      backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
    },
    disclaimerCard: { borderWidth: 1, borderColor: C.redLight },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: C.text, marginLeft: 8 },
    legalText: { backgroundColor: C.sepLight, borderRadius: 8, padding: 12, marginBottom: 12 },
    legalContent: { fontSize: 12, color: C.text2, lineHeight: 18 },
    checkboxRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
    checkboxLabel: { fontSize: 14, color: C.text, marginLeft: 8, fontWeight: '500' },
    button: { backgroundColor: C.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, minHeight: 48 },
    buttonDisabled: { backgroundColor: C.text4 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    ageCheckboxRow: {
      flexDirection: 'row', alignItems: 'center', minHeight: 52,
      backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
      marginBottom: 16, borderWidth: 2, borderColor: C.accent,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
    },
    ageCheckboxLabel: { fontSize: 14, color: C.text, marginLeft: 10, fontWeight: '600', flex: 1 },
  });
}
