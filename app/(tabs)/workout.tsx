import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useWorkoutStore, WorkoutExercise } from '../../stores/workoutStore';
import { useHistoryStore } from '../../stores/historyStore';
import { usePlanStore } from '../../stores/planStore';
import { useProfileStore } from '../../stores/settingsStore';
import { getSafety } from '../../lib/safety';
import { exercises as allExercises, exerciseNames, exerciseMods, exerciseFusionMods } from '../../data/exercises';

function RestBar({ onSkip }: { onSkip?: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const [target, setTarget] = useState(90);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('90');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const progress = Math.min(elapsed / target, 1);
  const done = elapsed >= target;
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
          {done ? 'Rest complete' : 'Resting...'}
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
            <Text style={styles.restBarSkip}>Skip</Text>
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
  onUpdateSet: (setIndex: number, field: 'weight' | 'reps', value: number) => void;
  onToggleSet: (setIndex: number) => void;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
  onRemoveExercise: () => void;
}

function WorkoutExerciseCard({ item, safetyLevel, safetyNote, onUpdateSet, onToggleSet, onAddSet, onRemoveSet, onRemoveExercise }: WorkoutExerciseCardProps) {
  const exercise = allExercises.find((e) => e.id === item.exerciseId);
  const name = exerciseNames[item.exerciseId] || `Exercise ${item.exerciseId}`;
  const completedSets = item.sets.filter((s) => s.completed).length;

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
      {/* Safety Warning */}
      {safetyLevel === 'modify' && safetyNote && (
        <View style={styles.safetyBanner}>
          <MaterialIcons name="warning" size={14} color="#CC7700" />
          <Text style={styles.safetyBannerText} numberOfLines={2}>{safetyNote}</Text>
        </View>
      )}

      {/* Exercise Header */}
      <View style={styles.exerciseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{name}</Text>
          <Text style={styles.exerciseMeta}>
            {exercise?.muscle} · {completedSets}/{item.sets.length} sets done
          </Text>
        </View>
        <Pressable
          onPress={onRemoveExercise}
          style={styles.removeBtn}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${name} from workout`}
        >
          <MaterialIcons name="close" size={18} color="#FF3B30" />
        </Pressable>
      </View>

      {/* Set Headers */}
      <View style={styles.setRow}>
        <Text style={[styles.setHeader, { width: 36 }]}>Set</Text>
        <Text style={[styles.setHeader, { flex: 1 }]}>Weight (kg)</Text>
        <Text style={[styles.setHeader, { flex: 1 }]}>Reps</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Sets */}
      {item.sets.map((s, i) => (
        <View key={i}>
          <View style={[styles.setRow, s.completed && styles.setRowDone]}>
            <Text style={[styles.setNumber, s.completed && styles.setTextDone]}>{i + 1}</Text>
            <TextInput
              style={[styles.setInput, s.completed && styles.setInputDone]}
              value={s.weight > 0 ? String(s.weight) : ''}
              onChangeText={(t) => onUpdateSet(i, 'weight', Number(t) || 0)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#AEAEB2"
              editable={!s.completed}
              accessibilityLabel={`Set ${i + 1} weight`}
            />
            <TextInput
              style={[styles.setInput, s.completed && styles.setInputDone]}
              value={s.reps > 0 ? String(s.reps) : ''}
              onChangeText={(t) => onUpdateSet(i, 'reps', Number(t) || 0)}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#AEAEB2"
              editable={!s.completed}
              accessibilityLabel={`Set ${i + 1} reps`}
            />
            <Pressable
              onPress={() => onToggleSet(i)}
              style={[styles.checkBtn, s.completed && styles.checkBtnDone]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: s.completed }}
              accessibilityLabel={`Mark set ${i + 1} as ${s.completed ? 'incomplete' : 'complete'}`}
            >
              <MaterialIcons
                name={s.completed ? 'check-circle' : 'radio-button-unchecked'}
                size={22}
                color={s.completed ? '#00B894' : '#AEAEB2'}
              />
            </Pressable>
          </View>
          {i === restAfterIndex && !restSkipped && (
            <RestBar onSkip={() => setRestSkipped(true)} />
          )}
        </View>
      ))}

      {/* Add / Remove Set */}
      <View style={styles.setActions}>
        <Pressable onPress={onAddSet} style={styles.addSetBtn} accessibilityRole="button" accessibilityLabel="Add a set">
          <MaterialIcons name="add" size={16} color="#00B894" />
          <Text style={styles.addSetText}>Add Set</Text>
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

function buildHighlights(exercises: WorkoutExercise[], stats: Omit<WorkoutSummary, 'highlights'>): WorkoutSummary['highlights'] {
  const h: WorkoutSummary['highlights'] = [];

  // Completion rate
  const pct = stats.totalSets > 0 ? stats.completedSets / stats.totalSets : 0;
  if (pct >= 1) {
    h.push({ icon: 'star', text: 'All sets completed — perfect session!' });
  } else if (pct >= 0.8) {
    h.push({ icon: 'thumb-up', text: `${Math.round(pct * 100)}% of sets completed — strong effort!` });
  } else if (pct >= 0.5) {
    h.push({ icon: 'trending-up', text: `${Math.round(pct * 100)}% of sets done — keep pushing!` });
  }

  // Muscle variety
  const muscles = new Set<string>();
  exercises.forEach((we) => {
    const ex = allExercises.find((e) => e.id === we.exerciseId);
    if (ex) muscles.add(ex.muscle);
  });
  if (muscles.size >= 3) {
    h.push({ icon: 'accessibility-new', text: `${muscles.size} muscle groups trained — great variety!` });
  } else if (muscles.size >= 2) {
    h.push({ icon: 'accessibility-new', text: `${muscles.size} muscle groups trained` });
  }

  // Volume milestone
  if (stats.totalVolume >= 5000) {
    h.push({ icon: 'local-fire-department', text: `${stats.totalVolume.toLocaleString()} kg total volume — impressive!` });
  } else if (stats.totalVolume >= 1000) {
    h.push({ icon: 'fitness-center', text: `${stats.totalVolume.toLocaleString()} kg total volume moved` });
  }

  // Rep count
  if (stats.totalReps >= 100) {
    h.push({ icon: 'bolt', text: `${stats.totalReps} reps — high volume work!` });
  } else if (stats.totalReps >= 50) {
    h.push({ icon: 'bolt', text: `${stats.totalReps} total reps completed` });
  }

  // Multiple exercises
  if (stats.exerciseCount >= 5) {
    h.push({ icon: 'format-list-numbered', text: `${stats.exerciseCount} exercises — full workout!` });
  }

  // Fallback
  if (h.length === 0) {
    h.push({ icon: 'check-circle', text: 'You showed up and put in the work!' });
  }

  return h;
}

export default function WorkoutScreen() {
  const router = useRouter();
  const { exercises, addExercise, updateSet, toggleSetComplete, addSet, removeSet, removeExercise, clearWorkout, loadWorkout } = useWorkoutStore();
  const saveWorkout = useHistoryStore((s) => s.saveWorkout);
  const { plan, loadPlan } = usePlanStore();
  const { curveType, surgery } = useProfileStore();
  const [summary, setSummary] = useState<WorkoutSummary | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const getExSafety = useCallback((exerciseId: number) => {
    const ex = allExercises.find((e) => e.id === exerciseId);
    if (!ex) return { level: 'safe' as const, note: undefined };
    const level = getSafety(exerciseId, ex.safety, curveType, surgery);
    const hasSurgery = surgery !== 'none';
    let note: string | undefined;
    if (hasSurgery && exerciseFusionMods[exerciseId]) note = exerciseFusionMods[exerciseId];
    else if (level === 'modify' && exerciseMods[exerciseId]) note = exerciseMods[exerciseId];
    return { level, note };
  }, [curveType, surgery]);

  useEffect(() => { loadWorkout(); loadPlan(); }, []);

  const loadPlanExercises = () => {
    if (!plan) return;
    for (const pe of plan.exercises) {
      addExercise(pe.exerciseId, pe.sets);
    }
  };

  const totalSets = exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const completedSets = exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).length, 0);

  const handleFinish = () => {
    const base = {
      exerciseCount: exercises.length,
      totalSets,
      completedSets,
      totalVolume: exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).reduce((v, s) => v + s.weight * s.reps, 0), 0),
      totalReps: exercises.reduce((sum, e) => sum + e.sets.filter((s) => s.completed).reduce((r, s) => r + s.reps, 0), 0),
    };
    const stats: WorkoutSummary = { ...base, highlights: buildHighlights(exercises, base) };

    // Save to history
    saveWorkout({
      id: Date.now().toString(),
      date: new Date().toISOString(),
      exercises: exercises.map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets.filter((s) => s.completed).map((s) => ({ weight: s.weight, reps: s.reps })),
      })),
      totalSets: base.totalSets,
      completedSets: base.completedSets,
      totalVolume: base.totalVolume,
      totalReps: base.totalReps,
    });

    setSummary(stats);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  const dismissSummary = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setSummary(null);
      clearWorkout();
    });
  };

  if (exercises.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">Workout</Text>
        </View>
        {plan && plan.exercises.length > 0 ? (
          <ScrollView contentContainerStyle={styles.planPreview} showsVerticalScrollIndicator={false}>
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <MaterialIcons name="auto-awesome" size={22} color="#FF9500" />
                <Text style={styles.planTitle}>Your Workout Plan</Text>
              </View>
              <Text style={styles.planSubtitle}>
                {plan.exercises.length} exercises tailored for your {plan.profile.curveType} scoliosis
              </Text>
              {plan.exercises.map((pe, i) => (
                <View key={pe.exerciseId} style={styles.planExRow}>
                  <Text style={styles.planExNum}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planExName}>{exerciseNames[pe.exerciseId] || `Exercise ${pe.exerciseId}`}</Text>
                    <Text style={styles.planExSets}>{pe.sets} sets{pe.note ? ` · ${pe.note}` : ''}</Text>
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
              <Text style={styles.startPlanBtnText}>Start Workout</Text>
            </Pressable>
            <Pressable
              style={styles.browseLinkBtn}
              onPress={() => router.push('/(tabs)/exercises' as any)}
              accessibilityRole="button"
            >
              <Text style={styles.browseLinkText}>Or browse exercises manually</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <MaterialIcons name="fitness-center" size={56} color="#E5E5EA" />
            <Text style={styles.emptyTitle}>No exercises yet</Text>
            <Text style={styles.emptyText}>Add exercises from the library to start your workout</Text>
            <Pressable
              style={styles.browseBtn}
              onPress={() => router.push('/(tabs)/exercises' as any)}
              accessibilityRole="button"
              accessibilityLabel="Browse exercises"
            >
              <MaterialIcons name="search" size={18} color="#FFFFFF" />
              <Text style={styles.browseBtnText}>Browse Exercises</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title} accessibilityRole="header">Workout</Text>
          <Text style={styles.subtitle}>{exercises.length} exercises · {completedSets}/{totalSets} sets</Text>
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Exercise Cards */}
        {exercises.map((item) => {
          const s = getExSafety(item.exerciseId);
          return (
            <WorkoutExerciseCard
              key={item.exerciseId}
              item={item}
              safetyLevel={s.level}
              safetyNote={s.note}
              onUpdateSet={(si, f, v) => updateSet(item.exerciseId, si, f, v)}
              onToggleSet={(si) => toggleSetComplete(item.exerciseId, si)}
              onAddSet={() => addSet(item.exerciseId)}
              onRemoveSet={(si) => removeSet(item.exerciseId, si)}
              onRemoveExercise={() => removeExercise(item.exerciseId)}
            />
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
          <Text style={styles.finishBtnText}>Finish Workout</Text>
        </Pressable>

        <Pressable
          style={styles.cancelBtn}
          onPress={clearWorkout}
          accessibilityRole="button"
          accessibilityLabel="Cancel workout"
        >
          <Text style={styles.cancelBtnText}>Cancel Workout</Text>
        </Pressable>
      </ScrollView>

      {/* Workout Summary Overlay */}
      {summary && (
        <Animated.View style={[styles.summaryOverlay, { opacity: fadeAnim }]}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconRing}>
              <MaterialIcons name="emoji-events" size={48} color="#FF9500" />
            </View>
            <Text style={styles.summaryTitle}>Workout Complete</Text>
            <Text style={styles.summarySubtitle}>Great job! Here is your summary:</Text>

            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{summary.exerciseCount}</Text>
                <Text style={styles.summaryStatLabel}>Exercises</Text>
              </View>
              <View style={styles.summaryStatDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{summary.completedSets}/{summary.totalSets}</Text>
                <Text style={styles.summaryStatLabel}>Sets</Text>
              </View>
              <View style={styles.summaryStatDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{summary.totalReps}</Text>
                <Text style={styles.summaryStatLabel}>Reps</Text>
              </View>
            </View>

            {summary.totalVolume > 0 && (
              <View style={styles.summaryVolumeRow}>
                <MaterialIcons name="fitness-center" size={16} color="#00B894" />
                <Text style={styles.summaryVolumeText}>
                  Total Volume: {summary.totalVolume.toLocaleString()} kg
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

            <Pressable
              style={({ pressed }) => [styles.summaryDoneBtn, pressed && { opacity: 0.85 }]}
              onPress={dismissSummary}
              accessibilityRole="button"
              accessibilityLabel="Done"
            >
              <Text style={styles.summaryDoneBtnText}>Done</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
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
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
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
});
