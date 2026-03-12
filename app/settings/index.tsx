import { useEffect, useState, useMemo } from 'react';
import { trackEvent } from '../../lib/posthog';
import { trackAccountDeleted } from '../../lib/analytics';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { CustomModal } from '../../components/CustomModal';
import { useTheme } from '../../lib/theme';
import type { ThemeColors } from '../../lib/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPPORTED_LANGUAGES, setAppLanguage } from '../../i18n';
import { useSettingsStore, useProfileStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { usePlanStore } from '../../stores/planStore';
import { supabase } from '../../lib/supabase';
import { isSoundEnabled, setSoundEnabled } from '../../lib/sounds';
import { resetUserData } from '../../lib/resetUserData';
import { dbDeleteAllNutritionData } from '../../lib/db';
import type { ThemeMode, WeightUnit, SurgeryType, CurveType, GoalType, ExperienceType, BodyType } from '../../types';

type OptionItem<T extends string> = { value: T; label: string };

function SegmentedPicker<T extends string>({ options, value, onChange }: { options: OptionItem<T>[]; value: T; onChange: (v: T) => void }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[styles.segmentedItem, active && styles.segmentedItemActive]}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.segmentedText, active && styles.segmentedTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SettingRow({ icon, label, value, color }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value?: string; color?: string }) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  return (
    <View style={styles.settingRow}>
      <MaterialIcons name={icon} size={20} color={color || C.text3} />
      <Text style={styles.settingLabel}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
    </View>
  );
}

