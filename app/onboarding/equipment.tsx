import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { trackOnboardingStepCompleted, trackOnboardingFinished, identifyUserProfile } from '../../lib/analytics';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import OnboardingStep from '../../components/OnboardingStep';
import { useProfileStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { usePlanStore } from '../../stores/planStore';

export default function EquipmentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { equipment, setEquipment, saveProfile, surgery, curveType, goal, experience, bodyType } = useProfileStore();
  const { setProfileComplete } = useAuthStore();
  const { generatePlan } = usePlanStore();
  const [customInput, setCustomInput] = useState('');

  const options = [
    { id: 'dumbbells', label: t('onboarding.equipment.dumbbells'), description: t('onboarding.equipment.dumbbellsDesc'), icon: 'fitness-center' as const },
    { id: 'barbell',   label: t('onboarding.equipment.barbell'),   description: t('onboarding.equipment.barbellDesc'),   icon: 'fitness-center' as const },
    { id: 'trapbar',   label: t('onboarding.equipment.trapbar'),   description: t('onboarding.equipment.trapbarDesc'),   icon: 'fitness-center' as const },
    { id: 'cables',    label: t('onboarding.equipment.cables'),    description: t('onboarding.equipment.cablesDesc'),    icon: 'settings-ethernet' as const },
    { id: 'latpull',   label: t('onboarding.equipment.latpull'),   description: t('onboarding.equipment.latpullDesc'),   icon: 'download' as const },
    { id: 'legpress',  label: t('onboarding.equipment.legpress'),  description: t('onboarding.equipment.legpressDesc'),  icon: 'airline-seat-legroom-extra' as const },
    { id: 'chestpress',label: t('onboarding.equipment.chestpress'),description: t('onboarding.equipment.chestpressDesc'),icon: 'weekend' as const },
    { id: 'smithm',    label: t('onboarding.equipment.smithm'),    description: t('onboarding.equipment.smithmDesc'),    icon: 'view-column' as const },
    { id: 'bench',     label: t('onboarding.equipment.bench'),     description: t('onboarding.equipment.benchDesc'),     icon: 'event-seat' as const },
    { id: 'bands',     label: t('onboarding.equipment.bands'),     description: t('onboarding.equipment.bandsDesc'),     icon: 'gesture' as const },
    { id: 'pullupbar', label: t('onboarding.equipment.pullupbar'), description: t('onboarding.equipment.pullupbarDesc'), icon: 'maximize' as const },
    { id: 'foam',      label: t('onboarding.equipment.foam'),      description: t('onboarding.equipment.foamDesc'),      icon: 'radio-button-unchecked' as const },
    { id: 'mat',       label: t('onboarding.equipment.mat'),       description: t('onboarding.equipment.matDesc'),       icon: 'crop-landscape' as const },
  ];

  const customItems = equipment.filter((e) => e.startsWith('custom:'));

  const handleSelect = (id: string) => {
    if (equipment.includes(id)) {
      setEquipment(equipment.filter((e) => e !== id));
    } else {
      setEquipment([...equipment, id]);
    }
  };

  const handleAddCustom = () => {
    const name = customInput.trim();
    if (!name) return;
    const key = `custom:${name}`;
    if (!equipment.includes(key)) {
      setEquipment([...equipment, key]);
    }
    setCustomInput('');
  };

  const handleRemoveCustom = (key: string) => {
    setEquipment(equipment.filter((e) => e !== key));
  };

  const handleFinish = async () => {
    await saveProfile();
    generatePlan({ surgery, curveType, goal, experience, bodyType, equipment });
    trackOnboardingStepCompleted('equipment');
    trackOnboardingFinished({ surgery, curve_type: curveType, goal, experience, body_type: bodyType });
    const { userId } = useAuthStore.getState();
    if (userId) {
      identifyUserProfile(userId, {
        curve_type: curveType,
        surgery,
        goal,
        experience,
        body_type: bodyType,
      });
    }
    await setProfileComplete(true);
  };

  return (
    <OnboardingStep
      step={5}
      totalSteps={6}
      title={t('onboarding.equipment.title')}
      subtitle={t('onboarding.equipment.subtitle')}
      options={options}
      selected={equipment}
      onSelect={handleSelect}
      onNext={handleFinish}
      onBack={() => router.back()}
      multiSelect
      extraContent={
        <View style={eqStyles.customSection}>
          <Text style={eqStyles.customTitle}>{t('onboarding.customEquipment')}</Text>
          <View style={eqStyles.customInputRow}>
            <TextInput
              style={eqStyles.customInput}
              placeholder={t('onboarding.customEquipmentPlaceholder')}
              placeholderTextColor="#AEAEB2"
              value={customInput}
              onChangeText={setCustomInput}
              onSubmitEditing={handleAddCustom}
              returnKeyType="done"
            />
            <Pressable
              style={({ pressed }) => [eqStyles.customAddBtn, pressed && { opacity: 0.7 }, !customInput.trim() && { opacity: 0.4 }]}
              onPress={handleAddCustom}
              disabled={!customInput.trim()}
              accessibilityRole="button"
            >
              <MaterialIcons name="add" size={18} color="#FFFFFF" />
              <Text style={eqStyles.customAddBtnText}>{t('onboarding.addCustom')}</Text>
            </Pressable>
          </View>

          {customItems.length > 0 && (
            <View style={eqStyles.customChips}>
              {customItems.map((item) => (
                <View key={item} style={eqStyles.customChip}>
                  <MaterialIcons name="build" size={14} color="#FF9500" />
                  <Text style={eqStyles.customChipText}>{item.replace('custom:', '')}</Text>
                  <Pressable onPress={() => handleRemoveCustom(item)} hitSlop={6}>
                    <MaterialIcons name="close" size={14} color="#AEAEB2" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <View style={eqStyles.disclaimerRow}>
            <MaterialIcons name="warning" size={14} color="#FF9500" />
            <Text style={eqStyles.disclaimerText}>{t('onboarding.customDisclaimer')}</Text>
          </View>
        </View>
      }
    />
  );
}

const eqStyles = StyleSheet.create({
  customSection: { marginTop: 20, paddingHorizontal: 4 },
  customTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginBottom: 10 },
  customInputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  customInput: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#1C1C1E', borderWidth: 1, borderColor: '#E5E5EA',
  },
  customAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FF9500',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  customAddBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  customChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  customChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF3E0',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#FF950030',
  },
  customChipText: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  disclaimerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
  disclaimerText: { fontSize: 11, color: '#8E8E93', lineHeight: 16, flex: 1 },
});
