import { useRouter } from 'expo-router';
import OnboardingStep from '../../components/OnboardingStep';
import { useProfileStore } from '../../stores/settingsStore';
import type { GoalType } from '../../types';

const options = [
  { id: 'muscle', label: 'Build Muscle', description: 'Gain size and definition', icon: 'fitness-center' as const },
  { id: 'strength', label: 'Get Stronger', description: 'Increase overall strength', icon: 'flash-on' as const },
  { id: 'posture', label: 'Fix Posture', description: 'Improve alignment and balance', icon: 'accessibility-new' as const },
  { id: 'pain', label: 'Reduce Pain', description: 'Manage scoliosis-related discomfort', icon: 'healing' as const },
];

export default function GoalScreen() {
  const router = useRouter();
  const { goal, setGoal } = useProfileStore();

  return (
    <OnboardingStep
      step={2}
      totalSteps={6}
      title="Your main goal?"
      subtitle="We'll optimize your exercise plan for this."
      options={options}
      selected={goal}
      onSelect={(id) => setGoal(id as GoalType)}
      onNext={() => router.push('/onboarding/experience' as any)}
      onBack={() => router.back()}
    />
  );
}
