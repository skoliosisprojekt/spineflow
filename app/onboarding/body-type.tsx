import { useRouter } from 'expo-router';
import OnboardingStep from '../../components/OnboardingStep';
import { useProfileStore } from '../../stores/settingsStore';
import type { BodyType } from '../../types';

const options = [
  { id: 'hardgainer', label: 'Hardgainer', description: 'Hard to gain weight, fast metabolism', icon: 'trending-down' as const },
  { id: 'normal', label: 'Average', description: 'Normal metabolism', icon: 'trending-flat' as const },
  { id: 'softgainer', label: 'Easy gainer', description: 'Gains weight easily', icon: 'trending-up' as const },
];

export default function BodyTypeScreen() {
  const router = useRouter();
  const { bodyType, setBodyType } = useProfileStore();

  return (
    <OnboardingStep
      step={4}
      totalSteps={6}
      title="Your body type?"
      subtitle="This determines your nutrition plan."
      options={options}
      selected={bodyType}
      onSelect={(id) => setBodyType(id as BodyType)}
      onNext={() => router.push('/onboarding/equipment' as any)}
      onBack={() => router.back()}
    />
  );
}
