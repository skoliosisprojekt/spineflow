import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useProfileStore } from '../../stores/settingsStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useHistoryStore } from '../../stores/historyStore';
import { useNutritionStore } from '../../stores/nutritionStore';

export default function HomeScreen() {
  const router = useRouter();
  const { surgery, curveType, goal } = useProfileStore();
  const workoutExercises = useWorkoutStore((s) => s.exercises);
  const { workouts, loadHistory } = useHistoryStore();
  const { entries, goals, loadNutrition } = useNutritionStore();

  useEffect(() => { loadHistory(); loadNutrition(); }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Stats
  const totalWorkouts = workouts.length;
  const todayStr = new Date().toDateString();
  const todayWorkouts = workouts.filter((w) => new Date(w.date).toDateString() === todayStr).length;

  // Streak
  const streak = (() => {
    if (workouts.length === 0) return 0;
    const daySet = new Set(workouts.map((w) => new Date(w.date).toDateString()));
    let count = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (daySet.has(d.toDateString())) { count++; } else if (i > 0) { break; }
    }
    return count;
  })();

  // Hydration today
  const todayEntries = entries.filter((e) => new Date(e.time).toDateString() === todayStr);
  const todayHydration = todayEntries.reduce((s, e) => s + e.amount, 0);
  const hydrationPct = Math.min(Math.round((todayHydration / goals.water) * 100), 100);

  // Active workout
  const hasActiveWorkout = workoutExercises.length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>SpineFlow</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <Pressable onPress={() => router.push('/settings' as any)} style={styles.settingsButton} accessibilityRole="button" accessibilityLabel="Settings">
          <MaterialIcons name="settings" size={22} color="#8E8E93" />
        </Pressable>
      </View>

      {/* Today's Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <MaterialIcons name="local-fire-department" size={20} color="#FF3B30" />
          <Text style={[styles.statValue, { color: '#FF3B30' }]}>{streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="emoji-events" size={20} color="#FF9500" />
          <Text style={[styles.statValue, { color: '#FF9500' }]}>{totalWorkouts}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialIcons name="water-drop" size={20} color="#5B8DEF" />
          <Text style={[styles.statValue, { color: '#5B8DEF' }]}>{hydrationPct}%</Text>
          <Text style={styles.statLabel}>Hydration</Text>
        </View>
      </View>

      {/* Active Workout Banner */}
      {hasActiveWorkout && (
        <Pressable
          style={styles.activeWorkoutBanner}
          onPress={() => router.push('/(tabs)/workout' as any)}
          accessibilityRole="button"
          accessibilityLabel="Continue workout"
        >
          <View style={styles.activeDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.activeTitle}>Workout in progress</Text>
            <Text style={styles.activeSubtitle}>{workoutExercises.length} exercises added</Text>
          </View>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>
      )}

      {/* Today's Activity */}
      {todayWorkouts > 0 && (
        <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: '#00B894' }]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="check-circle" size={20} color="#00B894" />
            <Text style={styles.cardTitle}>
              {todayWorkouts === 1 ? '1 workout today' : `${todayWorkouts} workouts today`}
            </Text>
          </View>
          <Text style={styles.cardDescription}>Keep up the great work!</Text>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/(tabs)/exercises' as any)}
          accessibilityRole="button"
        >
          <View style={[styles.actionIcon, { backgroundColor: '#E8FAF5' }]}>
            <MaterialIcons name="fitness-center" size={22} color="#00B894" />
          </View>
          <Text style={styles.actionLabel}>Exercises</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/(tabs)/workout' as any)}
          accessibilityRole="button"
        >
          <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
            <MaterialIcons name="play-circle-outline" size={22} color="#FF9500" />
          </View>
          <Text style={styles.actionLabel}>Workout</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/(tabs)/nutrition' as any)}
          accessibilityRole="button"
        >
          <View style={[styles.actionIcon, { backgroundColor: '#EDE7F6' }]}>
            <MaterialIcons name="water-drop" size={22} color="#AF52DE" />
          </View>
          <Text style={styles.actionLabel}>Nutrition</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/(tabs)/progress' as any)}
          accessibilityRole="button"
        >
          <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
            <MaterialIcons name="bar-chart" size={22} color="#5B8DEF" />
          </View>
          <Text style={styles.actionLabel}>Progress</Text>
        </Pressable>
      </View>

      {/* Profile Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Profile</Text>
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Scoliosis Type</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{curveType}</Text></View>
        </View>
        <View style={styles.separator} />
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Surgery History</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{surgery}</Text></View>
        </View>
        <View style={styles.separator} />
        <View style={styles.profileRow}>
          <Text style={styles.profileLabel}>Main Goal</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{goal}</Text></View>
        </View>
      </View>

      {/* Safety Card */}
      <View style={[styles.card, styles.safetyCard]}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="health-and-safety" size={20} color="#00B894" />
          <Text style={styles.cardTitle}>Safety First</Text>
        </View>
        <Text style={styles.cardDescription}>
          All exercises are rated for your specific curve type and surgery history. Always listen to your body.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { padding: 16, paddingTop: 60, paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  greeting: { fontSize: 28, fontWeight: '800', color: '#1C1C1E' },
  date: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  settingsButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

  // Stats row
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase' },

  // Active workout
  activeWorkoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B894',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    gap: 12,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  activeTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  activeSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  // Quick actions grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  actionCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    minHeight: 90,
    justifyContent: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: '#3C3C43' },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
  },
  safetyCard: { borderLeftWidth: 4, borderLeftColor: '#00B894' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  cardDescription: { fontSize: 13, color: '#3C3C43', lineHeight: 19 },

  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  profileLabel: { fontSize: 13, color: '#8E8E93' },
  badge: { backgroundColor: '#E8FAF5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#009B7D' },
  separator: { height: 1, backgroundColor: '#F2F2F7' },
});
