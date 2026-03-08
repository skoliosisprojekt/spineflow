import { useHistoryStore } from '../stores/historyStore';
import { useNutritionStore } from '../stores/nutritionStore';
import { usePlanStore } from '../stores/planStore';
import { usePremiumStore } from '../stores/premiumStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { useProfileStore } from '../stores/settingsStore';

/**
 * Clears all user-specific local data — call on logout or when a different
 * user logs in. Uses Zustand's getState() so it works outside React components.
 * Device-level settings (language, theme, units, consent, welcomeSeen) are kept.
 */
export function resetUserData(): void {
  useHistoryStore.getState().clearHistory();
  useNutritionStore.getState().resetNutrition();
  usePlanStore.getState().clearPlan();
  usePremiumStore.getState().resetPremium();
  useWorkoutStore.getState().clearWorkout();
  useProfileStore.getState().resetProfile();
}
