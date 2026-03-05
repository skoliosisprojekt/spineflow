import { useRouter } from 'expo-router';
import OnboardingStep from '../../components/OnboardingStep';
import { useProfileStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { usePlanStore } from '../../stores/planStore';

const options = [
  { id: 'dumbbells', label: 'Dumbbells', icon: 'fitness-center' as const },
  { id: 'barbell', label: 'Barbell & Rack', icon: 'fitness-center' as const },
  { id: 'trapbar', label: 'Trap/Hex Bar', icon: 'fitness-center' as const },
  { id: 'cables', label: 'Cable Machine', icon: 'settings-ethernet' as const },
  { id: 'latpull', label: 'Lat Pulldown', icon: 'download' as const },
  { id: 'legpress', label: 'Leg Press', icon: 'airline-seat-legroom-extra' as const },
  { id: 'chestpress', label: 'Chest Press Machine', icon: 'weekend' as const },
  { id: 'smithm', label: 'Smith Machine', icon: 'view-column' as const },
  { id: 'bench', label: 'Adjustable Bench', icon: 'event-seat' as const },
  { id: 'bands', label: 'Resistance Bands', icon: 'gesture' as const },
  { id: 'pullupbar', label: 'Pull-Up Bar', icon: 'maximize' as const },
  { id: 'foam', label: 'Foam Roller', icon: 'radio-button-unchecked' as const },
];

export default function EquipmentScreen() {
  const router = useRouter();
  const { equipment, setEquipment, saveProfile, surgery, curveType, goal, experience, bodyType } = useProfileStore();
  const { setProfileComplete } = useAuthStore();
  const { generatePlan } = usePlanStore();

  const handleSelect = (id: string) => {
    if (equipment.includes(id)) {
      setEquipment(equipment.filter((e) => e !== id));
    } else {
      setEquipment([...equipment, id]);
    }
  };

  const handleFinish = async () => {
    await saveProfile();
    generatePlan({ surgery, curveType, goal, experience, bodyType });
    await setProfileComplete(true);
  };

  return (
    <OnboardingStep
      step={5}
      totalSteps={6}
      title="What equipment is available?"
      subtitle="Select everything in your gym. You can change this later."
      options={options}
      selected={equipment}
      onSelect={handleSelect}
      onNext={handleFinish}
      onBack={() => router.back()}
      multiSelect
    />
  );
}
