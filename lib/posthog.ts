// PostHog stub — real SDK requires a development build (expo run:android/ios).
// When re-enabling the real SDK, use the EU host:
//   import PostHog from 'posthog-react-native';
//   const posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_KEY!, {
//     host: 'https://eu.i.posthog.com',
//   });

export const POSTHOG_EU_HOST = 'https://eu.i.posthog.com';

export const posthog = {
  identify: (_userId: string, _properties?: Record<string, any>) => {},
  reset: () => {},
  capture: (_event: string, _properties?: Record<string, any>) => {},
  screen: (_screenName: string, _properties?: Record<string, any>) => {},
};

export function identifyUser(_userId: string, _properties?: Record<string, any>) {}

export function resetUser() {}

export function trackEvent(_event: string, _properties?: Record<string, any>) {}

export function trackScreen(_screenName: string, _properties?: Record<string, any>) {}
