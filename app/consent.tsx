import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

const CURRENT_VERSION = '1.0';

export default function ConsentScreen() {
  const [tosAccepted, setTosAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setConsentGiven, userId } = useAuthStore();

  const allAccepted = tosAccepted && privacyAccepted && disclaimerAccepted;

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
          <Text style={styles.title}>Before we begin</Text>
          <Text style={styles.subtitle}>
            Please read and accept the following documents to continue using SpineFlow.
          </Text>
        </View>

        {/* Terms of Service */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="description" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>Terms of Service</Text>
          </View>
          <ScrollView style={styles.legalText} nestedScrollEnabled>
            <Text style={styles.legalContent}>
              By using SpineFlow, you agree to the following terms:{'\n\n'}
              1. SpineFlow is a fitness companion app for informational purposes only.{'\n'}
              2. You must be at least 16 years old to use this service.{'\n'}
              3. Your account may be terminated for violations of these terms.{'\n'}
              4. Subscription payments are handled by Apple/Google and are subject to their terms.{'\n'}
              5. SpineFlow reserves the right to update these terms with notice.{'\n'}
              6. These terms are governed by the laws of Switzerland.{'\n\n'}
              Full terms available at www.spineflow.app/terms
            </Text>
          </ScrollView>
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
            <Text style={styles.checkboxLabel}>I accept the Terms of Service</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Policy */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="privacy-tip" size={24} color="#AF52DE" />
            <Text style={styles.cardTitle}>Privacy Policy</Text>
          </View>
          <ScrollView style={styles.legalText} nestedScrollEnabled>
            <Text style={styles.legalContent}>
              SpineFlow collects and processes the following data:{'\n\n'}
              • Email address (for authentication){'\n'}
              • Scoliosis type and surgery history (for personalized safety ratings){'\n'}
              • Workout logs (for progress tracking){'\n'}
              • Nutrition logs (for calorie tracking){'\n\n'}
              Your health data is stored securely in Switzerland (Zurich) and is never shared with third parties. You can delete all your data at any time via Settings.{'\n\n'}
              SpineFlow complies with the GDPR (EU) and nDSG (Swiss Federal Data Protection Act).{'\n\n'}
              Full policy available at www.spineflow.app/privacy
            </Text>
          </ScrollView>
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
            <Text style={styles.checkboxLabel}>I accept the Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Medical Disclaimer */}
        <View style={[styles.card, styles.disclaimerCard]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="health-and-safety" size={24} color="#FF3B30" />
            <Text style={styles.cardTitle}>Medical & Liability Disclaimer</Text>
          </View>
          <ScrollView style={styles.legalText} nestedScrollEnabled>
            <Text style={styles.legalContent}>
              IMPORTANT — PLEASE READ CAREFULLY{'\n\n'}
              SpineFlow is NOT a medical device, NOT a medical application, and does NOT provide medical advice, diagnosis, or treatment.{'\n\n'}
              ALL EXERCISES ARE PERFORMED AT YOUR OWN RISK. SpineFlow accepts NO LIABILITY for any injury, damage, or harm arising from the use of this application.{'\n\n'}
              The safety ratings ("Safe", "Modify", "Avoid") are GENERAL GUIDELINES ONLY. They are not personalized medical recommendations.{'\n\n'}
              You MUST consult a qualified medical professional before beginning any exercise program, especially if you have had spinal surgery.{'\n\n'}
              If there is any conflict between SpineFlow's recommendations and your doctor's instructions, ALWAYS FOLLOW YOUR DOCTOR.{'\n\n'}
              Full disclaimer available at www.spineflow.app/disclaimer
            </Text>
          </ScrollView>
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
            <Text style={styles.checkboxLabel}>I accept the Medical & Liability Disclaimer</Text>
          </TouchableOpacity>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.button, !allAccepted && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!allAccepted || loading}
          accessibilityRole="button"
          accessibilityLabel="Continue to app setup"
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  disclaimerCard: {
    borderWidth: 1,
    borderColor: '#FFF0EF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  legalText: {
    maxHeight: 120,
    backgroundColor: '#F9F9FB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  legalContent: {
    fontSize: 12,
    color: '#3C3C43',
    lineHeight: 18,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1C1C1E',
    marginLeft: 8,
    fontWeight: '500',
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
});
