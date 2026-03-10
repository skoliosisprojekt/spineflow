import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { exerciseSteps } from '../data/exerciseAnimations';

const muscleConfig: Record<string, { color: string; bg: string; accent: string }> = {
  chest:     { color: '#E85D75', bg: '#FDE8EC', accent: '#F8B4C4' },
  back:      { color: '#5B8DEF', bg: '#E8F0FD', accent: '#A8C4F7' },
  legs:      { color: '#00B894', bg: '#E6F9F4', accent: '#7DDFC4' },
  shoulders: { color: '#FF9500', bg: '#FFF3E0', accent: '#FFCC80' },
  arms:      { color: '#AF52DE', bg: '#F3E8FD', accent: '#D4A5F0' },
  core:      { color: '#FF6B6B', bg: '#FFEBEB', accent: '#FFB3B3' },
};

const STEP_LABELS = ['setup', 'move', 'hold', 'return'] as const;

interface ExerciseIllustrationProps {
  muscle: string;
  exerciseName: string;
  exerciseId: number;
}

export default function ExerciseIllustration({ muscle, exerciseName, exerciseId }: ExerciseIllustrationProps) {
  const { t } = useTranslation();
  const config = muscleConfig[muscle] || { color: '#00B894', bg: '#E6F9F4', accent: '#7DDFC4' };
  const steps = exerciseSteps[exerciseId];
  const [activeStep, setActiveStep] = useState(0);
  const [paused, setPaused] = useState(false);

  // Main icon animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // Pulsing ring
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  const stepCount = steps ? steps.length : 0;

  // Pulsing outer ring
  useEffect(() => {
    if (!steps || paused) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [steps, paused]);

  // Auto-cycle steps
  useEffect(() => {
    if (!steps || paused) return;
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.7, duration: 180, useNativeDriver: true }),
      ]).start(() => {
        setActiveStep((prev) => {
          const next = (prev + 1) % stepCount;
          // Animate progress bar
          Animated.timing(progressAnim, {
            toValue: next / (stepCount - 1),
            duration: 300,
            useNativeDriver: false,
          }).start();
          return next;
        });
        Animated.parallel([
          Animated.spring(fadeAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
        ]).start();
      });
    }, 2800);
    return () => clearInterval(interval);
  }, [steps, paused, stepCount]);

  if (!steps) return null;

  const currentStep = steps[activeStep];
  const stepTextKey = `exerciseAnim.${exerciseId}.s${activeStep + 1}`;
  const stepText = t(stepTextKey);

  return (
    <Pressable
      style={[styles.container, { backgroundColor: config.bg }]}
      onPress={() => setPaused((p) => !p)}
    >
      {/* Decorative background layers */}
      <View style={[styles.bgCircle1, { backgroundColor: config.accent, opacity: 0.15 }]} />
      <View style={[styles.bgCircle2, { backgroundColor: config.color, opacity: 0.07 }]} />
      <View style={[styles.bgCircle3, { backgroundColor: config.accent, opacity: 0.1 }]} />

      {/* Step timeline at the top */}
      <View style={styles.timeline}>
        {steps.map((s, i) => {
          const isActive = i === activeStep;
          const isDone = i < activeStep;
          return (
            <View key={i} style={styles.timelineItem}>
              {/* Connector line (not on first) */}
              {i > 0 && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: isDone || isActive ? config.color : config.accent },
                  ]}
                />
              )}
              <View
                style={[
                  styles.timelineIcon,
                  {
                    backgroundColor: isActive ? config.color : isDone ? config.color + '30' : '#FFFFFF',
                    borderColor: isActive ? config.color : isDone ? config.color : config.accent,
                    transform: [{ scale: isActive ? 1.15 : 1 }],
                  },
                ]}
              >
                <MaterialIcons
                  name={s.icon}
                  size={isActive ? 18 : 14}
                  color={isActive ? '#FFFFFF' : isDone ? config.color : config.accent}
                />
              </View>
              <Text
                style={[
                  styles.timelineLabel,
                  { color: isActive ? config.color : '#AEAEB2', fontWeight: isActive ? '700' : '500' },
                ]}
              >
                {i + 1}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Central animated icon area */}
      <View style={styles.centerArea}>
        {/* Pulsing outer ring */}
        <Animated.View
          style={[
            styles.pulseRing,
            { borderColor: config.accent, transform: [{ scale: pulseAnim }] },
          ]}
        />

        {/* Main icon circle */}
        <Animated.View
          style={[
            styles.mainIcon,
            {
              backgroundColor: config.color,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              shadowColor: config.color,
            },
          ]}
        >
          <MaterialIcons name={currentStep.icon} size={44} color="#FFFFFF" />
        </Animated.View>
      </View>

      {/* Step label */}
      <Animated.View style={[styles.stepLabelRow, { opacity: fadeAnim }]}>
        <View style={[styles.stepNumberBadge, { backgroundColor: config.color }]}>
          <Text style={styles.stepNumberText}>{activeStep + 1}</Text>
        </View>
        <Text style={[styles.stepPhaseLabel, { color: config.color }]}>
          {t(`exerciseAnim.stepLabels.${STEP_LABELS[activeStep] || 'move'}`)}
        </Text>
      </Animated.View>

      {/* Step instruction text */}
      <Animated.Text
        style={[styles.stepText, { opacity: fadeAnim }]}
        numberOfLines={2}
      >
        {stepText}
      </Animated.Text>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: config.accent + '40' }]}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: config.color,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Pause indicator */}
      {paused && (
        <View style={styles.pauseOverlay}>
          <MaterialIcons name="play-arrow" size={28} color={config.color} />
          <Text style={[styles.pauseText, { color: config.color }]}>
            {t('exerciseAnim.tapToPlay')}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    height: 310,
  },

  // Background decorations
  bgCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -60,
    right: -60,
  },
  bgCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -40,
    left: -40,
  },
  bgCircle3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: 80,
    left: -20,
  },

  // Step timeline
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connector: {
    width: 28,
    height: 2,
    borderRadius: 1,
    marginHorizontal: 2,
  },
  timelineIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLabel: {
    position: 'absolute',
    bottom: -16,
    fontSize: 10,
    textAlign: 'center',
    width: 34,
  },

  // Center icon area
  centerArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 18,
    width: 120,
    height: 120,
  },
  pulseRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
  },
  mainIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  // Step label
  stepLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepPhaseLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  // Instruction text
  stepText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
    height: 44,
    paddingHorizontal: 12,
  },

  // Progress bar
  progressTrack: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Pause overlay
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    gap: 4,
  },
  pauseText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
