import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSettingsStore, useProfileStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { usePlanStore } from '../../stores/planStore';
import { supabase } from '../../lib/supabase';
import type { ThemeMode, WeightUnit, SurgeryType, CurveType, GoalType, ExperienceType, BodyType } from '../../types';

type OptionItem<T extends string> = { value: T; label: string };

const SURGERY_OPTIONS: OptionItem<SurgeryType>[] = [
  { value: 'none', label: 'No Surgery' },
  { value: 'partial', label: 'Partial Fusion' },
  { value: 'full', label: 'Full Fusion' },
  { value: 'vbt', label: 'VBT' },
  { value: 'rods', label: 'Rods' },
];

const CURVE_OPTIONS: OptionItem<CurveType>[] = [
  { value: 'thoracic', label: 'Thoracic' },
  { value: 'lumbar', label: 'Lumbar' },
  { value: 'thoracolumbar', label: 'Thoracolumbar' },
  { value: 'scurve', label: 'S-Curve' },
  { value: 'unsure', label: 'Unsure' },
];

const GOAL_OPTIONS: OptionItem<GoalType>[] = [
  { value: 'muscle', label: 'Build Muscle' },
  { value: 'strength', label: 'Get Stronger' },
  { value: 'posture', label: 'Improve Posture' },
  { value: 'pain', label: 'Reduce Pain' },
];

const EXPERIENCE_OPTIONS: OptionItem<ExperienceType>[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const BODY_OPTIONS: OptionItem<BodyType>[] = [
  { value: 'hardgainer', label: 'Hardgainer' },
  { value: 'normal', label: 'Normal' },
  { value: 'softgainer', label: 'Softgainer' },
];

const THEME_OPTIONS: OptionItem<ThemeMode>[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const UNIT_OPTIONS: OptionItem<WeightUnit>[] = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'lbs', label: 'Pounds (lbs)' },
];

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
  const { email } = useAuthStore();
  const { theme, units, setTheme, setUnits, loadSettings } = useSettingsStore();
  const {
    surgery, curveType, goal, experience, bodyType,
    setSurgery, setCurveType, setGoal, setExperience, setBodyType,
    saveProfile, loadProfile,
  } = useProfileStore();

  const { generatePlan } = usePlanStore();
  const [dirty, setDirty] = useState(false);
  const [planRegenerated, setPlanRegenerated] = useState(false);

  useEffect(() => { loadSettings(); loadProfile(); }, []);

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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <MaterialIcons name="arrow-back" size={24} color="#1C1C1E" />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <SettingRow icon="email" label="Email" value={email || '—'} color="#5B8DEF" />
        </View>

        {/* Appearance */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Theme</Text>
          <SegmentedPicker options={THEME_OPTIONS} value={theme} onChange={(v) => setTheme(v)} />

          <View style={styles.cardDivider} />

          <Text style={styles.fieldLabel}>Weight Unit</Text>
          <SegmentedPicker options={UNIT_OPTIONS} value={units} onChange={(v) => setUnits(v)} />
        </View>

        {/* Scoliosis Profile */}
        <Text style={styles.sectionTitle}>Scoliosis Profile</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Surgery History</Text>
          <SegmentedPicker options={SURGERY_OPTIONS} value={surgery} onChange={(v) => updateProfile(setSurgery, v)} />

          <View style={styles.cardDivider} />

          <Text style={styles.fieldLabel}>Curve Type</Text>
          <SegmentedPicker options={CURVE_OPTIONS} value={curveType} onChange={(v) => updateProfile(setCurveType, v)} />

          <View style={styles.cardDivider} />

          <Text style={styles.fieldLabel}>Main Goal</Text>
          <SegmentedPicker options={GOAL_OPTIONS} value={goal} onChange={(v) => updateProfile(setGoal, v)} />
        </View>

        {/* Training Profile */}
        <Text style={styles.sectionTitle}>Training Profile</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Experience Level</Text>
          <SegmentedPicker options={EXPERIENCE_OPTIONS} value={experience} onChange={(v) => updateProfile(setExperience, v)} />

          <View style={styles.cardDivider} />

          <Text style={styles.fieldLabel}>Body Type</Text>
          <SegmentedPicker options={BODY_OPTIONS} value={bodyType} onChange={(v) => updateProfile(setBodyType, v)} />
        </View>

        {/* Save / Regenerate */}
        {dirty && (
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSave}
            accessibilityRole="button"
          >
            <MaterialIcons name="save" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save Profile Changes</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [styles.regenerateBtn, pressed && { opacity: 0.85 }]}
          onPress={handleRegeneratePlan}
          accessibilityRole="button"
        >
          <MaterialIcons name="auto-awesome" size={18} color={planRegenerated ? '#00B894' : '#FF9500'} />
          <Text style={[styles.regenerateBtnText, planRegenerated && { color: '#00B894' }]}>
            {planRegenerated ? 'Plan Updated!' : 'Regenerate Workout Plan'}
          </Text>
        </Pressable>

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
          onPress={handleLogout}
          accessibilityRole="button"
        >
          <MaterialIcons name="logout" size={18} color="#FF3B30" />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </Pressable>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>SpineFlow</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
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

  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  appName: { fontSize: 16, fontWeight: '700', color: '#AEAEB2' },
  appVersion: { fontSize: 12, color: '#C7C7CC', marginTop: 2 },
});
