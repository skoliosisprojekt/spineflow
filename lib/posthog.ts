import PostHog from 'posthog-react-native';

export const POSTHOG_EU_HOST = 'https://eu.i.posthog.com';

export const posthog = new PostHog(
  process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '',
  { host: POSTHOG_EU_HOST },
);

export function identifyUser(userId: string, properties?: Record<string, any>) {
  try { posthog.identify(userId, properties); } catch {}
}

export function resetUser() {
  try { posthog.reset(); } catch {}
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  try { posthog.capture(event, properties); } catch {}
}

export function trackScreen(screenName: string, properties?: Record<string, any>) {
  try { posthog.screen(screenName, properties); } catch {}
}

export function captureError(
  error: unknown,
  context?: { componentStack?: string | null; source?: string; [key: string]: any },
) {
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    posthog.capture('app_error', {
      error_name: err.name,
      error_message: err.message,
      error_stack: err.stack ?? '',
      ...context,
    });
  } catch {}
}
