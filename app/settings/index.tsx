import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, setAppLanguage } from '../../i18n';
import { useSettingsStore, useProfileStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { usePlanStore } from '../../stores/planStore';
import { supabase } from '../../lib/supabase';
import type { ThemeMode, WeightUnit, SurgeryType, CurveType, GoalType, ExperienceType, BodyType } from '../../types';

type OptionItem<T extends string> = { value: T; label: string };

function SegmentedPicker<T extends string>({ options, value, onChange }: { options: OptionItem<T>[]; value: T; onChange: (v: T) => void }) {
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
  return (
    <View style={styles.settingRow}>
      <MaterialIcons name={icon} size={20} color={color || '#8E8E93'} />
      <Text style={styles.settingLabel}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
    </View>
  );
}

export default function SettingsScreen() {
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

  useEffect(() => { loadSettings(); loadProfile(); }, []);

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
    generatePlan({ surgery, curveType, goal, experience, bodyType });
    setDirty(false);
    setPlanRegenerated(true);
    setTimeout(() => setPlanRegenerated(false), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = <T,>(setter: (v: T) => void, value: T) => {
    setter(value);
    setDirty(true);
  };

  const handleLanguageChange = async (langCode: string) => {
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
          <MaterialIcons name="arrow-back" size={24} color="#1C1C1E" />
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

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
          onPress={handleLogout}
          accessibilityRole="button"
        >
          <MaterialIcons name="logout" size={18} color="#FF3B30" />
          <Text style={styles.logoutBtnText}>{t('settings.logOut')}</Text>
        </Pressable>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>SpineFlow</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: '#1C1C1E' },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 4,
  },
  cardDivider: { height: 1, backgroundColor: '#F2F2F7', marginVertical: 14 },

  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 8,
  },

  // Segmented picker
  segmented: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  segmentedItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  segmentedItemActive: {
    backgroundColor: '#00B894',
  },
  segmentedText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3C3C43',
  },
  segmentedTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  settingLabel: { fontSize: 14, color: '#3C3C43', flex: 1 },
  settingValue: { fontSize: 14, fontWeight: '500', color: '#8E8E93' },

  // Buttons
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B894',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 20,
    minHeight: 52,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FF9500',
    paddingVertical: 14,
    gap: 8,
    marginTop: 12,
    minHeight: 48,
  },
  regenerateBtnText: { fontSize: 15, fontWeight: '600', color: '#FF9500' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    paddingVertical: 14,
    gap: 8,
    marginTop: 16,
    minHeight: 48,
  },
  logoutBtnText: { fontSize: 15, fontWeight: '600', color: '#FF3B30' },

  // Equipment
  equipChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  equipChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  equipChipActive: { backgroundColor: '#E8FAF5', borderWidth: 1, borderColor: '#00B89430' },
  equipChipText: { fontSize: 13, fontWeight: '600', color: '#00B894' },
  equipChipCustom: { backgroundColor: '#FFF3E0', borderWidth: 1, borderColor: '#FF950030' },
  equipChipTextCustom: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  customInputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  customInput: {
    flex: 1, backgroundColor: '#F2F2F7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#1C1C1E',
  },
  customAddBtn: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#FF9500',
    justifyContent: 'center', alignItems: 'center',
  },
  disclaimerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
  disclaimerText: { fontSize: 11, color: '#8E8E93', lineHeight: 16, flex: 1 },

  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  appName: { fontSize: 16, fontWeight: '700', color: '#AEAEB2' },
  appVersion: { fontSize: 12, color: '#C7C7CC', marginTop: 2 },
});
