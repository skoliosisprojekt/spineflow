import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import OnboardingStep from '../../components/OnboardingStep';
import { useProfileStore } from '../../stores/settingsStore';
import { trackOnboardingStepCompleted } from '../../lib/analytics';
import type { CurveType } from '../../types';

export default function CurveTypeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { curveType, setCurveType } = useProfileStore();

  const options = [
    { id: 'thoracic', label: t('onboarding.curveType.thoracic'), description: t('onboarding.curveType.thoracicDesc'), icon: 'accessibility' as const },
    { id: 'lumbar', label: t('onboarding.curveType.lumbar'), description: t('onboarding.curveType.lumbarDesc'), icon: 'accessibility' as const },
    { id: 'thoracolumbar', label: t('onboarding.curveType.thoracolumbar'), description: t('onboarding.curveType.thoracolumbarDesc'), icon: 'accessibility' as const },
    { id: 'scurve', label: t('onboarding.curveType.scurve'), description: t('onboarding.curveType.scurveDesc'), icon: 'swap-vert' as const },
    { id: 'unsure', label: t('onboarding.curveType.unsure'), description: t('onboarding.curveType.unsureDesc'), icon: 'help-outline' as const },
  ];

  return (
    <OnboardingStep
      step={1}
      totalSteps={6}
      title={t('onboarding.curveType.title')}
      subtitle={t('onboarding.curveType.subtitle')}
      options={options}
      selected={curveType}
      onSelect={(id) => setCurveType(id as CurveType)}
      onNext={() => { trackOnboardingStepCompleted('curve_type'); router.push('/onboarding/goal' as any); }}
      onBack={() => router.back()}
    />
  );
}
