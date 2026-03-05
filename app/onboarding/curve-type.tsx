import { useRouter } from 'expo-router';
import OnboardingStep from '../../components/OnboardingStep';
import { useProfileStore } from '../../stores/settingsStore';
import type { CurveType } from '../../types';

const options = [
  { id: 'thoracic', label: 'Thoracic', description: 'Upper/mid spine curve', icon: 'accessibility' as const },
  { id: 'lumbar', label: 'Lumbar', description: 'Lower spine curve', icon: 'accessibility' as const },
  { id: 'thoracolumbar', label: 'Thoracolumbar', description: 'Transition area', icon: 'accessibility' as const },
  { id: 'scurve', label: 'S-Curve', description: 'Double curve (upper + lower)', icon: 'swap-vert' as const },
  { id: 'unsure', label: 'Not sure', description: "I don't know my curve type yet", icon: 'help-outline' as const },
];

export default function CurveTypeScreen() {
  const router = useRouter();
  const { curveType, setCurveType } = useProfileStore();

  return (
    <OnboardingStep
      step={1}
      totalSteps={6}
      title="What's your scoliosis type?"
      subtitle="This determines curve-specific exercise modifications."
      options={options}
      selected={curveType}
      onSelect={(id) => setCurveType(id as CurveType)}
      onNext={() => router.push('/onboarding/goal' as any)}
      onBack={() => router.back()}
    />
  );
}
