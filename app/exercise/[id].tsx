import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { View, Text, ScrollView, Pressable, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { exercises, exerciseNames, exerciseTips, exerciseMods, exerciseFusionMods } from '../../data/exercises';
import { getSafety } from '../../lib/safety';
import { useProfileStore } from '../../stores/settingsStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import SafetyBadge from '../../components/SafetyBadge';
import ExerciseIllustration from '../../components/ExerciseIllustration';
import type { SafetyLevel } from '../../types';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { curveType, surgery } = useProfileStore();
  const { addExercise, hasExercise, removeExercise } = useWorkoutStore();
  const navigation = useNavigation();
  const [showAdded, setShowAdded] = useState(false);
  const fadeAnim = useState(() => new Animated.Value(0))[0];

  const handleAdd = () => {
    addExercise(exercise!.id);
    setShowAdded(true);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => goBack());
  };

  const goBack = () => {
    if (navigation.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/exercises' as any);
    }
  };

  const exercise = exercises.find((e) => e.id === Number(id));
  if (!exercise) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={goBack} style={styles.backBtn} accessibilityLabel="Go back" accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={24} color="#1C1C1E" />
          </Pressable>
        </View>
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={48} color="#E5E5EA" />
          <Text style={styles.errorText}>Exercise not found</Text>
        </View>
      </View>
    );
  }

  const name = exerciseNames[exercise.id] || `Exercise ${exercise.id}`;
  const safety: SafetyLevel = getSafety(exercise.id, exercise.safety, curveType, surgery);
  const tip = exerciseTips[exercise.id];
  const mod = exerciseMods[exercise.id];
  const fusionMod = exerciseFusionMods[exercise.id];
  const hasSurgery = surgery !== 'none';
  const muscleLabel = exercise.muscle.charAt(0).toUpperCase() + exercise.muscle.slice(1);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backBtn} accessibilityLabel="Go back" accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color="#1C1C1E" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Exercise Illustration */}
        <ExerciseIllustration muscle={exercise.muscle} exerciseName={name} />

        {/* Safety + Muscle */}
        <View style={styles.topRow}>
          <SafetyBadge level={safety} size="medium" />
          <View style={styles.musclePill}>
            <Text style={styles.muscleText}>{muscleLabel}</Text>
          </View>
        </View>

        {/* Avoid Warning */}
        {safety === 'avoid' && (
          <View style={styles.avoidWarning} accessibilityRole="alert">
            <MaterialIcons name="block" size={20} color="#FF3B30" />
            <Text style={styles.avoidText}>
              This exercise is not recommended for your curve type. Performing it may cause injury. Consult your doctor before attempting.
            </Text>
          </View>
        )}

        {/* Sets & Rest */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <MaterialIcons name="repeat" size={20} color="#00B894" />
            <Text style={styles.infoLabel}>Sets x Reps</Text>
            <Text style={styles.infoValue}>{exercise.sets}</Text>
          </View>
          <View style={styles.infoCard}>
            <MaterialIcons name="timer" size={20} color="#00B894" />
            <Text style={styles.infoLabel}>Rest</Text>
            <Text style={styles.infoValue}>{exercise.rest}</Text>
          </View>
        </View>

        {/* Target Muscles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="track-changes" size={18} color="#1C1C1E" />
            <Text style={styles.sectionTitle}>Target Muscles</Text>
          </View>
          <View style={styles.targetList}>
            {exercise.targets.map((t) => (
              <View key={t} style={styles.targetChip}>
                <Text style={styles.targetText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="fitness-center" size={18} color="#1C1C1E" />
            <Text style={styles.sectionTitle}>Equipment Needed</Text>
          </View>
          {exercise.equip.length === 0 ? (
            <Text style={styles.bodyText}>No equipment needed (bodyweight)</Text>
          ) : (
            <View style={styles.targetList}>
              {exercise.equip.map((e) => (
                <View key={e} style={styles.targetChip}>
                  <Text style={styles.targetText}>{e}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Coach Tip */}
        {tip && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="lightbulb-outline" size={18} color="#00B894" />
              <Text style={[styles.sectionTitle, { color: '#00B894' }]}>Coach Tip</Text>
            </View>
            <Text style={styles.bodyText}>{tip}</Text>
          </View>
        )}

        {/* Modification */}
        {mod && safety === 'modify' && (
          <View style={[styles.section, styles.modSection]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="warning" size={18} color="#CC7700" />
              <Text style={[styles.sectionTitle, { color: '#CC7700' }]}>Modification Required</Text>
            </View>
            <Text style={styles.bodyText}>{mod}</Text>
          </View>
        )}

        {/* Post-Surgery Note */}
        {hasSurgery && fusionMod && (
          <View style={[styles.section, styles.surgerySection]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="local-hospital" size={18} color="#FF3B30" />
              <Text style={[styles.sectionTitle, { color: '#FF3B30' }]}>Post-Surgery Note</Text>
            </View>
            <Text style={styles.bodyText}>{fusionMod}</Text>
          </View>
        )}

        {/* Add to Workout Button */}
        {safety === 'avoid' ? (
          <View style={styles.blockedButton} accessibilityRole="alert">
            <MaterialIcons name="block" size={20} color="#FF3B30" />
            <Text style={styles.blockedButtonText}>Not safe for your condition</Text>
          </View>
        ) : hasExercise(exercise.id) ? (
          <View>
            <View style={[styles.addButton, styles.addedButton]}>
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Added to Workout</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.removeButton, pressed && { opacity: 0.7 }]}
              onPress={() => removeExercise(exercise.id)}
              accessibilityRole="button"
              accessibilityLabel="Remove from workout"
            >
              <MaterialIcons name="delete-outline" size={16} color="#FF3B30" />
              <Text style={styles.removeButtonText}>Remove from Workout</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.85 }]}
            onPress={handleAdd}
            accessibilityRole="button"
            accessibilityLabel="Add to workout"
          >
            <MaterialIcons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add to Workout</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Added Confirmation Overlay */}
      {showAdded && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <View style={styles.overlayCard}>
            <MaterialIcons name="check-circle" size={48} color="#00B894" />
            <Text style={styles.overlayText}>Added to Workout</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#8E8E93', marginTop: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F2F2F7',
  },
  backBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  musclePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  muscleText: { fontSize: 13, fontWeight: '600', color: '#3C3C43' },

  avoidWarning: {
    flexDirection: 'row',
    backgroundColor: '#FFF0EF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 10,
    alignItems: 'flex-start',
  },
  avoidText: { flex: 1, fontSize: 13, color: '#FF3B30', lineHeight: 19 },

  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: { fontSize: 11, color: '#8E8E93', fontWeight: '500' },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  bodyText: { fontSize: 14, color: '#3C3C43', lineHeight: 20 },

  modSection: { borderLeftWidth: 3, borderLeftColor: '#FF9500' },
  surgerySection: { borderLeftWidth: 3, borderLeftColor: '#FF3B30' },

  targetList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  targetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  targetText: { fontSize: 12, color: '#3C3C43', fontWeight: '500' },

  blockedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0EF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    paddingVertical: 16,
    marginTop: 8,
    gap: 8,
    minHeight: 52,
  },
  blockedButtonText: { fontSize: 16, fontWeight: '700', color: '#FF3B30' },

  addButton: {
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
  addButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  addedButton: { backgroundColor: '#3C3C43' },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    gap: 6,
    minHeight: 44,
  },
  removeButtonText: { fontSize: 14, fontWeight: '500', color: '#FF3B30' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  overlayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 48,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  overlayText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
});
