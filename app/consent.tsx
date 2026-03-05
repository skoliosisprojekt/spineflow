import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useProfileStore } from '../stores/profileStore';

const C = {
  bg: '#F2F2F7',
  card: '#FFFFFF',
  accent: '#00B894',
  text: '#1C1C1E',
  text2: '#3C3C43',
  text3: '#8E8E93',
  sep: '#E5E5EA',
};

export default function ConsentScreen() {
  const router = useRouter();
  const setConsentAccepted = useProfileStore((s) => s.setConsentAccepted);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const allAccepted = tosAccepted && privacyAccepted && disclaimerAccepted;

  const handleContinue = () => {
    if (!allAccepted) return;
    setConsentAccepted();
    router.replace('/onboarding/surgery');
  };

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <MaterialIcons name="verified-user" size={48} color={C.accent} />
          <Text style={s.title}>Before we begin</Text>
          <Text style={s.subtitle}>Please review and accept the following to continue.</Text>
        </View>

        {/* Terms of Service */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Terms of Service</Text>
          <View style={s.legalBox}>
            <ScrollView style={s.legalScroll} nestedScrollEnabled>
              <Text style={s.legalText}>
                By using SpineFlow, you agree to the following terms:{'\n\n'}
                1. SpineFlow provides exercise guidance for people with scoliosis. You are responsible for your own safety while exercising.{'\n\n'}
                2. We do not guarantee specific fitness results. Individual outcomes vary based on many factors.{'\n\n'}
                3. Your account may be suspended if you violate these terms or misuse the service.{'\n\n'}
                4. SpineFlow reserves the right to modify these terms. Continued use constitutes acceptance.{'\n\n'}
                5. You must be at least 16 years old to use this service.
              </Text>
            </ScrollView>
          </View>
          <TouchableOpacity style={s.checkRow} onPress={() => setTosAccepted(!tosAccepted)}>
            <MaterialIcons
              name={tosAccepted ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={tosAccepted ? C.accent : C.text3}
            />
            <Text style={s.checkText}>I accept the Terms of Service</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Policy */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Privacy Policy</Text>
          <View style={s.legalBox}>
            <ScrollView style={s.legalScroll} nestedScrollEnabled>
              <Text style={s.legalText}>
                Your privacy is important to us:{'\n\n'}
                1. We collect your email, profile data (scoliosis type, surgery history), and workout data to personalize your experience.{'\n\n'}
                2. Your health information is encrypted and stored securely on our servers.{'\n\n'}
                3. We never sell your personal data to third parties.{'\n\n'}
                4. You can request deletion of all your data at any time through the app settings.{'\n\n'}
                5. We use anonymized, aggregated data to improve our exercise recommendations.
              </Text>
            </ScrollView>
          </View>
          <TouchableOpacity style={s.checkRow} onPress={() => setPrivacyAccepted(!privacyAccepted)}>
            <MaterialIcons
              name={privacyAccepted ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={privacyAccepted ? C.accent : C.text3}
            />
            <Text style={s.checkText}>I accept the Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        {/* Medical Disclaimer */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Medical Disclaimer</Text>
          <View style={s.legalBox}>
            <ScrollView style={s.legalScroll} nestedScrollEnabled>
              <Text style={s.legalText}>
                Important medical information:{'\n\n'}
                1. SpineFlow is NOT a medical device and does NOT provide medical advice.{'\n\n'}
                2. Always consult your doctor, orthopedic surgeon, or physical therapist before starting any exercise program.{'\n\n'}
                3. Stop exercising immediately if you experience pain, numbness, or discomfort.{'\n\n'}
                4. Exercise safety ratings are general guidelines. Your specific condition may require different precautions.{'\n\n'}
                5. SpineFlow and its creators assume no liability for injuries sustained while following exercise recommendations.
              </Text>
            </ScrollView>
          </View>
          <TouchableOpacity style={s.checkRow} onPress={() => setDisclaimerAccepted(!disclaimerAccepted)}>
            <MaterialIcons
              name={disclaimerAccepted ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={disclaimerAccepted ? C.accent : C.text3}
            />
            <Text style={s.checkText}>I accept the Medical Disclaimer</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[s.btn, !allAccepted && s.btnDisabled]}
          onPress={handleContinue}
          disabled={!allAccepted}
        >
          <Text style={s.btnText}>Continue</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '700', color: C.text, marginTop: 12 },
  subtitle: { fontSize: 14, color: C.text3, marginTop: 4, textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: C.text, marginBottom: 8 },
  legalBox: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.sep,
    padding: 14,
    maxHeight: 140,
  },
  legalScroll: { flex: 1 },
  legalText: { fontSize: 13, color: C.text2, lineHeight: 20 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  checkText: { fontSize: 15, color: C.text, flex: 1, fontWeight: '500' },
  btn: {
    backgroundColor: C.accent,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 40,
  },
  btnDisabled: { backgroundColor: C.sep },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
