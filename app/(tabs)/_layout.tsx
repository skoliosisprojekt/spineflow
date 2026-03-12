import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/theme';
import { useWorkoutStore } from '../../stores/workoutStore';
import ActiveWorkoutBar from '../../components/ActiveWorkoutBar';

const LIVE_COLOR = '#00E5A0';

function WorkoutTabIcon({ color, size }: { color: string; size: number }) {
  const isActive = useWorkoutStore((s) => s.isActive);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 1.6, duration: 600, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(400),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isActive, scaleAnim, opacityAnim]);

  return (
    <View style={styles.iconWrap}>
      <MaterialIcons name="play-circle-outline" size={size} color={color} />
      {isActive && (
        <View style={styles.badgeWrap}>
          <Animated.View
            style={[
              styles.badgePulse,
              { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
            ]}
          />
          <View style={styles.badgeDot} />
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const C = useTheme();

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: C.accent,
          tabBarInactiveTintColor: C.text3,
          tabBarStyle: {
            backgroundColor: C.card,
            borderTopColor: C.sep,
            borderTopWidth: 0.5,
            height: 85,
            paddingTop: 8,
            paddingBottom: 28,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
            tabBarAccessibilityLabel: t('tabs.home'),
          }}
        />
        <Tabs.Screen
          name="exercises"
          options={{
            title: t('tabs.exercises'),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="fitness-center" size={size} color={color} />
            ),
            tabBarAccessibilityLabel: t('tabs.exercises'),
          }}
        />
        <Tabs.Screen
          name="workout"
          options={{
            title: t('tabs.workout'),
            tabBarIcon: ({ color, size }) => (
              <WorkoutTabIcon color={color} size={size} />
            ),
            tabBarAccessibilityLabel: t('tabs.workout'),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: t('tabs.progress'),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="bar-chart" size={size} color={color} />
            ),
            tabBarAccessibilityLabel: t('tabs.progress'),
          }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: t('tabs.nutrition'),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="restaurant" size={size} color={color} />
            ),
            tabBarAccessibilityLabel: t('tabs.nutrition'),
          }}
        />
      </Tabs>

      {/* Global mini-player — floats above the tab bar on every tab */}
      <ActiveWorkoutBar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  iconWrap: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  badgeWrap: { position: 'absolute', top: -1, right: -1, width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  badgeDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: LIVE_COLOR, position: 'absolute' },
  badgePulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: LIVE_COLOR, position: 'absolute' },
});
