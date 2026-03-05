import { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useHistoryStore, WorkoutRecord } from '../../stores/historyStore';
import { useProfileStore } from '../../stores/settingsStore';
import { exercises as allExercises, exerciseNames } from '../../data/exercises';
import type { CurveType, GoalType } from '../../types';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function StatCard({ icon, value, label, color }: { icon: keyof typeof MaterialIcons.glyphMap; value: string; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <MaterialIcons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface CalendarProps {
  workoutDays: Map<string, WorkoutRecord[]>;
  selectedDate: string | null;
  onSelectDate: (key: string) => void;
}

function TrainingCalendar({ workoutDays, selectedDate, onSelectDate }: CalendarProps) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const todayKey = toDateKey(new Date());
  const monthLabel = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => {
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) {
      setViewDate(new Date(year, month + 1, 1));
    }
  };
  const canGoNext = year < new Date().getFullYear() || (year === new Date().getFullYear() && month < new Date().getMonth());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={styles.calCard}>
      {/* Month Nav */}
      <View style={styles.calNav}>
        <Pressable onPress={prevMonth} hitSlop={8} accessibilityRole="button" accessibilityLabel="Previous month">
          <MaterialIcons name="chevron-left" size={24} color="#1C1C1E" />
        </Pressable>
        <Text style={styles.calMonthLabel}>{monthLabel}</Text>
        <Pressable onPress={nextMonth} hitSlop={8} accessibilityRole="button" accessibilityLabel="Next month" style={{ opacity: canGoNext ? 1 : 0.25 }}>
          <MaterialIcons name="chevron-right" size={24} color="#1C1C1E" />
        </Pressable>
      </View>

      {/* Weekday Headers */}
      <View style={styles.calWeekRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.calWeekday}>{d}</Text>
        ))}
      </View>

      {/* Day Grid */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={styles.calWeekRow}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (day === null) return <View key={col} style={styles.calDayCell} />;
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasWorkout = workoutDays.has(key);
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            const count = workoutDays.get(key)?.length || 0;
            const isFuture = new Date(year, month, day) > new Date();

            return (
              <Pressable
                key={col}
                style={[
                  styles.calDayCell,
                  isSelected && styles.calDaySelected,
                  isToday && !isSelected && styles.calDayToday,
                ]}
                onPress={() => !isFuture && onSelectDate(key)}
                accessibilityRole="button"
                accessibilityLabel={`${day}. ${hasWorkout ? `${count} workout${count > 1 ? 's' : ''}` : 'No workout'}`}
                disabled={isFuture}
              >
                <Text style={[
                  styles.calDayText,
                  isSelected && styles.calDayTextSelected,
                  isFuture && { color: '#CFCFD2' },
                ]}>
                  {day}
                </Text>
                {hasWorkout && (
                  <View style={[styles.calDot, isSelected && styles.calDotSelected]} />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function DayDetail({ records, dateKey, onDelete }: { records: WorkoutRecord[]; dateKey: string; onDelete: (id: string) => void }) {
  const parts = dateKey.split('-');
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (records.length === 0) {
    return (
      <View style={styles.dayDetailCard}>
        <Text style={styles.dayDetailDate}>{label}</Text>
        <View style={styles.dayDetailEmpty}>
          <MaterialIcons name="event-busy" size={28} color="#CFCFD2" />
          <Text style={styles.dayDetailEmptyText}>Rest day</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.dayDetailCard}>
      <Text style={styles.dayDetailDate}>{label}</Text>
      <Text style={styles.dayDetailCount}>{records.length} workout{records.length > 1 ? 's' : ''}</Text>

      {records.map((rec) => {
        const time = new Date(rec.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        return (
          <View key={rec.id} style={styles.dayWorkout}>
            <View style={styles.dayWorkoutHeader}>
              <Text style={styles.dayWorkoutTime}>{time}</Text>
              <Pressable onPress={() => onDelete(rec.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Delete workout">
                <MaterialIcons name="delete-outline" size={16} color="#AEAEB2" />
              </Pressable>
            </View>

            {rec.exercises.map((ex, i) => {
              const name = exerciseNames[ex.exerciseId] || `Exercise ${ex.exerciseId}`;
              const totalVol = ex.sets.reduce((s, set) => s + set.weight * set.reps, 0);
              const totalReps = ex.sets.reduce((s, set) => s + set.reps, 0);
              return (
                <View key={i} style={styles.dayExRow}>
                  <View style={styles.dayExDot} />
                  <Text style={styles.dayExName} numberOfLines={1}>{name}</Text>
                  <Text style={styles.dayExMeta}>
                    {ex.sets.length}×{totalReps > 0 ? Math.round(totalReps / ex.sets.length) : 0}
                    {totalVol > 0 ? ` · ${totalVol}kg` : ''}
                  </Text>
                </View>
              );
            })}

            <View style={styles.dayWorkoutStats}>
              <Text style={styles.dayWorkoutStat}>{rec.completedSets}/{rec.totalSets} sets</Text>
              <Text style={styles.dayWorkoutStatDot}>·</Text>
              <Text style={styles.dayWorkoutStat}>{rec.totalReps} reps</Text>
              {rec.totalVolume > 0 && (
                <>
                  <Text style={styles.dayWorkoutStatDot}>·</Text>
                  <Text style={styles.dayWorkoutStat}>{rec.totalVolume.toLocaleString()} kg</Text>
                </>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

type MuscleGroup = 'back' | 'core' | 'legs' | 'chest' | 'shoulders' | 'arms';

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  back: 'Back', core: 'Core', legs: 'Legs', chest: 'Chest', shoulders: 'Shoulders', arms: 'Arms',
};

const MUSCLE_ICONS: Record<MuscleGroup, keyof typeof MaterialIcons.glyphMap> = {
  back: 'swap-vert', core: 'self-improvement', legs: 'directions-walk',
  chest: 'expand', shoulders: 'accessibility-new', arms: 'fitness-center',
};

// Recommended WEEKLY sets per muscle group, adjusted for scoliosis curve type
function getRecommendedSets(curveType: CurveType, goal: GoalType): Record<MuscleGroup, { sets: number; priority: 'critical' | 'important' | 'normal' }> {
  // Base recommendations
  const base: Record<MuscleGroup, { sets: number; priority: 'critical' | 'important' | 'normal' }> = {
    back:      { sets: 12, priority: 'important' },
    core:      { sets: 9,  priority: 'important' },
    legs:      { sets: 10, priority: 'normal' },
    chest:     { sets: 8,  priority: 'normal' },
    shoulders: { sets: 8,  priority: 'normal' },
    arms:      { sets: 6,  priority: 'normal' },
  };

  // Adjust for curve type — scoliosis-specific priorities
  if (curveType === 'thoracic') {
    base.back = { sets: 16, priority: 'critical' };
    base.core = { sets: 12, priority: 'critical' };
    base.shoulders = { sets: 10, priority: 'important' };
  } else if (curveType === 'lumbar') {
    base.core = { sets: 15, priority: 'critical' };
    base.back = { sets: 14, priority: 'critical' };
    base.legs = { sets: 12, priority: 'important' };
  } else if (curveType === 'thoracolumbar') {
    base.back = { sets: 15, priority: 'critical' };
    base.core = { sets: 14, priority: 'critical' };
    base.shoulders = { sets: 9, priority: 'important' };
  } else if (curveType === 'scurve') {
    base.back = { sets: 16, priority: 'critical' };
    base.core = { sets: 14, priority: 'critical' };
    base.shoulders = { sets: 10, priority: 'important' };
    base.legs = { sets: 10, priority: 'important' };
  }

  // Adjust for goal
  if (goal === 'posture') {
    base.back.sets = Math.max(base.back.sets, 16);
    base.core.sets = Math.max(base.core.sets, 14);
  } else if (goal === 'pain') {
    // Lower overall volume, keep priorities
    Object.keys(base).forEach((k) => {
      const m = k as MuscleGroup;
      base[m].sets = Math.max(6, Math.round(base[m].sets * 0.75));
    });
  } else if (goal === 'muscle') {
    base.chest.sets = Math.max(base.chest.sets, 12);
    base.arms.sets = Math.max(base.arms.sets, 10);
  }

  return base;
}

const exerciseMuscleMap = new Map<number, MuscleGroup>();
for (const ex of allExercises) {
  exerciseMuscleMap.set(ex.id, ex.muscle as MuscleGroup);
}

function MuscleBalance({ workouts, curveType, goal }: { workouts: WorkoutRecord[]; curveType: CurveType; goal: GoalType }) {
  const recommendations = getRecommendedSets(curveType, goal);

  // Count sets per muscle from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentWorkouts = workouts.filter((w) => new Date(w.date) >= sevenDaysAgo);
  const actualSets: Record<MuscleGroup, number> = { back: 0, core: 0, legs: 0, chest: 0, shoulders: 0, arms: 0 };

  for (const w of recentWorkouts) {
    for (const ex of w.exercises) {
      const muscle = exerciseMuscleMap.get(ex.exerciseId);
      if (muscle && actualSets[muscle] !== undefined) {
        actualSets[muscle] += ex.sets.length;
      }
    }
  }

  // Sort: critical first, then important, then by deficit
  const muscles: MuscleGroup[] = ['back', 'core', 'legs', 'chest', 'shoulders', 'arms'];
  muscles.sort((a, b) => {
    const pa = recommendations[a].priority === 'critical' ? 2 : recommendations[a].priority === 'important' ? 1 : 0;
    const pb = recommendations[b].priority === 'critical' ? 2 : recommendations[b].priority === 'important' ? 1 : 0;
    if (pb !== pa) return pb - pa;
    const da = actualSets[a] / recommendations[a].sets;
    const db = actualSets[b] / recommendations[b].sets;
    return da - db; // less trained first
  });

  return (
    <View style={styles.balanceCard}>
      <View style={styles.balanceHeader}>
        <MaterialIcons name="analytics" size={20} color="#5B8DEF" />
        <Text style={styles.balanceTitle}>Muscle Balance</Text>
        <Text style={styles.balancePeriod}>Last 7 days</Text>
      </View>

      {muscles.map((muscle) => {
        const rec = recommendations[muscle];
        const actual = actualSets[muscle];
        const pct = Math.min(Math.round((actual / rec.sets) * 100), 100);
        const barColor = pct >= 80 ? '#00B894' : pct >= 50 ? '#FF9500' : '#FF3B30';
        const priorityColor = rec.priority === 'critical' ? '#FF3B30' : rec.priority === 'important' ? '#FF9500' : '#8E8E93';

        return (
          <View key={muscle} style={styles.balanceRow}>
            <View style={styles.balanceRowTop}>
              <View style={styles.balanceMuscleInfo}>
                <MaterialIcons name={MUSCLE_ICONS[muscle]} size={16} color="#3C3C43" />
                <Text style={styles.balanceMuscleName}>{MUSCLE_LABELS[muscle]}</Text>
                {rec.priority !== 'normal' && (
                  <View style={[styles.balancePriorityBadge, { backgroundColor: priorityColor + '18' }]}>
                    <Text style={[styles.balancePriorityText, { color: priorityColor }]}>
                      {rec.priority === 'critical' ? 'Key' : 'Important'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.balanceSetsText}>{actual}/{rec.sets} sets</Text>
            </View>
            <View style={styles.balanceBarTrack}>
              <View style={[styles.balanceBarFill, { width: `${pct}%`, backgroundColor: barColor }]} />
            </View>
            {rec.priority === 'critical' && pct < 50 && (
              <Text style={[styles.balanceHint, { color: priorityColor }]}>
                Critical for your scoliosis — needs more training
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

interface PR {
  exerciseId: number;
  name: string;
  muscle: string;
  maxWeight: number;
  maxWeightDate: string;
  maxReps: number;
  maxRepsDate: string;
  maxVolume: number;
  maxVolumeDate: string;
  totalSets: number;
}

function computePRs(workouts: WorkoutRecord[]): PR[] {
  const map = new Map<number, PR>();

  for (const w of workouts) {
    for (const ex of w.exercises) {
      let pr = map.get(ex.exerciseId);
      if (!pr) {
        const exData = allExercises.find((e) => e.id === ex.exerciseId);
        pr = {
          exerciseId: ex.exerciseId,
          name: exerciseNames[ex.exerciseId] || `Exercise ${ex.exerciseId}`,
          muscle: exData?.muscle || '',
          maxWeight: 0, maxWeightDate: '',
          maxReps: 0, maxRepsDate: '',
          maxVolume: 0, maxVolumeDate: '',
          totalSets: 0,
        };
        map.set(ex.exerciseId, pr);
      }
      pr.totalSets += ex.sets.length;
      for (const s of ex.sets) {
        if (s.weight > pr.maxWeight) {
          pr.maxWeight = s.weight;
          pr.maxWeightDate = w.date;
        }
        if (s.reps > pr.maxReps) {
          pr.maxReps = s.reps;
          pr.maxRepsDate = w.date;
        }
        const vol = s.weight * s.reps;
        if (vol > pr.maxVolume) {
          pr.maxVolume = vol;
          pr.maxVolumeDate = w.date;
        }
      }
    }
  }

  const prs = Array.from(map.values());
  prs.sort((a, b) => b.totalSets - a.totalSets);
  return prs;
}

function formatPRDate(iso: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PersonalRecords({ workouts }: { workouts: WorkoutRecord[] }) {
  const prs = useMemo(() => computePRs(workouts), [workouts]);

  if (prs.length === 0) {
    return (
      <View style={styles.prEmpty}>
        <MaterialIcons name="emoji-events" size={48} color="#E5E5EA" />
        <Text style={styles.prEmptyTitle}>No records yet</Text>
        <Text style={styles.prEmptyText}>Complete workouts to see your personal records here</Text>
      </View>
    );
  }

  return (
    <View>
      {prs.map((pr) => {
        const muscleLabel = pr.muscle ? pr.muscle.charAt(0).toUpperCase() + pr.muscle.slice(1) : '';
        return (
          <View key={pr.exerciseId} style={styles.prCard}>
            <View style={styles.prCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.prName} numberOfLines={1}>{pr.name}</Text>
                <Text style={styles.prMuscle}>{muscleLabel} · {pr.totalSets} total sets</Text>
              </View>
              <MaterialIcons name="emoji-events" size={18} color="#FF9500" />
            </View>

            <View style={styles.prStatsRow}>
              {pr.maxWeight > 0 && (
                <View style={styles.prStatBox}>
                  <View style={styles.prStatIconRow}>
                    <MaterialIcons name="fitness-center" size={14} color="#FF3B30" />
                    <Text style={styles.prStatLabel}>Max Weight</Text>
                  </View>
                  <Text style={styles.prStatValue}>{pr.maxWeight} kg</Text>
                  <Text style={styles.prStatDate}>{formatPRDate(pr.maxWeightDate)}</Text>
                </View>
              )}
              {pr.maxReps > 0 && (
                <View style={styles.prStatBox}>
                  <View style={styles.prStatIconRow}>
                    <MaterialIcons name="bolt" size={14} color="#AF52DE" />
                    <Text style={styles.prStatLabel}>Max Reps</Text>
                  </View>
                  <Text style={styles.prStatValue}>{pr.maxReps}</Text>
                  <Text style={styles.prStatDate}>{formatPRDate(pr.maxRepsDate)}</Text>
                </View>
              )}
              {pr.maxVolume > 0 && (
                <View style={styles.prStatBox}>
                  <View style={styles.prStatIconRow}>
                    <MaterialIcons name="show-chart" size={14} color="#00B894" />
                    <Text style={styles.prStatLabel}>Best Set</Text>
                  </View>
                  <Text style={styles.prStatValue}>{pr.maxVolume} kg</Text>
                  <Text style={styles.prStatDate}>{formatPRDate(pr.maxVolumeDate)}</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

type ProgressTab = 'overview' | 'records';

export default function ProgressScreen() {
  const { workouts, loadHistory, deleteWorkout } = useHistoryStore();
  const { curveType, goal } = useProfileStore();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tab, setTab] = useState<ProgressTab>('overview');

  useEffect(() => { loadHistory(); }, []);

  // Build workout map: dateKey -> WorkoutRecord[]
  const workoutDays = useMemo(() => {
    const map = new Map<string, WorkoutRecord[]>();
    for (const w of workouts) {
      const key = toDateKey(new Date(w.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return map;
  }, [workouts]);

  // Aggregate stats
  const totalWorkouts = workouts.length;
  const totalVolume = workouts.reduce((s, w) => s + w.totalVolume, 0);
  const totalReps = workouts.reduce((s, w) => s + w.totalReps, 0);

  // Streak
  const streak = (() => {
    if (workouts.length === 0) return 0;
    const daySet = new Set(workouts.map((w) => toDateKey(new Date(w.date))));
    let count = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (daySet.has(toDateKey(d))) { count++; } else if (i > 0) { break; }
    }
    return count;
  })();

  // This week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const thisWeek = workouts.filter((w) => new Date(w.date) >= weekStart).length;

  const selectedRecords = selectedDate ? (workoutDays.get(selectedDate) || []) : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Progress</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabBtn, tab === 'overview' && styles.tabBtnActive]}
          onPress={() => { setTab('overview'); setSelectedDate(null); }}
          accessibilityRole="button"
          accessibilityState={{ selected: tab === 'overview' }}
        >
          <Text style={[styles.tabBtnText, tab === 'overview' && styles.tabBtnTextActive]}>Overview</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, tab === 'records' && styles.tabBtnActive]}
          onPress={() => setTab('records')}
          accessibilityRole="button"
          accessibilityState={{ selected: tab === 'records' }}
        >
          <Text style={[styles.tabBtnText, tab === 'records' && styles.tabBtnTextActive]}>Personal Records</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {tab === 'records' ? (
          <PersonalRecords workouts={workouts} />
        ) : (
          <>
        {/* Stats Overview */}
        <View style={styles.statsRow}>
          <StatCard icon="emoji-events" value={String(totalWorkouts)} label="Workouts" color="#FF9500" />
          <StatCard icon="local-fire-department" value={String(streak)} label="Day Streak" color="#FF3B30" />
          <StatCard icon="date-range" value={String(thisWeek)} label="This Week" color="#5B8DEF" />
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="fitness-center" value={totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : String(totalVolume)} label="Total kg" color="#00B894" />
          <StatCard icon="bolt" value={totalReps >= 1000 ? `${(totalReps / 1000).toFixed(1)}k` : String(totalReps)} label="Total Reps" color="#AF52DE" />
          <StatCard icon="repeat" value={(totalWorkouts > 0 ? Math.round(totalReps / totalWorkouts) : 0).toString()} label="Avg Reps" color="#FF6B6B" />
        </View>

        {/* Training Calendar */}
        <Text style={styles.sectionTitle}>Training Calendar</Text>
        <TrainingCalendar
          workoutDays={workoutDays}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Day Detail */}
        {selectedDate && (
          <DayDetail records={selectedRecords} dateKey={selectedDate} onDelete={deleteWorkout} />
        )}

        {/* Muscle Balance */}
        {workouts.length > 0 && !selectedDate && (
          <>
            <Text style={styles.sectionTitle}>Muscle Balance</Text>
            <MuscleBalance workouts={workouts} curveType={curveType} goal={goal} />
          </>
        )}

        {/* Full History (collapsed if a date is selected) */}
        {!selectedDate && workouts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            {workouts.slice(0, 10).map((w) => {
              const d = new Date(w.date);
              const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              const exerciseList = w.exercises.map((e) => exerciseNames[e.exerciseId] || `Exercise ${e.exerciseId}`).join(', ');
              return (
                <Pressable
                  key={w.id}
                  style={styles.historyCard}
                  onPress={() => setSelectedDate(toDateKey(d))}
                  accessibilityRole="button"
                >
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{dateStr}</Text>
                    <Pressable onPress={() => deleteWorkout(w.id)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Delete workout">
                      <MaterialIcons name="delete-outline" size={18} color="#AEAEB2" />
                    </Pressable>
                  </View>
                  <Text style={styles.historyExercises} numberOfLines={1}>{exerciseList}</Text>
                  <View style={styles.historyStats}>
                    <Text style={styles.historyMiniStat}>{w.exercises.length} exercises · {w.completedSets} sets · {w.totalReps} reps</Text>
                  </View>
                </Pressable>
              );
            })}
          </>
        )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', color: '#1C1C1E' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginTop: 12, marginBottom: 12, paddingHorizontal: 4 },

  // Calendar
  calCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12 },
  calNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  calMonthLabel: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  calWeekRow: { flexDirection: 'row' },
  calWeekday: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600', color: '#8E8E93', marginBottom: 8 },
  calDayCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, minHeight: 42 },
  calDaySelected: { backgroundColor: '#00B894', borderRadius: 10 },
  calDayToday: { backgroundColor: '#E8FAF5', borderRadius: 10 },
  calDayText: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  calDayTextSelected: { color: '#FFFFFF' },
  calDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#00B894', marginTop: 3 },
  calDotSelected: { backgroundColor: '#FFFFFF' },

  // Day Detail
  dayDetailCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 4, marginBottom: 12 },
  dayDetailDate: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
  dayDetailCount: { fontSize: 12, color: '#8E8E93', marginBottom: 12 },
  dayDetailEmpty: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  dayDetailEmptyText: { fontSize: 13, color: '#AEAEB2' },

  dayWorkout: { borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 12, marginTop: 8 },
  dayWorkoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayWorkoutTime: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },

  dayExRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  dayExDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00B894' },
  dayExName: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  dayExMeta: { fontSize: 12, color: '#8E8E93', fontWeight: '500' },

  dayWorkoutStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10, backgroundColor: '#F2F2F7', borderRadius: 8, padding: 8 },
  dayWorkoutStat: { fontSize: 12, fontWeight: '600', color: '#3C3C43' },
  dayWorkoutStatDot: { fontSize: 12, color: '#AEAEB2' },

  // Muscle Balance
  balanceCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12 },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  balanceTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', flex: 1 },
  balancePeriod: { fontSize: 11, fontWeight: '600', color: '#8E8E93' },
  balanceRow: { marginBottom: 14 },
  balanceRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  balanceMuscleInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balanceMuscleName: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  balancePriorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  balancePriorityText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  balanceSetsText: { fontSize: 12, fontWeight: '600', color: '#8E8E93' },
  balanceBarTrack: { height: 6, backgroundColor: '#F2F2F7', borderRadius: 3, overflow: 'hidden' },
  balanceBarFill: { height: 6, borderRadius: 3 },
  balanceHint: { fontSize: 11, fontWeight: '500', marginTop: 3 },

  // History Card (compact)
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  historyDate: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  historyExercises: { fontSize: 12, color: '#8E8E93', lineHeight: 16, marginBottom: 8 },
  historyStats: { backgroundColor: '#F2F2F7', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  historyMiniStat: { fontSize: 12, fontWeight: '600', color: '#3C3C43' },

  // Tab Bar
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: '#E5E5EA', borderRadius: 10, padding: 3 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  tabBtnTextActive: { color: '#1C1C1E' },

  // Personal Records
  prEmpty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  prEmptyTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E' },
  prEmptyText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', maxWidth: 260, lineHeight: 20 },

  prCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10 },
  prCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  prName: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  prMuscle: { fontSize: 12, color: '#8E8E93', marginTop: 2 },

  prStatsRow: { flexDirection: 'row', gap: 8 },
  prStatBox: { flex: 1, backgroundColor: '#F2F2F7', borderRadius: 10, padding: 10, alignItems: 'center', gap: 3 },
  prStatIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  prStatLabel: { fontSize: 10, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase' },
  prStatValue: { fontSize: 16, fontWeight: '800', color: '#1C1C1E' },
  prStatDate: { fontSize: 10, fontWeight: '500', color: '#AEAEB2' },

  // Empty state
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginTop: 16 },
  emptyText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', marginTop: 8, lineHeight: 20, maxWidth: 260 },
});
