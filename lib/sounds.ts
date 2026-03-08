import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_ENABLED_KEY = 'soundEnabled';

/** Check if sound/vibration is enabled (default: true) */
export async function isSoundEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(SOUND_ENABLED_KEY);
    return val !== 'false';
  } catch {
    return true;
  }
}

/** Set sound/vibration enabled/disabled */
export async function setSoundEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
}

/** Vibrate when the rest timer ends */
export async function playTimerEndSound(): Promise<void> {
  try {
    const enabled = await isSoundEnabled();
    if (!enabled) return;

    // Double pulse vibration pattern: wait 0ms, vibrate 300ms, pause 150ms, vibrate 300ms
    Vibration.vibrate([0, 300, 150, 300]);
  } catch (e) {
    console.warn('Failed to vibrate:', e);
  }
}
