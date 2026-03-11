export type Gender = 'male' | 'female' | 'diverse';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active';

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

/** Mifflin-St Jeor TDEE (kcal/day). Defaults to moderate activity. */
export function calculateTDEE(
  weight: number,
  height: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel = 'moderate',
): number {
  const genderOffset = gender === 'male' ? 5 : gender === 'female' ? -161 : -78; // diverse = avg(male, female)
  const bmr = 10 * weight + 6.25 * height - 5 * age + genderOffset;
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

/**
 * Calculates daily macro targets based on TDEE, goal, body type and weight.
 * Carbs are calculated from remaining calories after protein and fat.
 */
export function calculateMacros(
  tdee: number,
  goal: string,
  bodyType: string,
  weight: number,
): MacroTargets {
  let calories = tdee;
  let proteinPerKg = 1.6;
  let fatPerKg = 1.0;

  switch (goal) {
    case 'muscle':
      calories = tdee + 300;
      proteinPerKg = 2.0;
      fatPerKg = 1.0;
      break;
    case 'strength':
      calories = tdee + 200;
      proteinPerKg = 1.8;
      fatPerKg = 1.0;
      break;
    case 'posture':
      calories = tdee;
      proteinPerKg = 1.6;
      fatPerKg = 1.0;
      break;
    case 'pain':
      calories = tdee;
      proteinPerKg = 1.6;
      fatPerKg = 0.9;
      break;
  }

  if (bodyType === 'hardgainer') calories += 200;
  if (bodyType === 'softgainer') calories -= 200;

  const protein = Math.round(weight * proteinPerKg);
  const fat = Math.round(weight * fatPerKg);
  const carbsCals = calories - protein * 4 - fat * 9;
  const carbs = Math.max(0, Math.round(carbsCals / 4));

  return { calories: Math.round(calories), protein, carbs, fat };
}
