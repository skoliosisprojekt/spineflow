import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkoutStore } from '../stores/workoutStore';
import { exercises as allExercises, exerciseNames } from '../data/exercises';

const BRAND_BLUE = '#1E5B87';
const BAR_HEIGHT = 52;

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export default function ActiveWorkoutBar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive, exercises, workoutStartTime } = useWorkoutStore();

  const [elapsed, setElapsed] = useState(0);
  const slideAnim = useRef(new Animated.Value(-BAR_HEIGHT)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wasActive = useRef(false);

  // Slide in / out
  useEffect(() => {
    if (isActive && !wasActive.current) {
      wasActive.current = true;
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else if (!isActive && wasActive.current) {
      wasActive.current = false;
      Animated.timing(slideAnim, {
        toValue: -BAR_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, slideAnim]);

  // Pulsing live dot
  useEffect(() => {
    if (!isActive) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isActive, pulseAnim]);

  // Elapsed timer
  useEffect(() => {
    if (!isActive || !workoutStartTime) { setElapsed(0); return; }
    const tick = () => setElapsed(Math.floor((Date.now() - workoutStartTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isActive, workoutStartTime]);

  // Workout label: first exercise name or exercise count
  const label = (() => {
    if (exercises.length === 0) return '—';
    const firstName = exerciseNames[exercises[0].exerciseId] ?? '';
    return exercises.length === 1
      ? firstName
      : `${firstName} +${exercises.length - 1}`;
  })();

  if (!isActive) return null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { bottom: 85 + Math.max(insets.bottom - 28, 0), transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        style={({ pressed }) => [styles.bar, pressed && { opacity: 0.88 }]}
        onPress={() => router.push('/(tabs)/workout')}
        accessibilityRole="button"
        accessibilityLabel="Return to active workout"
      >
        {/* Left: live dot + label */}
        <View style={styles.left}>
          <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
          <View style={styles.labelBlock}>
            <Text style={styles.liveLabel}>LIVE</Text>
            <Text style={styles.workoutName} numberOfLines={1}>{label}</Text>
          </View>
        </View>

        {/* Center: timer */}
        <View style={styles.center}>
          <MaterialIcons name="timer" size={14} color="rgba(255,255,255,0.7)" />
          <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
        </View>

        {/* Right: chevron */}
        <View style={styles.right}>
          <Text style={styles.setCount}>
            {exercises.reduce((n, e) => n + e.sets.length, 0)} sets
          </Text>
          <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.8)" />
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 10,
    right: 10,
    zIndex: 999,
  },
  bar: {
    height: BAR_HEIGHT,
    backgroundColor: BRAND_BLUE,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: BRAND_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E5A0',
    flexShrink: 0,
  },
  labelBlock: {
    minWidth: 0,
  },
  liveLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00E5A0',
    letterSpacing: 1.5,
    lineHeight: 11,
  },
  workoutName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  center: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  timer: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  setCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
});