export default function SettingsScreen() {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { email } = useAuthStore();
  const { theme, units, setTheme, setUnits, loadSettings } = useSettingsStore();
  const {
    surgery, curveType, goal, experience, bodyType, equipment,
    setSurgery, setCurveType, setGoal, setExperience, setBodyType, setEquipment,
    saveProfile, loadProfile,
  } = useProfileStore();

  const { generatePlan } = usePlanStore();
  const [dirty, setDirty] = useState(false);
  const [planRegenerated, setPlanRegenerated] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [soundOn, setSoundOn] = useState(true);
  const [reassessing, setReassessing] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteErrorModal, setShowDeleteErrorModal] = useState(false);
  const [showReassessModal, setShowReassessModal] = useState(false);

  useEffect(() => {
    loadSettings(); loadProfile();
    isSoundEnabled().then(setSoundOn);
  }, []);

  const handleToggleSound = async () => {
    const next = !soundOn;
    setSoundOn(next);
    await setSoundEnabled(next);
  };

  const SURGERY_OPTIONS: OptionItem<SurgeryType>[] = [
    { value: 'none', label: t('settings.noSurgery') },
    { value: 'partial', label: t('settings.partialFusion') },
    { value: 'full', label: t('settings.fullFusion') },
    { value: 'vbt', label: t('settings.vbt') },
    { value: 'rods', label: t('settings.rods') },
  ];
  const CURVE_OPTIONS: OptionItem<CurveType>[] = [
    { value: 'thoracic', label: t('settings.thoracic') },
    { value: 'lumbar', label: t('settings.lumbar') },
    { value: 'thoracolumbar', label: t('settings.thoracolumbar') },
    { value: 'scurve', label: t('settings.scurve') },
    { value: 'unsure', label: t('settings.unsure') },
  ];
  const GOAL_OPTIONS: OptionItem<GoalType>[] = [
    { value: 'muscle', label: t('settings.buildMuscle') },
    { value: 'strength', label: t('settings.getStronger') },
    { value: 'posture', label: t('settings.improvePosture') },
    { value: 'pain', label: t('settings.reducePain') },
  ];
  const EXPERIENCE_OPTIONS: OptionItem<ExperienceType>[] = [
    { value: 'beginner', label: t('settings.beginner') },
    { value: 'intermediate', label: t('settings.intermediate') },
    { value: 'advanced', label: t('settings.advanced') },
  ];
  const BODY_OPTIONS: OptionItem<BodyType>[] = [
    { value: 'hardgainer', label: t('settings.hardgainer') },
    { value: 'normal', label: t('settings.normal') },
    { value: 'softgainer', label: t('settings.softgainer') },
  ];
  const THEME_OPTIONS: OptionItem<ThemeMode>[] = [
    { value: 'system', label: t('settings.system') },
    { value: 'light', label: t('settings.light') },
    { value: 'dark', label: t('settings.dark') },
  ];
  const UNIT_OPTIONS: OptionItem<WeightUnit>[] = [
    { value: 'kg', label: t('settings.kg') },
    { value: 'lbs', label: t('settings.lbs') },
  ];

  const handleSave = async () => {
    await saveProfile();
    setDirty(false);
  };

  const handleRegeneratePlan = async () => {
    await saveProfile();
    generatePlan({ surgery, curveType, goal, experience, bodyType, equipment });
    setDirty(false);
    setPlanRegenerated(true);
    setTimeout(() => setPlanRegenerated(false), 2000);
  };

  const handleLogout = async () => {
    trackEvent('logout');
    await supabase.auth.signOut();
  };

  const handleDeleteAccount = () => setShowDeleteModal(true);

  const confirmDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      trackAccountDeleted();

      // 1. Delete auth.users record via secure RPC — cascades all cloud data
      const { error } = await supabase.rpc('delete_user_account');
      if (error) throw error;

      // 2. Wipe local SQLite nutrition data
      try { await dbDeleteAllNutritionData(); } catch { /* ignore if DB not ready */ }

      // 3. Wipe all AsyncStorage
      await AsyncStorage.clear();

      // 4. Clear all Zustand stores
      resetUserData();

      // 5. Sign out (clears Supabase session tokens) and navigate to welcome
      await supabase.auth.signOut();
      router.replace('/welcome');
    } catch {
      setDeletingAccount(false);
      setShowDeleteModal(false);
      setShowDeleteErrorModal(true);
    }
  };

  const handleReassess = () => setShowReassessModal(true);

  const confirmReassess = async () => {
    setShowReassessModal(false);
    setReassessing(true);
    await saveProfile();
    setTimeout(() => {
      setReassessing(false);
      router.replace('/(tabs)/exercises' as any);
    }, 600);
  };

  const updateProfile = <T,>(setter: (v: T) => void, value: T) => {
    setter(value);
    setDirty(true);
  };

  const handleLanguageChange = async (langCode: string) => {
    trackEvent('language_changed', { language: langCode });
    await setAppLanguage(langCode);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Account */}
        <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
        <View style={styles.card}>
          <SettingRow icon="email" label={t('settings.email')} value={email || '—'} color="#5B8DEF" />
        </View>

        {/* Appearance */}
        <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t('settings.theme')}</Text>
          <SegmentedPicker options={THEME_OPTIONS} value={theme} onChange={(v) => setTheme(v)} />

          <View style={styles.cardDivider} />

          <Text style={styles.fieldLabel}>{t('settings.weightUnit')}</Text>
          <SegmentedPicker options={UNIT_OPTIONS} value={units} onChange={(v) => setUnits(v)} />

          <View style={styles.cardDivider} />

          <Text style={styles.fieldLabel}>{t('settings.language')}</Text>
          <View style={styles.segmented}>
            {SUPPORTED_LANGUAGES.map((lang) => {
              const active = i18n.language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  style={[styles.segmentedItem, active && styles.segmentedItemActive]}
                  onPress={() => handleLanguageChange(lang.code)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.segmentedText, active && styles.segmentedTextActive]}>{lang.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.cardDivider} />

          <Pressable style={styles.settingRow} onPress={handleToggleSound} accessibilityRole="switch" accessibilityState={{ checked: soundOn }}>
            <MaterialIcons name={soundOn ? 'vibration' : 'phonelink-erase'} size={20} color={soundOn ? '#00B894' : '#AEAEB2'} />
            <Text style={styles.settingLabel}>{t('settings.timerSound')}</Text>
            <View style={[styles.toggleTrack, soundOn && styles.toggleTrackOn]}>
              <View style={[styles.toggleThumb, soundOn && styles.toggleThumbOn]} />
            </View>
          </Pressable>
        </View>

        {/* Scoliosis Profile */}
        <Text style={styles.sectionTitle}>{t('settings.scoliosisProfile')}</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t('settings.surgeryHistory')}</Text>
          <SegmentedPicker options={SURGERY_OPTIONS} value={surgery} onChange={(v) => updateProfile(setSurgery, v)} />

          <View style={styles.cardDivider} />

          <Text style={styles.fieldLabel}>{t('settings.curveType')}</Text>
          <SegmentedPicker options={CURVE_OPTIONS} value={curveType} onChange={(v) => updateProfile(setCurveType, v)} />

          <View style={styles.cardDivider} />

          <Text style={styles.fieldLabel}>{t('settings.mainGoal')}</Text>
          <SegmentedPicker options={GOAL_OPTIONS} value={goal} onChange={(v) => updateProfile(setGoal, v)} />
        </View>

        {/* Training Profile */}
        <Text style={styles.sectionTitle}>{t('settings.trainingProfile')}</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t('settings.experienceLevel')}</Text>
          <SegmentedPicker options={EXPERIENCE_OPTIONS} value={experience} onChange={(v) => updateProfile(setExperience, v)} />

          <View style={styles.cardDivider} />

          <Text style={styles.fieldLabel}>{t('settings.bodyType')}</Text>
          <SegmentedPicker options={BODY_OPTIONS} value={bodyType} onChange={(v) => updateProfile(setBodyType, v)} />
        </View>

        {/* Equipment */}
        <Text style={styles.sectionTitle}>{t('settings.equipment')}</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t('onboarding.yourEquipment')}</Text>
          <View style={styles.equipChips}>
            {equipment.filter((e) => !e.startsWith('custom:')).map((eq) => {
              const labelKey = `onboarding.equipment.${eq}`;
              return (
                <Pressable
                  key={eq}
                  style={[styles.equipChip, styles.equipChipActive]}
                  onPress={() => { setEquipment(equipment.filter((e) => e !== eq)); setDirty(true); }}
                  accessibilityRole="button"
                >
                  <Text style={styles.equipChipText}>{t(labelKey)}</Text>
                  <MaterialIcons name="close" size={12} color="#00B894" />
                </Pressable>
              );
            })}
            {equipment.filter((e) => e.startsWith('custom:')).map((eq) => (
              <Pressable
                key={eq}
                style={[styles.equipChip, styles.equipChipCustom]}
                onPress={() => { setEquipment(equipment.filter((e) => e !== eq)); setDirty(true); }}
                accessibilityRole="button"
              >
                <MaterialIcons name="build" size={12} color="#FF9500" />
                <Text style={styles.equipChipTextCustom}>{eq.replace('custom:', '')}</Text>
                <MaterialIcons name="close" size={12} color="#FF9500" />
              </Pressable>
            ))}
          </View>

          <View style={styles.cardDivider} />

          <Text style={styles.fieldLabel}>{t('onboarding.customEquipment')}</Text>
          <View style={styles.customInputRow}>
            <TextInput
              style={styles.customInput}
              placeholder={t('onboarding.customEquipmentPlaceholder')}
              placeholderTextColor="#AEAEB2"
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={() => {
                const name = customInput.trim();
                if (!name) return;
                const key = `custom:${name}`;
                if (!equipment.includes(key)) { setEquipment([...equipment, key]); setDirty(true); }
                setCustomInput('');
              }}
              returnKeyType="done"
            />
            <Pressable
              style={({ pressed }) => [styles.customAddBtn, pressed && { opacity: 0.7 }, !customInput.trim() && { opacity: 0.4 }]}
              onPress={() => {
                const name = customInput.trim();
                if (!name) return;
                const key = `custom:${name}`;
                if (!equipment.includes(key)) { setEquipment([...equipment, key]); setDirty(true); }
                setCustomInput('');
              }}
              disabled={!customInput.trim()}
              accessibilityRole="button"
            >
              <MaterialIcons name="add" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={styles.disclaimerRow}>
            <MaterialIcons name="warning" size={14} color="#FF9500" />
            <Text style={styles.disclaimerText}>{t('onboarding.customDisclaimer')}</Text>
          </View>
        </View>

        {/* Save / Regenerate */}
        {dirty && (
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSave}
            accessibilityRole="button"
          >
            <MaterialIcons name="save" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>{t('settings.saveChanges')}</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [styles.regenerateBtn, pressed && { opacity: 0.85 }]}
          onPress={handleRegeneratePlan}
          accessibilityRole="button"
        >
          <MaterialIcons name="auto-awesome" size={18} color={planRegenerated ? '#00B894' : '#FF9500'} />
          <Text style={[styles.regenerateBtnText, planRegenerated && { color: '#00B894' }]}>
            {planRegenerated ? t('settings.planUpdated') : t('settings.regeneratePlan')}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.reassessBtn, pressed && { opacity: 0.85 }]}
          onPress={handleReassess}
          disabled={reassessing}
          accessibilityRole="button"
        >
          {reassessing ? (
            <ActivityIndicator size="small" color="#5B8DEF" />
          ) : (
            <MaterialIcons name="refresh" size={18} color="#5B8DEF" />
          )}
          <Text style={styles.reassessBtnText}>{t('settings.reassessExercises')}</Text>
        </Pressable>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
          onPress={handleLogout}
          accessibilityRole="button"
        >
          <MaterialIcons name="logout" size={18} color="#FF3B30" />
          <Text style={styles.logoutBtnText}>{t('settings.logOut')}</Text>
        </Pressable>

        {/* Delete Account */}
        <Pressable
          style={({ pressed }) => [styles.deleteAccountBtn, pressed && { opacity: 0.75 }, deletingAccount && { opacity: 0.6 }]}
          onPress={handleDeleteAccount}
          disabled={deletingAccount}
          accessibilityRole="button"
          accessibilityLabel={t('settings.deleteAccount')}
        >
          {deletingAccount ? (
            <ActivityIndicator size="small" color="#FF3B30" />
          ) : (
            <MaterialIcons name="delete-forever" size={18} color="#FF3B30" />
          )}
          <Text style={styles.deleteAccountBtnText}>
            {deletingAccount ? t('settings.deleteAccountDeleting') : t('settings.deleteAccount')}
          </Text>
        </Pressable>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>SpineFlow</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Delete Account — single-tap, no double-dialog */}
      <CustomModal
        visible={showDeleteModal}
        onClose={() => !deletingAccount && setShowDeleteModal(false)}
        title={t('settings.deleteAccountTitle')}
        description={t('settings.deleteAccountWarning')}
        primaryLabel={t('settings.deleteAccountConfirm')}
        onPrimary={confirmDeleteAccount}
        cancelLabel={t('common.cancel')}
        variant="danger"
        icon="delete-forever"
        loading={deletingAccount}
      />

      {/* Delete Account Error */}
      <CustomModal
        visible={showDeleteErrorModal}
        onClose={() => setShowDeleteErrorModal(false)}
        title={t('settings.deleteAccountTitle')}
        description={t('settings.deleteAccountError')}
        primaryLabel={t('common.ok') ?? 'OK'}
        onPrimary={() => setShowDeleteErrorModal(false)}
        cancelLabel={t('common.cancel')}
        variant="warning"
        icon="error-outline"
      />

      {/* Reassess Exercises */}
      <CustomModal
        visible={showReassessModal}
        onClose={() => setShowReassessModal(false)}
        title={t('settings.reassessTitle')}
        description={t('settings.reassessConfirm')}
        primaryLabel={t('common.continue')}
        onPrimary={confirmReassess}
        cancelLabel={t('common.cancel')}
        variant="warning"
        icon="refresh"
      />
    </KeyboardAvoidingView>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12,
    },
    backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: '700', color: C.text },

    scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },

    sectionTitle: {
      fontSize: 13, fontWeight: '600', color: C.text3, textTransform: 'uppercase',
      marginTop: 20, marginBottom: 8, paddingHorizontal: 4,
    },

    card: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 4 },
    cardDivider: { height: 1, backgroundColor: C.bg, marginVertical: 14 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: C.text2, marginBottom: 8 },

    segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    segmentedItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: C.bg },
    segmentedItemActive: { backgroundColor: C.accent },
    segmentedText: { fontSize: 13, fontWeight: '500', color: C.text2 },
    segmentedTextActive: { color: '#FFFFFF', fontWeight: '600' },

    settingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
    settingLabel: { fontSize: 14, color: C.text2, flex: 1 },
    settingValue: { fontSize: 14, fontWeight: '500', color: C.text3 },

    saveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16,
      gap: 8, marginTop: 20, minHeight: 52,
    },
    saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

    regenerateBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.orange,
      paddingVertical: 14, gap: 8, marginTop: 12, minHeight: 48,
    },
    regenerateBtnText: { fontSize: 15, fontWeight: '600', color: C.orange },

    logoutBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.red,
      paddingVertical: 14, gap: 8, marginTop: 16, minHeight: 48,
    },
    logoutBtnText: { fontSize: 15, fontWeight: '600', color: C.red },

    deleteAccountBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.redLight, borderRadius: 14, borderWidth: 1.5, borderColor: C.red,
      paddingVertical: 14, gap: 8, marginTop: 10, minHeight: 48,
    },
    deleteAccountBtnText: { fontSize: 15, fontWeight: '700', color: C.red },

    reassessBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: C.card, borderRadius: 14, borderWidth: 1.5, borderColor: C.blue,
      paddingVertical: 14, gap: 8, marginTop: 12, minHeight: 48,
    },
    reassessBtnText: { fontSize: 15, fontWeight: '600', color: C.blue },

    equipChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    equipChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
    equipChipActive: { backgroundColor: C.accentLight, borderWidth: 1, borderColor: C.accent + '30' },
    equipChipText: { fontSize: 13, fontWeight: '600', color: C.accent },
    equipChipCustom: { backgroundColor: C.orangeLight, borderWidth: 1, borderColor: C.orange + '30' },
    equipChipTextCustom: { fontSize: 13, fontWeight: '600', color: C.text },
    customInputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    customInput: { flex: 1, backgroundColor: C.bg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: C.text },
    customAddBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.orange, justifyContent: 'center', alignItems: 'center' },
    disclaimerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
    disclaimerText: { fontSize: 11, color: C.text3, lineHeight: 16, flex: 1 },

    toggleTrack: { width: 44, height: 26, borderRadius: 13, backgroundColor: C.sep, justifyContent: 'center', paddingHorizontal: 2 },
    toggleTrackOn: { backgroundColor: C.accent },
    toggleThumb: {
      width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
    },
    toggleThumbOn: { alignSelf: 'flex-end' as const },

    appInfo: { alignItems: 'center', marginTop: 32, marginBottom: 16 },
    appName: { fontSize: 16, fontWeight: '700', color: C.text4 },
    appVersion: { fontSize: 12, color: C.text4, marginTop: 2 },
  });
}
