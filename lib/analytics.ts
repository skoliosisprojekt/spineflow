/**
 * Typed analytics layer — all PostHog calls go through here.
 * Every function is fire-and-forget; PostHog is already wrapped in try/catch
 * in lib/posthog.ts so no event will ever crash the app.
 */
import { trackEvent, identifyUser, resetUser } from './posthog';

// ── Re-exports (for callers that only need the low-level helpers) ─────────────
export { resetUser };

// ── Identity ─────────────────────────────────────────────────────────────────

export interface UserProfileProperties {
  email?: string;
  curve_type?: string;
  surgery?: string;
  goal?: string;
  experience?: string;
  body_type?: string;
}

/** Call after login AND after onboarding finishes. Sets persistent user properties for cohort analysis. */
export function identifyUserProfile(userId: string, properties: UserProfileProperties): void {
  identifyUser(userId, properties);
}

// ── Onboarding Funnel ─────────────────────────────────────────────────────────

export type OnboardingStepName =
  | 'surgery'
  | 'curve_type'
  | 'goal'
  | 'experience'
  | 'body_type'
  | 'equipment';

/** Fire on every Next press during onboarding. */
export function trackOnboardingStepCompleted(step_name: OnboardingStepName): void {
  trackEvent('Onboarding Step Completed', { step_name });
}

export interface OnboardingFinishedProperties {
  surgery: string;
  curve_type: string;
  goal: string;
  experience: string;
  body_type: string;
}

/** Fire once when the user completes the last onboarding step. */
export function trackOnboardingFinished(properties: OnboardingFinishedProperties): void {
  trackEvent('Onboarding Finished', properties);
}

// ── Workout Execution ─────────────────────────────────────────────────────────

export interface WorkoutStartedProperties {
  source: 'plan' | 'manual';
  exercise_count: number;
}

export function trackWorkoutStarted(properties: WorkoutStartedProperties): void {
  trackEvent('Workout Started', properties);
}

export interface WorkoutCompletedProperties {
  total_volume: number;
  duration_minutes: number;
  exercise_count: number;
  completed_sets: number;
}

export function trackWorkoutCompleted(properties: WorkoutCompletedProperties): void {
  trackEvent('Workout Completed', properties);
}

export function trackWorkoutCancelled(minutes_spent_before_cancel: number): void {
  trackEvent('Workout Cancelled', { minutes_spent_before_cancel });
}

export function trackAIAdjustmentHandled(
  action: 'accepted' | 'rejected',
  exercise_name: string,
): void {
  trackEvent('AI Adjustment Handled', { action, exercise_name });
}

// ── Nutrition & Habits ────────────────────────────────────────────────────────

export function trackMealLogged(meal_type: string): void {
  trackEvent('Meal Logged', { meal_type });
}

export function trackHydrationLogged(amount_ml: number): void {
  trackEvent('Hydration Logged', { amount_ml });
}

// ── Monetisation & Retention ─────────────────────────────────────────────────

export function trackPaywallViewed(): void {
  trackEvent('Premium Paywall Viewed');
}

export function trackAccountDeleted(): void {
  trackEvent('Account Deleted');
}
