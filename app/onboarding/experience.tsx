import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import OnboardingStep from '../../components/OnboardingStep';
import { useProfileStore } from '../../stores/settingsStore';
import type { ExperienceType } from '../../types';

export default function ExperienceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { experience, setExperience } = useProfileStore();

  const options = [
    { id: 'beginner', label: t('onboarding.experience.beginner'), description: t('onboarding.experience.beginnerDesc'), icon: 'emoji-people' as const },
    { id: 'intermediate', label: t('onboarding.experience.intermediate'), description: t('onboarding.experience.intermediateDesc'), icon: 'directions-run' as const },
    { id: 'advanced', label: t('onboarding.experience.advanced'), description: t('onboarding.experience.advancedDesc'), icon: 'military-tech' as const },
  ];

  return (
    <OnboardingStep
      step={3}
      totalSteps={6}
      title={t('onboarding.experience.title')}
      subtitle={t('onboarding.experience.subtitle')}
      options={options}
      selected={experience}
      onSelect={(id) => setExperience(id as ExperienceType)}
      onNext={() => router.push('/onboarding/body-type' as any)}
      onBack={() => router.back()}
    />
  );
}
