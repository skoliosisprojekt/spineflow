import { useState, useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

// Lightweight endpoint — returns 204 when reachable, no body
const CHECK_URL = 'https://connectivitycheck.gstatic.com/generate_204';
const TIMEOUT_MS = 4_000;
const POLL_MS = 15_000;

/**
 * Pure-JS connectivity check — no native modules required.
 * Sends a HEAD request with a short timeout.
 */
export async function checkOnline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(CHECK_URL, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(tid);
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
}

/**
 * Hook that reactively returns { isOnline }.
 * Checks on mount, on app foreground, and every 15 s while active.
 */
export function useNetwork(): { isOnline: boolean } {
  const [isOnline, setIsOnline] = useState(true); // optimistic default

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const check = () => checkOnline().then(setIsOnline);

    check();

    const appStateSub = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') check();
      },
    );

    intervalId = setInterval(check, POLL_MS);

    return () => {
      appStateSub.remove();
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return { isOnline };
}
