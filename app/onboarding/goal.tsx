import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import OnboardingStep from '../../components/OnboardingStep';
import { useProfileStore } from '../../stores/settingsStore';
import type { GoalType } from '../../types';

export default function GoalScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { goal, setGoal } = useProfileStore();

  const options = [
    { id: 'muscle', label: t('onboarding.goal.muscle'), description: t('onboarding.goal.muscleDesc'), icon: 'fitness-center' as const },
    { id: 'strength', label: t('onboarding.goal.strength'), description: t('onboarding.goal.strengthDesc'), icon: 'flash-on' as const },
    { id: 'posture', label: t('onboarding.goal.posture'), description: t('onboarding.goal.postureDesc'), icon: 'accessibility-new' as const },
    { id: 'pain', label: t('onboarding.goal.pain'), description: t('onboarding.goal.painDesc'), icon: 'healing' as const },
  ];

  return (
    <OnboardingStep
      step={2}
      totalSteps={6}
      title={t('onboarding.goal.title')}
      subtitle={t('onboarding.goal.subtitle')}
      options={options}
      selected={goal}
      onSelect={(id) => setGoal(id as GoalType)}
      onNext={() => router.push('/onboarding/experience' as any)}
      onBack={() => router.back()}
    />
  );
}
