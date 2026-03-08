import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import OnboardingStep from '../../components/OnboardingStep';
import { useProfileStore } from '../../stores/settingsStore';
import { trackOnboardingStepCompleted } from '../../lib/analytics';
import type { BodyType } from '../../types';

export default function BodyTypeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { bodyType, setBodyType } = useProfileStore();

  const options = [
    { id: 'hardgainer', label: t('onboarding.bodyType.hardgainer'), description: t('onboarding.bodyType.hardgainerDesc'), icon: 'trending-down' as const },
    { id: 'normal', label: t('onboarding.bodyType.normal'), description: t('onboarding.bodyType.normalDesc'), icon: 'trending-flat' as const },
    { id: 'softgainer', label: t('onboarding.bodyType.softgainer'), description: t('onboarding.bodyType.softgainerDesc'), icon: 'trending-up' as const },
  ];

  return (
    <OnboardingStep
      step={4}
      totalSteps={6}
      title={t('onboarding.bodyType.title')}
      subtitle={t('onboarding.bodyType.subtitle')}
      options={options}
      selected={bodyType}
      onSelect={(id) => setBodyType(id as BodyType)}
      onNext={() => { trackOnboardingStepCompleted('body_type'); router.push('/onboarding/equipment' as any); }}
      onBack={() => router.back()}
    />
  );
}
