// components/animations/index.tsx
// SpineFlow Animated Components — pure React Native, no native modules required
// Verwendung: import { SuccessCheck, Confetti, WaterDrop, ... } from '../components/animations';

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// ═══════════════ 1. SUCCESS CHECKMARK ═══════════════
export function SuccessCheck({ size = 80, color = '#00B894' }: { size?: number; color?: string }) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.spring(scale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View style={{
      transform: [{ scale }],
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: color,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <MaterialIcons name="check" size={size * 0.55} color="#FFFFFF" />
    </Animated.View>
  );
}

// ═══════════════ 2. CONFETTI / CELEBRATION ═══════════════
const CONFETTI_COLORS = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE', '#FF2D55', '#00B894'];
const CONFETTI_PARTICLES = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2;
  const dist = 50 + (i % 4) * 20;
  return {
    targetX: Math.cos(angle) * dist,
    targetY: Math.sin(angle) * dist,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    pSize: 5 + (i % 4),
    rotation: `${i * 15}deg`,
  };
});

export function Confetti({ size = 300 }: { size?: number }) {
  const particles = useRef(
    CONFETTI_PARTICLES.map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    const animations = particles.map((p, i) =>
      Animated.parallel([
        Animated.timing(p.x, { toValue: CONFETTI_PARTICLES[i].targetX, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(p.y, { toValue: CONFETTI_PARTICLES[i].targetY, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(500),
          Animated.timing(p.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ])
    );
    const staggered = Animated.stagger(30, animations);
    staggered.start();
    return () => staggered.stop();
  }, []);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialIcons name="emoji-events" size={size * 0.2} color="#FF9500" />
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: CONFETTI_PARTICLES[i].pSize,
            height: CONFETTI_PARTICLES[i].pSize * 1.6,
            borderRadius: 2,
            backgroundColor: CONFETTI_PARTICLES[i].color,
            opacity: p.opacity,
            transform: [{ translateX: p.x }, { translateY: p.y }, { rotate: CONFETTI_PARTICLES[i].rotation }],
          }}
        />
      ))}
    </View>
  );
}

// ═══════════════ 3. WATER DROP ═══════════════
export function WaterDrop({ size = 60, color = '#007AFF' }: { size?: number; color?: string }) {
  const dropY = useRef(new Animated.Value(-size * 0.3)).current;
  const dropOpacity = useRef(new Animated.Value(0)).current;
  const splashScale = useRef(new Animated.Value(0)).current;
  const splashOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(dropY, { toValue: 0, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(dropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(dropOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(splashOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.spring(splashScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      ]),
      Animated.timing(splashOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', opacity: dropOpacity, transform: [{ translateY: dropY }] }}>
        <MaterialIcons name="water-drop" size={size * 0.7} color={color} />
      </Animated.View>
      <Animated.View style={{
        position: 'absolute',
        width: size * 0.85, height: size * 0.85,
        borderRadius: size * 0.425,
        borderWidth: 2, borderColor: color,
        opacity: splashOpacity,
        transform: [{ scale: splashScale }],
      }} />
    </View>
  );
}

// ═══════════════ 4. TROPHY ═══════════════
export function Trophy({ size = 80 }: { size?: number }) {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.spring(scale, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View style={{ transform: [{ scale }], alignItems: 'center', justifyContent: 'center' }}>
      <MaterialIcons name="emoji-events" size={size} color="#FFD700" />
    </Animated.View>
  );
}

// ═══════════════ 5. CROWN (Premium) ═══════════════
export function Crown({ size = 60, color = '#FFD700' }: { size?: number; color?: string }) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -6, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: bounce }], alignItems: 'center', justifyContent: 'center' }}>
      <MaterialIcons name="workspace-premium" size={size} color={color} />
    </Animated.View>
  );
}

// ═══════════════ 6. EMPTY STATE — Workout ═══════════════
export function EmptyWorkout({ size = 150, color = '#00B894' }: { size?: number; color?: string }) {
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -8, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute',
        width: size * 0.85, height: size * 0.85,
        borderRadius: size * 0.425,
        backgroundColor: color, opacity: 0.08,
      }} />
      <Animated.View style={{ transform: [{ translateY: float }], alignItems: 'center', justifyContent: 'center' }}>
        <MaterialIcons name="fitness-center" size={size * 0.5} color={color} />
      </Animated.View>
    </View>
  );
}

// ═══════════════ 7. EMPTY STATE — Charts/Progress ═══════════════
const CHART_BARS = [{ h: 0.28 }, { h: 0.45 }, { h: 0.35 }, { h: 0.55 }];

export function EmptyChart({ size = 150, color = '#00B894' }: { size?: number; color?: string }) {
  const grows = useRef(CHART_BARS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.stagger(150, grows.map(g => Animated.spring(g, { toValue: 1, friction: 4, useNativeDriver: true }))),
        Animated.delay(2000),
        Animated.parallel(grows.map(g => Animated.timing(g, { toValue: 0, duration: 300, useNativeDriver: true }))),
        Animated.delay(500),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const bw = size * 0.12;
  const maxH = size * 0.5;
  const gap = size * 0.05;
  const totalW = CHART_BARS.length * bw + (CHART_BARS.length - 1) * gap;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute',
        width: size * 0.85, height: size * 0.85,
        borderRadius: size * 0.425,
        backgroundColor: color, opacity: 0.07,
      }} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', width: totalW, height: maxH }}>
        {CHART_BARS.map((bar, i) => (
          <Animated.View
            key={i}
            style={{
              width: bw,
              height: maxH * bar.h,
              marginLeft: i === 0 ? 0 : gap,
              borderRadius: bw / 2,
              backgroundColor: color,
              opacity: 0.4 + i * 0.15,
              transform: [{ scaleY: grows[i] }],
            }}
          />
        ))}
      </View>
      <View style={{ width: totalW + bw, height: 2, backgroundColor: color, opacity: 0.25, borderRadius: 1, marginTop: 4 }} />
    </View>
  );
}

// ═══════════════ 8. LOADING SPINNER ═══════════════
export function LoadingSpinner({ size = 60, color = '#00B894' }: { size?: number; color?: string }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    const rotAnim = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })
    );
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.85, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    rotAnim.start();
    pulseAnim.start();
    return () => { rotAnim.stop(); pulseAnim.stop(); };
  }, []);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ringSize = size * 0.8;
  const borderW = Math.max(3, size * 0.07);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Pulsing bg */}
      <Animated.View style={{
        position: 'absolute',
        width: size, height: size,
        borderRadius: size / 2,
        backgroundColor: color, opacity: 0.12,
        transform: [{ scale: pulse }],
      }} />
      {/* Spinning ring with transparent top */}
      <Animated.View style={{
        position: 'absolute',
        width: ringSize, height: ringSize,
        borderRadius: ringSize / 2,
        borderWidth: borderW,
        borderColor: color,
        borderTopColor: 'transparent',
        transform: [{ rotate: spin }],
      }} />
      {/* Center dot */}
      <View style={{
        width: size * 0.2, height: size * 0.2,
        borderRadius: size * 0.1,
        backgroundColor: color,
      }} />
    </View>
  );
}

// ═══════════════ EXPORT ALL ═══════════════
export default {
  SuccessCheck,
  Confetti,
  WaterDrop,
  Trophy,
  Crown,
  EmptyWorkout,
  EmptyChart,
  LoadingSpinner,
};
