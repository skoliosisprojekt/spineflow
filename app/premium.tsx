import { useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../lib/theme';
import type { ThemeColors } from '../lib/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { usePremiumStore } from '../stores/premiumStore';
import { Crown } from '../components/animations';
import { trackPaywallViewed } from '../lib/analytics';

const FEATURES = [
  { icon: 'auto-awesome' as const, key: 'premium.featureAI' },
  { icon: 'insights' as const, key: 'premium.featureInsights' },
  { icon: 'tune' as const, key: 'premium.featureAdjustments' },
  { icon: 'history' as const, key: 'premium.featureHistory' },
];

export default function PremiumScreen() {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();
  const { t } = useTranslation();
  const { isPremium, isBetaTester, setPremium } = usePremiumStore();

  useEffect(() => {
    // Don't count beta tester views as paywall impressions
    if (!isBetaTester) trackPaywallViewed();
  }, [isBetaTester]);

  const handleUnlock = async () => {
    await setPremium(true);
    if (router.canGoBack()) router.back();
  };

  const handleRestore = async () => {
    // Placeholder — connect to real IAP restore logic later
    await setPremium(true);
    if (router.canGoBack()) router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <MaterialIcons name="close" size={24} color={C.text} />
        </Pressable>
      </View>

      {isBetaTester ? (
        /* ── Beta tester view — no paywall ─────────────────────────────────── */
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.betaIconRing}>
            <MaterialIcons name="science" size={48} color="#2196F3" />
          </View>
          <Text style={styles.betaTitle}>{t('premium.betaTitle')}</Text>
          <Text style={styles.betaMessage}>{t('premium.betaMessage')}</Text>

          {/* Feature list so they know what they have */}
          <View style={styles.featureList}>
            {FEATURES.map((f) => (
              <View key={f.key} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
                  <MaterialIcons name={f.icon} size={20} color="#2196F3" />
                </View>
                <Text style={styles.featureText}>{t(f.key)}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.betaBackBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            accessibilityRole="button"
          >
            <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
            <Text style={styles.betaBackBtnText}>{t('premium.betaBack')}</Text>
          </Pressable>
        </ScrollView>
      ) : (
        /* ── Normal paywall view ────────────────────────────────────────────── */
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <Crown size={50} />
          <View style={styles.iconRing}>
            <MaterialIcons name="workspace-premium" size={48} color="#FF9500" />
          </View>
          <Text style={styles.title}>{t('premium.title')}</Text>
          <Text style={styles.subtitle}>{t('premium.subtitle')}</Text>

          {/* Features */}
          <View style={styles.featureList}>
            {FEATURES.map((f) => (
              <View key={f.key} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <MaterialIcons name={f.icon} size={20} color="#FF9500" />
                </View>
                <Text style={styles.featureText}>{t(f.key)}</Text>
              </View>
            ))}
          </View>

          {isPremium ? (
            <View style={styles.activeContainer}>
              <MaterialIcons name="check-circle" size={24} color="#00B894" />
              <Text style={styles.activeText}>{t('premium.alreadyActive')}</Text>
            </View>
          ) : (
            <>
              {/* Unlock Button */}
              <Pressable
                style={({ pressed }) => [styles.unlockBtn, pressed && { opacity: 0.85 }]}
                onPress={handleUnlock}
                accessibilityRole="button"
                accessibilityLabel={t('premium.unlock')}
              >
                <MaterialIcons name="workspace-premium" size={20} color="#FFFFFF" />
                <Text style={styles.unlockBtnText}>{t('premium.unlock')}</Text>
              </Pressable>

              {/* Restore */}
              <Pressable
                style={({ pressed }) => [styles.restoreBtn, pressed && { opacity: 0.7 }]}
                onPress={handleRestore}
                accessibilityRole="button"
              >
                <Text style={styles.restoreBtnText}>{t('premium.restore')}</Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 54, paddingHorizontal: 16, paddingBottom: 8 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 60 },
    iconRing: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.orangeLight, justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 16 },
    title: { fontSize: 24, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 15, color: C.text3, textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 16 },
    featureList: { width: '100%', backgroundColor: C.card, borderRadius: 16, padding: 16, gap: 14, marginBottom: 32 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    featureIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.orangeLight, justifyContent: 'center', alignItems: 'center' },
    featureText: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text, lineHeight: 20 },
    unlockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.orange, borderRadius: 14, paddingVertical: 16, width: '100%', minHeight: 52, marginBottom: 12 },
    unlockBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    restoreBtn: { paddingVertical: 12 },
    restoreBtnText: { fontSize: 13, fontWeight: '600', color: C.text3 },
    activeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accentLight, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14, width: '100%', justifyContent: 'center' },
    activeText: { fontSize: 15, fontWeight: '700', color: C.accent },
    betaIconRing: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.blue + '22', justifyContent: 'center', alignItems: 'center', marginTop: 24, marginBottom: 16 },
    betaTitle: { fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 12 },
    betaMessage: { fontSize: 15, color: C.text3, textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 8 },
    betaBackBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.blue, borderRadius: 14, paddingVertical: 16, width: '100%', minHeight: 52, marginTop: 8 },
    betaBackBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  });
}
