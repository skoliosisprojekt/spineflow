import { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../lib/theme';
import type { ThemeColors } from '../lib/theme';

const BRAND = '#2196F3';
const BRAND_DISABLED = '#90CAF9';

export default function LegalConsentScreen() {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setHasAcceptedBetaTerms } = useAuthStore();
  const [checked, setChecked] = useState(false);

  const handleAccept = async () => {
    if (!checked) return;
    await setHasAcceptedBetaTerms();
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <MaterialIcons name="gavel" size={22} color={BRAND} />
        <Text style={styles.headerTitle}>Beta Tester Agreement</Text>
      </View>

      {/* Scrollable legal text */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        <Text style={styles.mainTitle}>
          BETA TESTER LIABILITY WAIVER{'\n'}&amp; ARBITRATION AGREEMENT
        </Text>
        <Text style={styles.intro}>
          Please read this agreement carefully before using SpineFlow. By continuing, you confirm that you have read, understood, and agree to all terms below.
        </Text>

        {/* Section 1 */}
        <Text style={styles.sectionTitle}>
          1. Voluntary Participation &amp; Assumption of Risk
        </Text>
        <Text style={styles.sectionBody}>
          You acknowledge that you are participating in a closed Beta test of the SpineFlow app. The app is a prototype, provided{' '}
          <Text style={styles.bold}>"AS IS"</Text>, and may contain bugs or errors. Your use of the app, including any physical exercises recommended, is{' '}
          <Text style={styles.bold}>entirely at your own risk</Text>.
        </Text>

        {/* Section 2 */}
        <Text style={styles.sectionTitle}>
          2. No Medical Advice
        </Text>
        <Text style={styles.sectionBody}>
          SpineFlow is a <Text style={styles.bold}>fitness tool, not a medical device</Text>. It does not replace professional medical advice, diagnosis, or treatment.{' '}
          <Text style={styles.bold}>Always consult a physician</Text> before starting any new exercise program, especially if you have scoliosis or other spinal conditions.
        </Text>

        {/* Section 3 */}
        <Text style={styles.sectionTitle}>
          3. Limitation of Liability
        </Text>
        <Text style={styles.sectionBody}>
          To the maximum extent permitted by law, the developer shall{' '}
          <Text style={styles.bold}>not be liable</Text> for any direct, indirect, incidental, or consequential damages, including personal injury or property damage, arising from your use of the Beta app.
        </Text>

        {/* Section 4 */}
        <Text style={styles.sectionTitle}>
          4. Dispute Resolution &amp; Arbitration
        </Text>
        <Text style={styles.sectionBody}>
          Any dispute, claim, or controversy arising out of or relating to this app shall be resolved by{' '}
          <Text style={styles.bold}>binding arbitration</Text>, rather than in court. You agree to{' '}
          <Text style={styles.bold}>waive any right to participate in a class action lawsuit</Text> or class-wide arbitration.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.footerNote}>
          This agreement is governed by the laws of Switzerland. If any provision is found unenforceable, the remaining provisions remain in full effect.
        </Text>
      </ScrollView>

      {/* Checkbox + CTA */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={styles.checkRow}
          onPress={() => setChecked((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
        >
          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && (
              <MaterialIcons name="check" size={16} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.checkLabel}>
            I have read and agree to the Beta Tester Liability Waiver.
          </Text>
        </Pressable>

        <Pressable
          style={[styles.continueBtn, !checked && styles.continueBtnDisabled]}
          onPress={handleAccept}
          disabled={!checked}
          accessibilityRole="button"
          accessibilityLabel="Continue to SpineFlow"
        >
          <Text style={[styles.continueBtnText, !checked && styles.continueBtnTextDisabled]}>
            Continue
          </Text>
          <MaterialIcons
            name="arrow-forward"
            size={18}
            color={checked ? '#FFFFFF' : BRAND_DISABLED}
          />
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 20, paddingVertical: 14,
      backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.sep,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: 0.2 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 },
    mainTitle: {
      fontSize: 16, fontWeight: '800', color: C.text, textAlign: 'center',
      lineHeight: 24, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.4,
    },
    intro: { fontSize: 13, color: C.text3, lineHeight: 20, marginBottom: 20, textAlign: 'center' },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 6, marginTop: 4 },
    sectionBody: { fontSize: 13, color: C.text2, lineHeight: 21, marginBottom: 18 },
    bold: { fontWeight: '700', color: C.text },
    divider: { height: 1, backgroundColor: C.sep, marginVertical: 16 },
    footerNote: { fontSize: 11, color: C.text3, lineHeight: 17, textAlign: 'center', marginBottom: 8 },
    footer: {
      backgroundColor: C.card, paddingHorizontal: 20, paddingTop: 16,
      borderTopWidth: 1, borderTopColor: C.sep, gap: 14,
    },
    checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    checkbox: {
      width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.text4,
      backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
      marginTop: 1, flexShrink: 0,
    },
    checkboxChecked: { backgroundColor: BRAND, borderColor: BRAND },
    checkLabel: { flex: 1, fontSize: 13, color: C.text, lineHeight: 20, fontWeight: '500' },
    continueBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: BRAND, borderRadius: 14, paddingVertical: 15,
      ...Platform.select({
        ios: { shadowColor: BRAND, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },
        android: { elevation: 4 },
      }),
    },
    continueBtnDisabled: { backgroundColor: C.sep, shadowOpacity: 0, elevation: 0 },
    continueBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
    continueBtnTextDisabled: { color: BRAND_DISABLED },
  });
}
