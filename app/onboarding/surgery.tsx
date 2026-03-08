import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import OnboardingStep from '../../components/OnboardingStep';
import { useProfileStore } from '../../stores/settingsStore';
import { trackOnboardingStepCompleted } from '../../lib/analytics';
import type { SurgeryType } from '../../types';

export default function SurgeryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { surgery, setSurgery } = useProfileStore();

  const options = [
    { id: 'none', label: t('onboarding.surgery.none'), description: t('onboarding.surgery.noneDesc'), icon: 'check-circle' as const },
    { id: 'partial', label: t('onboarding.surgery.partial'), description: t('onboarding.surgery.partialDesc'), icon: 'build' as const },
    { id: 'full', label: t('onboarding.surgery.full'), description: t('onboarding.surgery.fullDesc'), icon: 'warning' as const },
    { id: 'vbt', label: t('onboarding.surgery.vbt'), description: t('onboarding.surgery.vbtDesc'), icon: 'link' as const },
    { id: 'rods', label: t('onboarding.surgery.rods'), description: t('onboarding.surgery.rodsDesc'), icon: 'straighten' as const },
  ];

  return (
    <OnboardingStep
      step={0}
      totalSteps={6}
      title={t('onboarding.surgery.title')}
      subtitle={t('onboarding.surgery.subtitle')}
      options={options}
      selected={surgery}
      onSelect={(id) => setSurgery(id as SurgeryType)}
      onNext={() => { trackOnboardingStepCompleted('surgery'); router.push('/onboarding/curve-type' as any); }}
    />
  );
}
