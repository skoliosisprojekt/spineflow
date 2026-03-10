import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Animated, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useWorkoutStore, WorkoutExercise } from '../../stores/workoutStore';
import { useHistoryStore, WorkoutRecord } from '../../stores/historyStore';
import { shareWorkout } from '../../lib/exportWorkout';
import { generateShareText, shareWorkoutText, copyWorkoutText } from '../../lib/shareWorkoutText';
import { usePlanStore } from '../../stores/planStore';
import { useProfileStore, useSettingsStore } from '../../stores/settingsStore';
import { useNutritionStore } from '../../stores/nutritionStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { runAIAnalysis, type AIAnalysisResult } from '../../lib/aiAnalysis';
import { useNetwork } from '../../lib/network';
import { saveAdjustments, saveAnalysis, getAnalysis, getPendingAdjustments, updateAdjustmentStatus } from '../../db/queries';
import { useAuthStore } from '../../stores/authStore';
import type { WorkoutAdjustment } from '../../db/schema';
import { getSafety } from '../../lib/safety';
import { isExerciseAllowed, getExerciseSafetyLevel } from '../../lib/workoutGenerator';
import { exercises as allExercises, exerciseNames, exerciseMods, exerciseFusionMods, exerciseTips } from '../../data/exercises';
import { playTimerEndSound } from '../../lib/sounds';
import { exerciseSteps } from '../../data/exerciseAnimations';
import { SuccessCheck, Confetti, EmptyWorkout, LoadingSpinner, Crown } from '../../components/animations';
import { trackWorkoutStarted, trackWorkoutCompleted, trackWorkoutCancelled, trackAIAdjustmentHandled } from '../../lib/analytics';
import { trackEvent } from '../../lib/posthog';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import ErrorBoundary from '../../components/ErrorBoundary';

