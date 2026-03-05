import { useRouter } from 'expo-router';
import OnboardingStep from '../../components/OnboardingStep';
import { useProfileStore } from '../../stores/settingsStore';
import type { SurgeryType } from '../../types';

const options = [
  { id: 'none', label: 'No surgery', description: 'No spinal operations', icon: 'check-circle' as const },
  { id: 'partial', label: 'Partial spinal fusion', description: 'Some vertebrae fused (e.g. T4-T12)', icon: 'build' as const },
  { id: 'full', label: 'Long/full spinal fusion', description: 'Most of the spine fused', icon: 'warning' as const },
  { id: 'vbt', label: 'Vertebral Body Tethering', description: 'VBT / flexible correction', icon: 'link' as const },
  { id: 'rods', label: 'Growing rods / MAGEC', description: 'Adjustable rod system', icon: 'straighten' as const },
];

export default function SurgeryScreen() {
  const router = useRouter();
  const { surgery, setSurgery } = useProfileStore();

  return (
    <OnboardingStep
      step={0}
      totalSteps={6}
      title="Have you had spinal surgery?"
      subtitle="This significantly affects which exercises are safe for you."
      options={options}
      selected={surgery}
      onSelect={(id) => setSurgery(id as SurgeryType)}
      onNext={() => router.push('/onboarding/curve-type' as any)}
    />
  );
}
