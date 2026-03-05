import { Stack } from 'expo-router';
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="surgery" /><Stack.Screen name="curve-type" /><Stack.Screen name="goal" /><Stack.Screen name="experience" /><Stack.Screen name="body-type" /><Stack.Screen name="equipment" /></Stack>;
}