function RestBar({ onSkip }: { onSkip?: () => void }) {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);
  const [target, setTarget] = useState(90);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('90');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const soundPlayedRef = useRef(false);

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const progress = Math.min(elapsed / target, 1);
  const done = elapsed >= target;

  // Play sound when timer reaches 0
  useEffect(() => {
    if (done && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      playTimerEndSound();
    }
  }, [done]);
  const remaining = Math.max(target - elapsed, 0);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const elapsedMins = Math.floor(elapsed / 60);
  const elapsedSecs = elapsed % 60;

  const barColor = done ? '#00B894' : '#FF9500';

  const commitEdit = () => {
    const val = Math.max(10, Math.min(600, Number(editValue) || 90));
    setTarget(val);
    setEditValue(String(val));
    setEditing(false);
  };

  return (
    <View style={styles.restBar}>
      <View style={styles.restBarHeader}>
        <MaterialIcons name="timer" size={14} color={barColor} />
        <Text style={[styles.restBarLabel, { color: barColor }]}>
          {done ? t('workout.restComplete') : t('workout.resting')}
        </Text>
        <Text style={styles.restBarTime}>
          {elapsedMins}:{elapsedSecs < 10 ? '0' : ''}{elapsedSecs}
          {' / '}
          {editing ? (
            <TextInput
              style={styles.restBarInput}
              value={editValue}
              onChangeText={setEditValue}
              onBlur={commitEdit}
              onSubmitEditing={commitEdit}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
              accessibilityLabel="Rest duration in seconds"
            />
          ) : (
            <Text
              onPress={() => { setEditing(true); setEditValue(String(target)); }}
              style={styles.restBarTarget}
              accessibilityRole="button"
              accessibilityLabel={`Rest target: ${target} seconds. Tap to edit.`}
            >
              {Math.floor(target / 60)}:{target % 60 < 10 ? '0' : ''}{target % 60}
            </Text>
          )}
        </Text>
        {onSkip && (
          <Pressable onPress={onSkip} hitSlop={8} accessibilityRole="button" accessibilityLabel="Skip rest">
            <Text style={styles.restBarSkip}>{t('common.skip')}</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.restBarTrack}>
        <View style={[styles.restBarFill, { width: `${progress * 100}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

interface WorkoutExerciseCardProps {
  item: WorkoutExercise;
  safetyLevel: 'safe' | 'modify' | 'avoid';
  safetyNote?: string;
  fusionNote?: string;
  lastSets?: { weight: number; reps: number }[];
  onUpdateSet: (setIndex: number, field: 'weight' | 'reps', value: number) => void;
  onToggleSet: (setIndex: number) => void;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
  onRemoveExercise: () => void;
}

function WorkoutExerciseCard({ item, safetyLevel, safetyNote, fusionNote, lastSets, onUpdateSet, onToggleSet, onAddSet, onRemoveSet, onRemoveExercise }: WorkoutExerciseCardProps) {
  const { t } = useTranslation();
  const exercise = allExercises.find((e) => e.id === item.exerciseId);
  const name = exerciseNames[item.exerciseId] || `Exercise ${item.exerciseId}`;
  const completedSets = item.sets.filter((s) => s.completed).length;
  const tipKey = `exerciseTips.${item.exerciseId}`;
  const tip = t(tipKey) !== tipKey ? t(tipKey) : exerciseTips[item.exerciseId];
  const [showTip, setShowTip] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [successSetIdx, setSuccessSetIdx] = useState<number | null>(null);
  const steps = exerciseSteps[item.exerciseId];

  const handleToggleWithAnim = (setIndex: number) => {
    const wasCompleted = item.sets[setIndex]?.completed;
    onToggleSet(setIndex);
    if (!wasCompleted) {
      setSuccessSetIdx(setIndex);
      setTimeout(() => setSuccessSetIdx(null), 800);
    }
  };

  // Find the index where rest bar should appear: after the last completed set, before the first uncompleted
  const restAfterIndex = (() => {
    for (let i = 0; i < item.sets.length; i++) {
      if (item.sets[i].completed && (i + 1 >= item.sets.length || !item.sets[i + 1].completed)) {
        if (i + 1 < item.sets.length) return i;
      }
    }
    return -1;
  })();
  // Track if rest was skipped
  const [restSkipped, setRestSkipped] = useState(false);
  // Reset skip when a new set is completed
  const prevCompleted = useRef(completedSets);
  useEffect(() => {
    if (completedSets !== prevCompleted.current) {
      setRestSkipped(false);
      prevCompleted.current = completedSets;
    }
  }, [completedSets]);

  return (
    <View style={styles.exerciseCard}>
      {/* Modification Warning */}
      {safetyLevel === 'modify' && safetyNote && (
        <View style={styles.safetyBanner}>
          <MaterialIcons name="warning" size={14} color="#CC7700" />
          <Text style={styles.safetyBannerText}>{safetyNote}</Text>
        </View>
      )}

      {/* Post-Surgery Note */}
      {fusionNote && (
        <View style={styles.fusionBanner}>
          <MaterialIcons name="local-hospital" size={14} color="#FF3B30" />
          <Text style={styles.fusionBannerText}>{fusionNote}</Text>
        </View>
      )}

      {/* Exercise Header */}
      <View style={styles.exerciseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{name}</Text>
          <Text style={styles.exerciseMeta}>
            {exercise?.muscle} · {t('workout.setsDone', { completed: completedSets, total: item.sets.length })}
          </Text>
        </View>
        {steps && (
          <Pressable
            onPress={() => setShowGuide(!showGuide)}
            style={styles.tipToggleBtn}
            accessibilityRole="button"
            accessibilityLabel="Show exercise guide"
          >
            <MaterialIcons name={showGuide ? 'expand-less' : 'directions-run'} size={18} color="#00B894" />
          </Pressable>
        )}
        {tip && (
          <Pressable
            onPress={() => setShowTip(!showTip)}
            style={styles.tipToggleBtn}
            accessibilityRole="button"
            accessibilityLabel="Show form tips"
          >
            <MaterialIcons name={showTip ? 'expand-less' : 'lightbulb-outline'} size={18} color="#FF9500" />
          </Pressable>
        )}
        <Pressable
          onPress={onRemoveExercise}
          style={styles.removeBtn}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${name} from workout`}
        >
          <MaterialIcons name="close" size={18} color="#FF3B30" />
        </Pressable>
      </View>

      {/* Form Tip */}
      {showTip && tip && (
        <View style={styles.tipBanner}>
          <MaterialIcons name="lightbulb" size={14} color="#FF9500" />
          <Text style={styles.tipBannerText}>{tip}</Text>
        </View>
      )}

      {/* Exercise Execution Guide */}
      {showGuide && steps && (
        <View style={styles.guideBanner}>
          <View style={styles.guideHeader}>
            <MaterialIcons name="directions-run" size={16} color="#00B894" />
            <Text style={styles.guideTitle}>{t('workout.howTo')}</Text>
          </View>
          {steps.map((s, i) => {
            const stepKey = `exerciseAnim.${item.exerciseId}.s${i + 1}`;
            return (
              <View key={i} style={styles.guideStep}>
                <View style={[styles.guideStepNum, { backgroundColor: s.color + '20' }]}>
                  <Text style={[styles.guideStepNumText, { color: s.color }]}>{i + 1}</Text>
                </View>
                <MaterialIcons name={s.icon} size={16} color={s.color} style={{ marginRight: 6 }} />
                <Text style={styles.guideStepText}>{t(stepKey)}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Set Headers */}
      <View style={styles.setRow}>
        <Text style={[styles.setHeader, { width: 36 }]}>{t('workout.set')}</Text>
        <Text style={[styles.setHeader, { flex: 1 }]}>{t('workout.weightKg')}</Text>
        <Text style={[styles.setHeader, { flex: 1 }]}>{t('workout.reps')}</Text>
        <Text style={[styles.setHeader, { width: 44 }]}></Text>
      </View>

      {/* Sets */}
      {item.sets.map((s, i) => {
        const prev = lastSets && lastSets[i];
        return (
        <View key={i}>
          <View style={[styles.setRow, s.completed && styles.setRowDone]}>
            <Text style={[styles.setNumber, s.completed && styles.setTextDone]}>{i + 1}</Text>
            <TextInput
              style={[styles.setInput, s.completed && styles.setInputDone]}
              value={s.weight > 0 ? String(s.weight) : ''}
              onChangeText={(t) => onUpdateSet(i, 'weight', Number(t) || 0)}
              keyboardType="numeric"
              placeholder={prev ? String(prev.weight) : '0'}
              placeholderTextColor="#C7C7CC"
              editable={!s.completed}
              accessibilityLabel={`Set ${i + 1} weight`}
            />
            <TextInput
              style={[styles.setInput, s.completed && styles.setInputDone]}
              value={s.reps > 0 ? String(s.reps) : ''}
              onChangeText={(t) => onUpdateSet(i, 'reps', Number(t) || 0)}
              keyboardType="numeric"
              placeholder={prev ? String(prev.reps) : '0'}
              placeholderTextColor="#C7C7CC"
              editable={!s.completed}
              accessibilityLabel={`Set ${i + 1} reps`}
            />
            <Pressable
              onPress={() => handleToggleWithAnim(i)}
              style={[styles.checkBtn, s.completed && styles.checkBtnDone]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: s.completed }}
              accessibilityLabel={`Mark set ${i + 1} as ${s.completed ? 'incomplete' : 'complete'}`}
            >
              {successSetIdx === i ? (
                <SuccessCheck size={40} />
              ) : (
                <MaterialIcons
                  name={s.completed ? 'check-circle' : 'radio-button-unchecked'}
                  size={22}
                  color={s.completed ? '#00B894' : '#AEAEB2'}
                />
              )}
            </Pressable>
          </View>
          {i === restAfterIndex && !restSkipped && (
            <RestBar onSkip={() => setRestSkipped(true)} />
          )}
        </View>
        );
      })}

      {/* Add / Remove Set */}
      <View style={styles.setActions}>
        <Pressable onPress={onAddSet} style={styles.addSetBtn} accessibilityRole="button" accessibilityLabel="Add a set">
          <MaterialIcons name="add" size={16} color="#00B894" />
          <Text style={styles.addSetText}>{t('workout.addSet')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

interface WorkoutSummary {
  exerciseCount: number;
  totalSets: number;
  completedSets: number;
  totalVolume: number;
  totalReps: number;
  highlights: { icon: keyof typeof MaterialIcons.glyphMap; text: string }[];
}

function buildHighlights(exercises: WorkoutExercise[], stats: Omit<WorkoutSummary, 'highlights'>, t: (key: string, opts?: Record<string, any>) => string): WorkoutSummary['highlights'] {
  const h: WorkoutSummary['highlights'] = [];

  // Only count exercises that were actually performed (have completed sets)
  const performed = exercises.filter((e) => e.sets.some((s) => s.completed));

  // Completion rate
  const pct = stats.totalSets > 0 ? stats.completedSets / stats.totalSets : 0;
  if (pct >= 1) {
    h.push({ icon: 'star', text: t('workout.highlightAllSets') });
  } else if (pct >= 0.8) {
    h.push({ icon: 'thumb-up', text: t('workout.highlightStrongEffort', { pct: Math.round(pct * 100) }) });
  } else if (pct >= 0.5) {
    h.push({ icon: 'trending-up', text: t('workout.highlightKeepPushing', { pct: Math.round(pct * 100) }) });
  }

  // Muscle variety — only from performed exercises
  const muscles = new Set<string>();
  performed.forEach((we) => {
    const ex = allExercises.find((e) => e.id === we.exerciseId);
    if (ex) muscles.add(ex.muscle);
  });
  if (muscles.size >= 3) {
    h.push({ icon: 'accessibility-new', text: t('workout.highlightMuscleGroups', { count: muscles.size }) });
  } else if (muscles.size >= 2) {
    h.push({ icon: 'accessibility-new', text: t('workout.highlightMuscleGroupsSimple', { count: muscles.size }) });
  }

  // Volume milestone
  if (stats.totalVolume >= 5000) {
    h.push({ icon: 'local-fire-department', text: t('workout.highlightVolumeImpressive', { volume: stats.totalVolume.toLocaleString() }) });
  } else if (stats.totalVolume >= 1000) {
    h.push({ icon: 'fitness-center', text: t('workout.highlightVolumeMoved', { volume: stats.totalVolume.toLocaleString() }) });
  }

  // Rep count
  if (stats.totalReps >= 100) {
    h.push({ icon: 'bolt', text: t('workout.highlightHighVolume', { count: stats.totalReps }) });
  } else if (stats.totalReps >= 50) {
    h.push({ icon: 'bolt', text: t('workout.highlightTotalReps', { count: stats.totalReps }) });
  }

  // Multiple exercises — only count performed
  if (performed.length >= 5) {
    h.push({ icon: 'format-list-numbered', text: t('workout.highlightFullWorkout', { count: performed.length }) });
  } else if (performed.length >= 3) {
    h.push({ icon: 'format-list-numbered', text: t('workout.highlightExercisesCompleted', { count: performed.length }) });
  }

  // Fallback
  if (h.length === 0) {
    h.push({ icon: 'check-circle', text: t('workout.highlightShowedUp') });
  }

  return h;
}

export default function WorkoutScreenWrapper() {
  return <ErrorBoundary><WorkoutScreen /></ErrorBoundary>;
}

function WorkoutScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { exercises, addExercise, updateSet, toggleSetComplete, addSet, removeSet, removeExercise, clearWorkout, loadWorkout, saveExerciseForNextWorkout } = useWorkoutStore();
  const saveWorkout = useHistoryStore((s) => s.saveWorkout);
  const workoutHistory = useHistoryStore((s) => s.workouts);
  const { plan, loadPlan } = usePlanStore();
  const { curveType, surgery, goal, experience } = useProfileStore();
  const { language } = useSettingsStore();
  const { isPremium } = usePremiumStore();
  const userId = useAuthStore((s) => s.userId);
  const nutritionEntries = useNutritionStore((s) => s.entries);
  const [pendingAdj, setPendingAdj] = useState<WorkoutAdjustment[]>([]);
  const [adjBanner, setAdjBanner] = useState(false);
  const adjBannerOpacity = useRef(new Animated.Value(0)).current;
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const [lastRecord, setLastRecord] = useState<WorkoutRecord | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'done' | 'error' | 'offline'>('idle');
  const { isOnline } = useNetwork();
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [actionedAdjIdx, setActionedAdjIdx] = useState<Set<number>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const workoutStartRef = useRef<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToastMsg(null));
  };

  const buildShareText = (): string => {
    if (!lastRecord) return '';
    const today = new Date().toDateString();
    const todayHydration = nutritionEntries
      .filter((e) => new Date(e.time).toDateString() === today)
      .reduce((s, e) => s + e.amount, 0);
    return generateShareText({
      record: lastRecord,
      curveType,
      surgery,
      experience,
      history: workoutHistory,
      hydrationMl: todayHydration,
      startTime: workoutStartRef.current || undefined,
    });
  };

  const handleShareText = async () => {
    const text = buildShareText();
    await shareWorkoutText(text);
  };

  const handleCopyText = () => {
    const text = buildShareText();
    copyWorkoutText(text);
    showToast(t('workout.copied'));
  };

  const previousWorkoutCount = workoutHistory.filter((w) => w.id !== lastRecord?.id).length;
  const needsMoreWorkouts = previousWorkoutCount < 2;

  const handleAIAnalysis = async () => {
    if (!lastRecord) return;

    if (!isOnline) {
      setAiState('offline');
      return;
    }

    // Check if already analyzed (rate limit: 1 per workout)
    const existing = await getAnalysis(lastRecord.id);
    if (existing) {
      setActionedAdjIdx(new Set());
      setAiResult(JSON.parse(existing.analysis));
      setAiState('done');
      return;
    }

    setAiState('loading');
    setAiResult(null);
    try {
      const today = new Date().toDateString();
      const todayHydration = nutritionEntries
        .filter((e) => new Date(e.time).toDateString() === today)
        .reduce((s, e) => s + e.amount, 0);
      const result = await runAIAnalysis({
        currentRecord: lastRecord,
        curveType,
        surgery,
        goal,
        experience,
        history: workoutHistory,
        hydrationMl: todayHydration,
        startTime: workoutStartRef.current || undefined,
        language,
      });
      setActionedAdjIdx(new Set());
      setAiResult(result);
      setAiState('done');
      trackEvent('ai_analysis_completed', { adjustmentCount: result.adjustments.length });
      // Persist analysis to SQLite (for rate limiting + re-view)
      await saveAnalysis(lastRecord.id, JSON.stringify(result));
      // Persist AI-suggested adjustments to local SQLite
      if (result.adjustments && result.adjustments.length > 0) {
        await saveAdjustments(lastRecord.id, result.adjustments);
      }
    } catch (err) {
      console.error('[AI Analysis] failed:', err instanceof Error ? err.message : String(err));
      setAiState('error');
      trackEvent('ai_analysis_failed');
    }
  };

  // Build a map of exerciseId -> last completed sets from history
  const lastSetsMap = useMemo(() => {
    const map = new Map<number, { weight: number; reps: number }[]>();
    for (const w of workoutHistory) {
      for (const ex of w.exercises) {
        if (!map.has(ex.exerciseId) && ex.sets.length > 0) {
          map.set(ex.exerciseId, ex.sets);
        }
      }
    }
    return map;
  }, [workoutHistory]);

  const getExSafety = useCallback((exerciseId: number) => {
    const ex = allExercises.find((e) => e.id === exerciseId);
    if (!ex) return { level: 'safe' as const, note: undefined, fusionNote: undefined };
    const level = getSafety(exerciseId, ex.safety, curveType, surgery);
    const hasSurgery = surgery !== 'none';
    // Translated mod note
    const modKey = `exerciseMods.${exerciseId}`;
    const rawMod = t(modKey) !== modKey ? t(modKey) : exerciseMods[exerciseId];
    const note = (level === 'modify' && rawMod) ? rawMod : undefined;
    // Translated fusion note
    const fusionKey = `exerciseFusionMods.${exerciseId}`;
    const rawFusion = t(fusionKey) !== fusionKey ? t(fusionKey) : exerciseFusionMods[exerciseId];
    const fusionNote = (hasSurgery && rawFusion) ? rawFusion : undefined;
    return { level, note, fusionNote };
  }, [curveType, surgery, t]);

  const loadHistory = useHistoryStore((s) => s.loadHistory);
  const loadNutrition = useNutritionStore((s) => s.loadNutrition);
  useEffect(() => { loadPlan(); loadHistory(); loadNutrition(); }, []);

  // Load workout + pending AI exercises whenever the tab gains focus with no active workout
  useFocusEffect(
    useCallback(() => {
      if (exercises.length === 0) {
        loadWorkout();
      }
    }, [exercises.length])
  );

  // Load pending AI adjustments
  useEffect(() => {
    if (userId) {
      getPendingAdjustments(userId).then(setPendingAdj).catch(() => {});
    }
  }, [userId]);

  const showAdjBanner = () => {
    setAdjBanner(true);
    Animated.sequence([
      Animated.timing(adjBannerOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(adjBannerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setAdjBanner(false));
  };

  const removeAdj = (id: string) => {
    const updated = pendingAdj.filter((a) => a.id !== id);
    setPendingAdj(updated);
    if (updated.length === 0) showAdjBanner();
  };

  const handleAcceptAdd = async (adj: WorkoutAdjustment) => {
    trackAIAdjustmentHandled('accepted', exerciseNames[adj.exercise_id] ?? `Exercise ${adj.exercise_id}`);
    // Parse suggested sets like "3×12" → 3 sets
    let numSets = 3;
    if (adj.suggested_sets) {
      const m = adj.suggested_sets.match(/^(\d+)/);
      if (m) numSets = parseInt(m[1], 10);
    }
    addExercise(adj.exercise_id, numSets);
    // Pre-fill weight if suggested
    if (adj.suggested_weight) {
      const store = useWorkoutStore.getState();
      const ex = store.exercises.find((e) => e.exerciseId === adj.exercise_id);
      if (ex) {
        for (let i = 0; i < ex.sets.length; i++) {
          updateSet(adj.exercise_id, i, 'weight', adj.suggested_weight);
        }
      }
    }
    await updateAdjustmentStatus(adj.id, 'accepted');
    removeAdj(adj.id);
  };

  const handleAcceptAdjust = async (adj: WorkoutAdjustment) => {
    trackAIAdjustmentHandled('accepted', exerciseNames[adj.exercise_id] ?? `Exercise ${adj.exercise_id}`);
    // Pre-fill the new suggested weight into all sets of the exercise
    if (adj.suggested_weight) {
      const ex = exercises.find((e) => e.exerciseId === adj.exercise_id);
      if (ex) {
        for (let i = 0; i < ex.sets.length; i++) {
          updateSet(adj.exercise_id, i, 'weight', adj.suggested_weight);
        }
      }
    }
    await updateAdjustmentStatus(adj.id, 'accepted');
    removeAdj(adj.id);
  };

  const handleAcceptRemove = async (adj: WorkoutAdjustment) => {
    trackAIAdjustmentHandled('accepted', exerciseNames[adj.exercise_id] ?? `Exercise ${adj.exercise_id}`);
    // Swap exercise: remove old, add replacement
    removeExercise(adj.exercise_id);
    if (adj.replace_with_id) {
      addExercise(adj.replace_with_id, 3);
    }
    await updateAdjustmentStatus(adj.id, 'accepted');
    removeAdj(adj.id);
  };

  const handleDismissAdj = async (adj: WorkoutAdjustment) => {
    trackAIAdjustmentHandled('rejected', exerciseNames[adj.exercise_id] ?? `Exercise ${adj.exercise_id}`);
    await updateAdjustmentStatus(adj.id, 'dismissed');
    removeAdj(adj.id);
  };

  // Keep screen awake only during an active workout session
  useEffect(() => {
    if (exercises.length > 0) {
      activateKeepAwakeAsync();
    } else {
      deactivateKeepAwake();
    }
    return () => {
      deactivateKeepAwake();
    };
  }, [exercises.length]);

  // Track workout start time
  useEffect(() => {
    if (exercises.length > 0 && !workoutStartRef.current) {
      workoutStartRef.current = new Date().toISOString();
    } else if (exercises.length === 0) {
      workoutStartRef.current = null;
    }
  }, [exercises.length]);

  const loadPlanExercises = () => {
    if (!plan) return;
    for (const pe of plan.exercises) {
      addExercise(pe.exerciseId, pe.sets);
    }
    trackWorkoutStarted({ source: 'plan', exercise_count: plan.exercises.length });
  };

  const handleCancelWorkout = () => {
    const minutesSpent = workoutStartRef.current
      ? Math.round((Date.now() - new Date(workoutStartRef.current).getTime()) / 60_000)
      : 0;
    trackWorkoutCancelled(minutesSpent);
    clearWorkout();
  };

  const totalSets = exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const completedSets = exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).length, 0);

  const handleFinish = () => {
    // Only count exercises that were actually performed
    const performed = exercises.filter((e) => e.sets.some((s) => s.completed));
    const base = {
      exerciseCount: performed.length,
      totalSets,
      completedSets,
      totalVolume: exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).reduce((v, s) => v + s.weight * s.reps, 0), 0),
      totalReps: exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).reduce((r, s) => r + s.reps, 0), 0),
    };
    const stats: WorkoutSummary = { ...base, highlights: buildHighlights(exercises, base, t) };

    // Save to history — only include exercises with completed sets
    const record: WorkoutRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      exercises: performed.map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets.filter((s) => s.completed).map((s) => ({ weight: s.weight, reps: s.reps })),
      })),
      totalSets: base.totalSets,
      completedSets: base.completedSets,
      totalVolume: base.totalVolume,
      totalReps: base.totalReps,
    };
    saveWorkout(record);
    setLastRecord(record);
    const durationMinutes = workoutStartRef.current
      ? Math.round((Date.now() - new Date(workoutStartRef.current).getTime()) / 60_000)
      : 0;
    trackWorkoutCompleted({
      total_volume: base.totalVolume,
      duration_minutes: durationMinutes,
      exercise_count: performed.length,
      completed_sets: base.completedSets,
    });

    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      setSummary(stats);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 2000);
  };

  const dismissSummary = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setSummary(null);
      setAiState('idle');
      setAiResult(null);
      clearWorkout();
      router.replace('/(tabs)/progress');
    });
  };

  if (exercises.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">{t('workout.title')}</Text>
        </View>
        {plan && plan.exercises.length > 0 ? (
          <ScrollView contentContainerStyle={styles.planPreview} showsVerticalScrollIndicator={false}>
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <MaterialIcons name="auto-awesome" size={22} color="#FF9500" />
                <Text style={styles.planTitle}>{t('workout.yourPlan')}</Text>
              </View>
              <Text style={styles.planSubtitle}>
                {t('workout.planSubtitle', { count: plan.exercises.length, curveType: plan.profile.curveType })}
              </Text>
              {plan.exercises.map((pe, i) => (
                <View key={pe.exerciseId} style={styles.planExRow}>
                  <Text style={styles.planExNum}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planExName}>{exerciseNames[pe.exerciseId] || `Exercise ${pe.exerciseId}`}</Text>
                    <Text style={styles.planExSets}>{t('workout.planSets', { count: pe.sets })}{pe.note ? ` · ${t(pe.note)}` : ''}</Text>
                  </View>
                  {pe.note && <MaterialIcons name="info-outline" size={14} color="#FF9500" />}
                </View>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [styles.startPlanBtn, pressed && { opacity: 0.85 }]}
              onPress={loadPlanExercises}
              accessibilityRole="button"
              accessibilityLabel="Start planned workout"
            >
              <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
              <Text style={styles.startPlanBtnText}>{t('workout.startWorkout')}</Text>
            </Pressable>
            <Pressable
              style={styles.browseLinkBtn}
              onPress={() => router.push('/(tabs)/exercises' as any)}
              accessibilityRole="button"
            >
              <Text style={styles.browseLinkText}>{t('workout.browseManualy')}</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <EmptyWorkout size={150} />
            <Text style={styles.emptyTitle}>{t('workout.noExercises')}</Text>
            <Text style={styles.emptyText}>{t('workout.noExercisesDesc')}</Text>
            <Pressable
              style={styles.browseBtn}
              onPress={() => router.push('/(tabs)/exercises' as any)}
              accessibilityRole="button"
              accessibilityLabel="Browse exercises"
            >
              <MaterialIcons name="search" size={18} color="#FFFFFF" />
              <Text style={styles.browseBtnText}>{t('workout.browseExercises')}</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title} accessibilityRole="header">{t('workout.title')}</Text>
          <Text style={styles.subtitle}>{t('workout.exercisesCount', { count: exercises.length, completed: completedSets, total: totalSets })}</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/exercises' as any)}
          style={styles.addMoreBtn}
          accessibilityRole="button"
          accessibilityLabel="Add more exercises"
        >
          <MaterialIcons name="add" size={20} color="#00B894" />
        </Pressable>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: totalSets > 0 ? `${(completedSets / totalSets) * 100}%` : '0%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* AI Adjustment Cards — 'add' type (top of list) */}
        {pendingAdj.filter((a) => a.type === 'add').map((adj) => (
          <View key={`adj-${adj.id}`} style={[styles.adjCard, styles.adjCardAdd]}>
            <View style={styles.adjBadgeRow}>
              <View style={[styles.adjBadge, { backgroundColor: '#00B894' }]}>
                <Text style={styles.adjBadgeText}>{t('workout.adjNew')}</Text>
              </View>
            </View>
            <Text style={styles.adjExName}>{exerciseNames[adj.exercise_id] || `Exercise ${adj.exercise_id}`}</Text>
            {adj.suggested_sets && <Text style={styles.adjDetail}>{t('workout.adjSets')}: {adj.suggested_sets}</Text>}
            {adj.suggested_weight != null && <Text style={styles.adjDetail}>{t('workout.adjWeight')}: {adj.suggested_weight} kg</Text>}
            <Text style={styles.adjReason}>{adj.reason}</Text>
            <View style={styles.adjActions}>
              <Pressable
                style={({ pressed }) => [styles.adjAcceptBtn, { backgroundColor: '#00B894' }, pressed && { opacity: 0.7 }]}
                onPress={() => handleAcceptAdd(adj)}
                accessibilityRole="button"
                accessibilityLabel={t('workout.adjAccept')}
              >
                <MaterialIcons name="check" size={16} color="#FFF" />
                <Text style={styles.adjAcceptText}>{t('workout.adjAccept')}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.adjDismissBtn, pressed && { opacity: 0.7 }]}
                onPress={() => handleDismissAdj(adj)}
                accessibilityRole="button"
                accessibilityLabel={t('workout.adjSkip')}
              >
                <MaterialIcons name="close" size={16} color="#8E8E93" />
                <Text style={styles.adjDismissText}>{t('workout.adjSkip')}</Text>
              </Pressable>
            </View>
          </View>
        ))}

        {/* Exercise Cards with inline adjust/remove adjustment cards */}
        {exercises.map((item) => {
          const s = getExSafety(item.exerciseId);
          const adjustAdj = pendingAdj.find((a) => a.type === 'adjust' && a.exercise_id === item.exerciseId);
          const removeAdj_ = pendingAdj.find((a) => a.type === 'remove' && a.exercise_id === item.exerciseId);

          if (removeAdj_) {
            return (
              <View key={item.exerciseId} style={[styles.adjCard, styles.adjCardRemove]}>
                <View style={styles.adjBadgeRow}>
                  <View style={[styles.adjBadge, { backgroundColor: '#FF3B30' }]}>
                    <Text style={styles.adjBadgeText}>{t('workout.adjReplace')}</Text>
                  </View>
                </View>
                <Text style={styles.adjExName}>{exerciseNames[item.exerciseId] || `Exercise ${item.exerciseId}`}</Text>
                {removeAdj_.replace_with_id != null && (
                  <Text style={styles.adjDetail}>→ {exerciseNames[removeAdj_.replace_with_id] || `Exercise ${removeAdj_.replace_with_id}`}</Text>
                )}
                <Text style={styles.adjReason}>{removeAdj_.reason}</Text>
                <View style={styles.adjActions}>
                  <Pressable
                    style={({ pressed }) => [styles.adjAcceptBtn, { backgroundColor: '#FF3B30' }, pressed && { opacity: 0.7 }]}
                    onPress={() => handleAcceptRemove(removeAdj_)}
                    accessibilityRole="button"
                    accessibilityLabel={t('workout.adjDoReplace')}
                  >
                    <MaterialIcons name="swap-horiz" size={16} color="#FFF" />
                    <Text style={styles.adjAcceptText}>{t('workout.adjDoReplace')}</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.adjDismissBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => handleDismissAdj(removeAdj_)}
                    accessibilityRole="button"
                    accessibilityLabel={t('workout.adjKeep')}
                  >
                    <Text style={styles.adjDismissText}>{t('workout.adjKeep')}</Text>
                  </Pressable>
                </View>
              </View>
            );
          }

          return (
            <View key={item.exerciseId}>
              {adjustAdj && (
                <View style={[styles.adjCard, styles.adjCardAdjust]}>
                  <View style={styles.adjBadgeRow}>
                    <View style={[styles.adjBadge, { backgroundColor: '#FF9500' }]}>
                      <Text style={styles.adjBadgeText}>{t('workout.adjAdjust')}</Text>
                    </View>
                  </View>
                  <Text style={styles.adjExName}>{exerciseNames[item.exerciseId] || `Exercise ${item.exerciseId}`}</Text>
                  {adjustAdj.suggested_weight != null && (
                    <Text style={styles.adjDetail}>{t('workout.adjWeight')}: {adjustAdj.suggested_weight} kg</Text>
                  )}
                  {adjustAdj.suggested_sets && (
                    <Text style={styles.adjDetail}>{t('workout.adjSets')}: {adjustAdj.suggested_sets}</Text>
                  )}
                  <Text style={styles.adjReason}>{adjustAdj.reason}</Text>
                  <View style={styles.adjActions}>
                    <Pressable
                      style={({ pressed }) => [styles.adjAcceptBtn, { backgroundColor: '#FF9500' }, pressed && { opacity: 0.7 }]}
                      onPress={() => handleAcceptAdjust(adjustAdj)}
                      accessibilityRole="button"
                      accessibilityLabel={t('workout.adjApply')}
                    >
                      <MaterialIcons name="check" size={16} color="#FFF" />
                      <Text style={styles.adjAcceptText}>{t('workout.adjApply')}</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [styles.adjDismissBtn, pressed && { opacity: 0.7 }]}
                      onPress={() => handleDismissAdj(adjustAdj)}
                      accessibilityRole="button"
                      accessibilityLabel={t('workout.adjKeepOriginal')}
                    >
                      <Text style={styles.adjDismissText}>{t('workout.adjKeepOriginal')}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
              <WorkoutExerciseCard
                item={item}
                safetyLevel={s.level}
                safetyNote={s.note}
                fusionNote={s.fusionNote}
                lastSets={lastSetsMap.get(item.exerciseId)}
                onUpdateSet={(si, f, v) => updateSet(item.exerciseId, si, f, v)}
                onToggleSet={(si) => toggleSetComplete(item.exerciseId, si)}
                onAddSet={() => addSet(item.exerciseId)}
                onRemoveSet={(si) => removeSet(item.exerciseId, si)}
                onRemoveExercise={() => removeExercise(item.exerciseId)}
              />
            </View>
          );
        })}

        {/* Finish / Clear */}
        <Pressable
          style={({ pressed }) => [styles.finishBtn, pressed && { opacity: 0.85 }]}
          onPress={handleFinish}
          accessibilityRole="button"
          accessibilityLabel="Finish workout"
        >
          <MaterialIcons name="check" size={20} color="#FFFFFF" />
          <Text style={styles.finishBtnText}>{t('workout.finish')}</Text>
        </Pressable>

        <Pressable
          style={styles.cancelBtn}
          onPress={handleCancelWorkout}
          accessibilityRole="button"
          accessibilityLabel="Cancel workout"
        >
          <Text style={styles.cancelBtnText}>{t('workout.cancelWorkout')}</Text>
        </Pressable>
      </ScrollView>

      {/* AI adjustments processed banner */}
      {adjBanner && (
        <Animated.View style={[styles.adjBannerContainer, { opacity: adjBannerOpacity }]}>
          <MaterialIcons name="check-circle" size={16} color="#00B894" />
          <Text style={styles.adjBannerText}>{t('ai.recommendationsApplied')}</Text>
        </Animated.View>
      )}

      {/* Confetti Overlay */}
      {showConfetti && (
        <View style={styles.confettiOverlay}>
          <Confetti size={300} />
          <Text style={styles.confettiText}>{t('workout.complete')} 🎉</Text>
        </View>
      )}

      {/* Workout Summary Overlay */}
      {summary && (
        <Animated.View style={[styles.summaryOverlay, { opacity: fadeAnim }]}>
          <View style={styles.summaryCard}>
            <ScrollView
              style={styles.summaryScroll}
              contentContainerStyle={styles.summaryScrollContent}
              showsVerticalScrollIndicator={false}
            >
            <View style={styles.summaryIconRing}>
              <MaterialIcons name="emoji-events" size={48} color="#FF9500" />
            </View>
            <Text style={styles.summaryTitle}>{t('workout.complete')}</Text>
            <Text style={styles.summarySubtitle}>{t('workout.greatJob')}</Text>

            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{summary.exerciseCount}</Text>
                <Text style={styles.summaryStatLabel}>{t('workout.exercisesLabel')}</Text>
              </View>
              <View style={styles.summaryStatDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{summary.completedSets}/{summary.totalSets}</Text>
                <Text style={styles.summaryStatLabel}>{t('workout.setsLabel')}</Text>
              </View>
              <View style={styles.summaryStatDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{summary.totalReps}</Text>
                <Text style={styles.summaryStatLabel}>{t('workout.repsLabel')}</Text>
              </View>
            </View>

            {summary.totalVolume > 0 && (
              <View style={styles.summaryVolumeRow}>
                <MaterialIcons name="fitness-center" size={16} color="#00B894" />
                <Text style={styles.summaryVolumeText}>
                  {t('workout.totalVolume', { volume: summary.totalVolume.toLocaleString() })}
                </Text>
              </View>
            )}

            {/* Highlights */}
            <View style={styles.highlightsContainer}>
              {summary.highlights.map((h, i) => (
                <View key={i} style={styles.highlightRow}>
                  <MaterialIcons name={h.icon} size={16} color="#FF9500" />
                  <Text style={styles.highlightText}>{h.text}</Text>
                </View>
              ))}
            </View>

            {/* Share + Copy row */}
            <View style={styles.shareRow}>
              <Pressable
                style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.7 }]}
                onPress={handleShareText}
                accessibilityRole="button"
                accessibilityLabel={t('workout.share')}
              >
                <MaterialIcons name="share" size={18} color="#FFFFFF" />
                <Text style={styles.shareBtnText}>{t('workout.share')}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.7 }]}
                onPress={handleCopyText}
                accessibilityRole="button"
                accessibilityLabel={t('workout.copy')}
              >
                <MaterialIcons name="content-copy" size={18} color="#00B894" />
                <Text style={styles.copyBtnText}>{t('workout.copy')}</Text>
              </Pressable>
            </View>

            {/* AI Analysis Card */}
            <View style={styles.aiCard}>
              {!isPremium ? (
                <>
                  <Crown size={50} />
                  <View style={styles.aiCardHeader}>
                    <MaterialIcons name="auto-awesome" size={20} color="#FF9500" />
                    <Text style={styles.aiCardTitle}>{t('workout.aiAnalysisTitle')}</Text>
                  </View>
                  <Text style={styles.aiCardDesc}>{t('workout.aiAnalysisDesc')}</Text>
                  <Pressable
                    style={({ pressed }) => [styles.aiPremiumBtn, pressed && { opacity: 0.7 }]}
                    onPress={() => router.push('/premium' as any)}
                    accessibilityRole="button"
                  >
                    <MaterialIcons name="workspace-premium" size={18} color="#FFFFFF" />
                    <Text style={styles.aiPremiumBtnText}>{t('workout.aiAnalysisUnlockPremium')}</Text>
                  </Pressable>
                </>
              ) : needsMoreWorkouts ? (
                <>
                  <View style={styles.aiCardHeader}>
                    <MaterialIcons name="auto-awesome" size={20} color="#FF9500" />
                    <Text style={styles.aiCardTitle}>{t('workout.aiAnalysisTitle')}</Text>
                  </View>
                  <Text style={styles.aiCardDesc}>{t('ai.needMoreWorkouts')}</Text>
                </>
              ) : aiState === 'offline' ? (
                <>
                  <View style={styles.aiCardHeader}>
                    <MaterialIcons name="cloud-off" size={20} color="#8E8E93" />
                    <Text style={[styles.aiCardTitle, { color: '#8E8E93' }]}>{t('offline.banner')}</Text>
                  </View>
                  <Text style={styles.aiCardDesc}>{t('offline.aiUnavailable')}</Text>
                  <Pressable
                    style={[styles.aiStartBtn, { backgroundColor: '#C7C7CC', opacity: 0.7 }]}
                    disabled
                    accessibilityRole="button"
                  >
                    <MaterialIcons name="cloud-off" size={18} color="#FFFFFF" />
                  </Pressable>
                </>
              ) : aiState === 'idle' ? (
                <>
                  <View style={styles.aiCardHeader}>
                    <MaterialIcons name="auto-awesome" size={20} color="#FF9500" />
                    <Text style={styles.aiCardTitle}>{t('workout.aiAnalysisTitle')}</Text>
                  </View>
                  <Text style={styles.aiCardDesc}>{t('workout.aiAnalysisDesc')}</Text>
                  <Pressable
                    style={({ pressed }) => [styles.aiStartBtn, pressed && { opacity: 0.7 }]}
                    onPress={handleAIAnalysis}
                    accessibilityRole="button"
                  >
                    <MaterialIcons name="smart-toy" size={18} color="#FFFFFF" />
                    <Text style={styles.aiStartBtnText}>{t('ai.analyzeButton')}</Text>
                  </Pressable>
                </>
              ) : aiState === 'loading' ? (
                <View style={styles.aiLoadingContainer}>
                  <LoadingSpinner size={80} />
                  <Text style={styles.aiLoadingText}>{t('ai.analyzing')}</Text>
                </View>
              ) : aiState === 'error' ? (
                <>
                  <View style={styles.aiCardHeader}>
                    <MaterialIcons name="error-outline" size={20} color="#FF3B30" />
                    <Text style={[styles.aiCardTitle, { color: '#FF3B30' }]}>{t('workout.aiAnalysisError')}</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.aiStartBtn, pressed && { opacity: 0.7 }]}
                    onPress={handleAIAnalysis}
                    accessibilityRole="button"
                  >
                    <MaterialIcons name="refresh" size={18} color="#FFFFFF" />
                    <Text style={styles.aiStartBtnText}>{t('ai.analyzeButton')}</Text>
                  </Pressable>
                </>
              ) : aiResult ? (
                <>
                  <View style={styles.aiCardHeader}>
                    <MaterialIcons name="auto-awesome" size={20} color="#FF9500" />
                    <Text style={styles.aiCardTitle}>{t('ai.alreadyAnalyzed')}</Text>
                  </View>
                  {aiResult.analysisText.split('\n').map((line: string, i: number) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <View key={i} style={{ height: 6 }} />;
                    let color = '#1C1C1E';
                    if (trimmed.startsWith('\u2705')) color = '#00B894';
                    else if (trimmed.startsWith('\u26A0') || trimmed.startsWith('\u26A0\uFE0F')) color = '#FF9500';
                    else if (trimmed.startsWith('\uD83D\uDCA1')) color = '#00B894';
                    else if (trimmed.startsWith('\uD83D\uDCCA')) color = '#1C1C1E';
                    return <Text key={i} style={[styles.aiLineText, { color }]}>{trimmed}</Text>;
                  })}
                  {aiResult.adjustments.length > 0 && (
                    <View style={styles.adjCardsContainer}>
                      {aiResult.adjustments.map((adj, idx) => {
                        const isActioned = actionedAdjIdx.has(idx);
                        const exName = exerciseNames[adj.exercise_id] || `Übung #${adj.exercise_id}`;
                        const replName = adj.replace_with_id != null
                          ? (exerciseNames[adj.replace_with_id] || `Übung #${adj.replace_with_id}`)
                          : null;
                        const numSets = (() => {
                          if (!adj.suggested_sets) return 3;
                          const n = parseInt(adj.suggested_sets.split('x')[0], 10);
                          return isNaN(n) ? 3 : n;
                        })();

                        // SAFETY: Hard filter — never show 'avoid' exercises regardless of AI output
                        if (adj.type === 'add' && !isExerciseAllowed(adj.exercise_id, curveType, surgery)) {
                          return null;
                        }
                        if (adj.type === 'remove' && adj.replace_with_id != null && !isExerciseAllowed(adj.replace_with_id, curveType, surgery)) {
                          return null;
                        }

                        const addSafetyLevel = adj.type === 'add'
                          ? getExerciseSafetyLevel(adj.exercise_id, curveType, surgery)
                          : null;
                        const addModNote = addSafetyLevel === 'modify' ? (exerciseMods[adj.exercise_id] || 'Modifizierte Form erforderlich — Übungsdetails beachten.') : null;

                        if (adj.type === 'add') {
                          return (
                            <View key={idx} style={[styles.adjCard, styles.adjCardAdd]}>
                              <View style={styles.adjBadgeRow}>
                                <View style={[styles.adjBadge, styles.adjBadgeGreen]}>
                                  <Text style={styles.adjBadgeText}>{t('adjustments.new')}</Text>
                                </View>
                                <Text style={styles.adjCardExName} numberOfLines={1}>{exName}</Text>
                              </View>
                              {addModNote && (
                                <View style={styles.adjModWarning}>
                                  <MaterialIcons name="warning" size={13} color="#FF9500" />
                                  <Text style={styles.adjModWarningText}>{addModNote}</Text>
                                </View>
                              )}
                              <Text style={styles.adjCardReason}>{adj.reason}</Text>
                              {(adj.suggested_sets || adj.suggested_weight) && (
                                <Text style={styles.adjCardMeta}>
                                  {adj.suggested_sets ? `Sets: ${adj.suggested_sets}` : ''}
                                  {adj.suggested_sets && adj.suggested_weight ? '  ·  ' : ''}
                                  {adj.suggested_weight ? `Gewicht: ${adj.suggested_weight}kg` : ''}
                                </Text>
                              )}
                              <Pressable
                                style={[styles.adjBtn, isActioned ? styles.adjBtnApplied : styles.adjBtnGreen]}
                                disabled={isActioned}
                                accessibilityLabel={t('adjustments.addToWorkout')}
                                accessibilityRole="button"
                                onPress={() => {
                                  saveExerciseForNextWorkout(adj.exercise_id, numSets, adj.suggested_weight ?? undefined);
                                  setActionedAdjIdx(prev => new Set([...prev, idx]));
                                  showToast(t('adjustments.added'));
                                }}
                              >
                                <Text style={[styles.adjBtnText, isActioned && styles.adjBtnAppliedText]}>
                                  {isActioned ? t('adjustments.added') : t('adjustments.addToWorkout')}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        }

                        if (adj.type === 'adjust') {
                          return (
                            <View key={idx} style={[styles.adjCard, styles.adjCardAdjust]}>
                              <View style={styles.adjBadgeRow}>
                                <View style={[styles.adjBadge, styles.adjBadgeOrange]}>
                                  <Text style={styles.adjBadgeText}>{t('adjustments.adjust')}</Text>
                                </View>
                                <Text style={styles.adjCardExName} numberOfLines={1}>{exName}</Text>
                              </View>
                              {adj.suggested_weight && (
                                <Text style={styles.adjCardChange}>Gewicht → {adj.suggested_weight}kg</Text>
                              )}
                              <Text style={styles.adjCardReason}>{adj.reason}</Text>
                              <Pressable
                                style={[styles.adjBtn, isActioned ? styles.adjBtnApplied : styles.adjBtnOrange]}
                                disabled={isActioned}
                                accessibilityLabel={t('adjustments.apply')}
                                accessibilityRole="button"
                                onPress={() => {
                                  const exInWorkout = exercises.find(e => e.exerciseId === adj.exercise_id);
                                  if (exInWorkout && adj.suggested_weight) {
                                    exInWorkout.sets.forEach((_, i) => {
                                      updateSet(adj.exercise_id, i, 'weight', adj.suggested_weight!);
                                    });
                                  }
                                  setActionedAdjIdx(prev => new Set([...prev, idx]));
                                  showToast(t('adjustments.added'));
                                }}
                              >
                                <Text style={[styles.adjBtnText, isActioned && styles.adjBtnAppliedText]}>
                                  {isActioned ? t('adjustments.added') : t('adjustments.apply')}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        }

                        if (adj.type === 'remove') {
                          return (
                            <View key={idx} style={[styles.adjCard, styles.adjCardRemove]}>
                              <View style={styles.adjBadgeRow}>
                                <View style={[styles.adjBadge, styles.adjBadgeRed]}>
                                  <Text style={styles.adjBadgeText}>{t('adjustments.replace')}</Text>
                                </View>
                                <Text style={styles.adjCardExName} numberOfLines={1}>
                                  {exName}{replName ? ` → ${replName}` : ''}
                                </Text>
                              </View>
                              <Text style={styles.adjCardReason}>{adj.reason}</Text>
                              <Pressable
                                style={[styles.adjBtn, isActioned ? styles.adjBtnApplied : styles.adjBtnRedOutline]}
                                disabled={isActioned}
                                accessibilityLabel={t('adjustments.replaceButton')}
                                accessibilityRole="button"
                                onPress={() => {
                                  removeExercise(adj.exercise_id);
                                  if (adj.replace_with_id != null) {
                                    addExercise(adj.replace_with_id, 3);
                                  }
                                  setActionedAdjIdx(prev => new Set([...prev, idx]));
                                  showToast(t('adjustments.added'));
                                }}
                              >
                                <Text style={[styles.adjBtnRedText, isActioned && styles.adjBtnAppliedText]}>
                                  {isActioned ? t('adjustments.added') : t('adjustments.replaceButton')}
                                </Text>
                              </Pressable>
                            </View>
                          );
                        }

                        return null;
                      })}
                    </View>
                  )}
                  <Text style={styles.aiDisclaimer}>{t('workout.aiDisclaimer')}</Text>
                </>
              ) : null}
            </View>
            </ScrollView>
            <Pressable
              style={({ pressed }) => [styles.summaryDoneBtn, pressed && { opacity: 0.85 }]}
              onPress={dismissSummary}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.summaryDoneBtnText}>{t('common.done')}</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Toast */}
      {toastMsg && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
          <MaterialIcons name="check-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#1C1C1E' },
  subtitle: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  addMoreBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 24,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#00B894',
    borderRadius: 2,
  },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },

  // Rest Bar
  restBar: {
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
  },
  restBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  restBarLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  restBarTime: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#3C3C43',
    fontVariant: ['tabular-nums'],
  },
  restBarTarget: {
    textDecorationLine: 'underline',
    color: '#8E8E93',
  },
  restBarInput: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    width: 40,
    textAlign: 'center',
  },
  restBarSkip: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  restBarTrack: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  restBarFill: {
    height: 6,
    borderRadius: 3,
  },

  // Exercise Card
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  exerciseMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },

  tipToggleBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FFF8F0', justifyContent: 'center', alignItems: 'center', marginRight: 6,
  },
  tipBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#FFF8F0', borderRadius: 8, padding: 10, marginBottom: 10,
  },
  tipBannerText: { flex: 1, fontSize: 12, fontWeight: '500', color: '#8B6914', lineHeight: 17 },

  lastWorkoutRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 4, paddingHorizontal: 2, marginBottom: 4,
  },
  lastWorkoutText: { fontSize: 11, fontWeight: '500', color: '#AEAEB2' },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0EF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Set rows
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  setRowDone: { opacity: 0.6 },
  setHeader: { fontSize: 11, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase' },
  setNumber: { width: 36, fontSize: 14, fontWeight: '600', color: '#1C1C1E', textAlign: 'center' },
  setTextDone: { color: '#8E8E93' },
  setInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    minHeight: 40,
  },
  setInputDone: { backgroundColor: '#E8FAF5', color: '#8E8E93' },
  checkBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnDone: {},

  setActions: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0FDF9',
    minHeight: 36,
  },
  addSetText: { fontSize: 13, fontWeight: '600', color: '#00B894' },

  // Bottom buttons
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B894',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
    minHeight: 52,
  },
  finishBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    minHeight: 48,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '500', color: '#FF3B30' },

  // Empty state
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginTop: 8, lineHeight: 20, maxWidth: 260 },
  browseBtn: {
    flexDirection: 'row',
    backgroundColor: '#00B894',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    minHeight: 48,
  },
  browseBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  // Summary Overlay
  summaryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    padding: 24,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingBottom: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    maxHeight: Dimensions.get('window').height * 0.88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  summaryIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00B894',
  },
  summaryStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  summaryStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E5EA',
  },
  summaryVolumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8FAF5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
    marginBottom: 20,
  },
  summaryVolumeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#009B7D',
  },
  shareRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 10,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00B894',
    borderRadius: 14,
    paddingVertical: 12,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#00B894',
    borderRadius: 14,
    paddingVertical: 12,
  },
  copyBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00B894',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    zIndex: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aiCard: {
    width: '100%',
    backgroundColor: '#FFF8F0',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  aiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  aiCardDesc: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 12,
  },
  aiPremiumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingVertical: 10,
  },
  aiPremiumBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00B894',
    borderRadius: 12,
    paddingVertical: 10,
  },
  aiStartBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  aiLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  aiLoadingText: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  aiLineText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 2,
  },
  aiRecommendationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  aiRecommendationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#00B894',
  },
  aiDisclaimer: {
    fontSize: 11,
    color: '#AEAEB2',
    lineHeight: 15,
    marginTop: 10,
  },

  summaryDoneBtn: {
    backgroundColor: '#00B894',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    minHeight: 52,
  },
  summaryDoneBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  highlightsContainer: {
    width: '100%',
    marginBottom: 20,
    gap: 8,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3C43',
    lineHeight: 18,
  },

  // Safety banner
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  safetyBannerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: '#CC7700',
    lineHeight: 15,
  },
  fusionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  fusionBannerText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '500',
    color: '#CC2920',
    lineHeight: 15,
  },

  // Plan preview
  planPreview: { paddingHorizontal: 16, paddingBottom: 100 },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  planTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E' },
  planSubtitle: { fontSize: 13, color: '#8E8E93', marginBottom: 16 },
  planExRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  planExNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8FAF5',
    color: '#00B894',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
  },
  planExName: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  planExSets: { fontSize: 11, color: '#8E8E93', marginTop: 1 },
  startPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B894',
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    minHeight: 52,
    marginBottom: 12,
  },
  startPlanBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  browseLinkBtn: { alignItems: 'center', paddingVertical: 8 },
  browseLinkText: { fontSize: 13, color: '#8E8E93', textDecorationLine: 'underline' },

  guideBanner: {
    backgroundColor: '#E8FAF5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#00B894',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guideStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  guideStepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  guideStepNumText: {
    fontSize: 11,
    fontWeight: '800',
  },
  guideStepText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
    lineHeight: 18,
  },

  // AI Adjustment cards
  adjCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  adjCardAdd: {
    backgroundColor: '#E8FAF5',
    borderLeftColor: '#00B894',
  },
  adjCardAdjust: {
    backgroundColor: '#FFF3E0',
    borderLeftColor: '#FF9500',
    marginBottom: 4,
  },
  adjCardRemove: {
    backgroundColor: '#FFF0EF',
    borderLeftColor: '#FF3B30',
  },
  adjBadgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  adjBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  adjBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  adjExName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  adjDetail: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 2,
  },
  adjReason: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 17,
    marginBottom: 10,
  },
  adjActions: {
    flexDirection: 'row',
    gap: 8,
  },
  adjAcceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 48,
    flex: 1,
  },
  adjAcceptText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adjDismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 48,
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  adjDismissText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
  },
  adjBannerContainer: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8FAF5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adjBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
  },

  confettiOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  confettiText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 16,
  },
  summaryScroll: {
    width: '100%',
  },
  summaryScrollContent: {
    padding: 32,
    paddingBottom: 16,
    alignItems: 'center',
    width: '100%',
  },
  aiScrollContainer: {
    maxHeight: Dimensions.get('window').height * 0.6,
    position: 'relative',
  },
  aiScrollView: {
    flexGrow: 0,
  },
  aiScrollFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  adjCardsContainer: {
    width: '100%',
    marginTop: 12,
    gap: 10,
  },
  adjBadgeGreen: { backgroundColor: '#00B894' },
  adjBadgeOrange: { backgroundColor: '#FF9500' },
  adjBadgeRed: { backgroundColor: '#FF3B30' },
  adjCardExName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
  },
  adjCardReason: {
    fontSize: 12,
    color: '#636366',
    lineHeight: 17,
    marginBottom: 6,
  },
  adjCardChange: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9500',
    marginBottom: 4,
  },
  adjCardMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 6,
  },
  adjBtn: {
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  adjBtnGreen: { backgroundColor: '#00B894' },
  adjBtnOrange: { backgroundColor: '#FF9500' },
  adjBtnRedOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FF3B30',
  },
  adjBtnApplied: {
    backgroundColor: '#F2F2F7',
  },
  adjBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  adjBtnRedText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  adjBtnAppliedText: {
    color: '#8E8E93',
  },
  adjModWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  adjModWarningText: {
    fontSize: 11,
    color: '#E65100',
    lineHeight: 16,
    flex: 1,
    fontWeight: '600',
  },
});
