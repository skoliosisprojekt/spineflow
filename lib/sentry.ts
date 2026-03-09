import * as Sentry from '@sentry/react-native';

try {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.2,
    enabled: !__DEV__,
  });
} catch (_e) {
  // Native module not available — fall through silently
}

export default Sentry;
