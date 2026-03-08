// Sentry stub — real SDK requires a development build (expo run:android/ios).
// Enable by replacing this file's contents once native modules are available.

const Sentry = {
  init: (_options?: any) => {},
  captureException: (_error: any, _hint?: any) => '',
  captureMessage: (_message: string) => '',
  wrap: <T,>(component: T): T => component,
  withScope: (_callback: (scope: any) => void) => {},
  setUser: (_user: any) => {},
};

export default Sentry;
