import { useRouter } from 'expo-router';
import OnboardingStep from '../../components/OnboardingStep';
import { useProfileStore } from '../../stores/settingsStore';
import type { ExperienceType } from '../../types';

const options = [
  { id: 'beginner', label: 'Beginner', description: '0–6 months training', icon: 'emoji-people' as const },
  { id: 'intermediate', label: 'Intermediate', description: '6–24 months training', icon: 'directions-run' as const },
  { id: 'advanced', label: 'Advanced', description: '2+ years training', icon: 'military-tech' as const },
];

export default function ExperienceScreen() {
  const router = useRouter();
  const { experience, setExperience } = useProfileStore();

  return (
    <OnboardingStep
      step={3}
      totalSteps={6}
      title="Training experience?"
      subtitle="This determines exercise selection and intensity."
      options={options}
      selected={experience}
      onSelect={(id) => setExperience(id as ExperienceType)}
      onNext={() => router.push('/onboarding/body-type' as any)}
      onBack={() => router.back()}
    />
  );
}
