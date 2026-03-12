import { useState, useEffect, useMemo } from 'react';
import { trackEvent } from '../../lib/posthog';
import { useTheme } from '../../lib/theme';
import type { ThemeColors } from '../../lib/theme';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { View, Text, ScrollView, Pressable, StyleSheet, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { exercises, exerciseNames, exerciseTips, exerciseMods, exerciseFusionMods } from '../../data/exercises';
import { getSafety } from '../../lib/safety';
import { useProfileStore } from '../../stores/settingsStore';
import { useWorkoutStore } from '../../stores/workoutStore';
import { useHistoryStore } from '../../stores/historyStore';
import SafetyBadge from '../../components/SafetyBadge';
import ExerciseIllustration from '../../components/ExerciseIllustration';
import type { SafetyLevel } from '../../types';

export default function ExerciseDetailScreen() {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { curveType, surgery } = useProfileStore();
  const { addExercise, hasExercise, removeExercise } = useWorkoutStore();
  const workouts = useHistoryStore((s) => s.workouts);

  // Last 5 sessions where this exercise was performed
  const exerciseHistory = workouts
    .filter((w) => w.exercises.some((e) => e.exerciseId === Number(id)))
    .slice(0, 5)
    .map((w) => ({
      date: w.date,
      sets: w.exercises.find((e) => e.exerciseId === Number(id))!.sets,
    }));
  const navigation = useNavigation();
  const [showAdded, setShowAdded] = useState(false);
  const fadeAnim = useState(() => new Animated.Value(0))[0];

  const handleAdd = () => {
    addExercise(exercise!.id);
    trackEvent('exercise_added_to_workout', { exerciseId: exercise!.id, name: exerciseNames[exercise!.id] });
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
          <Text style={styles.errorText}>{t('exerciseDetail.notFound')}</Text>
        </View>
      </View>
    );
  }

  const name = exerciseNames[exercise.id] || `Exercise ${exercise.id}`;
  const safety: SafetyLevel = getSafety(exercise.id, exercise.safety, curveType, surgery);
  const tipKey = `exerciseTips.${exercise.id}`;
  const tip = t(tipKey) !== tipKey ? t(tipKey) : exerciseTips[exercise.id];
  const modKey = `exerciseMods.${exercise.id}`;
  const mod = t(modKey) !== modKey ? t(modKey) : exerciseMods[exercise.id];
  const fusionModKey = `exerciseFusionMods.${exercise.id}`;
  const fusionMod = t(fusionModKey) !== fusionModKey ? t(fusionModKey) : exerciseFusionMods[exercise.id];
  const hasSurgery = surgery !== 'none';
  const muscleLabel = t(`muscles.${exercise.muscle}`);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backBtn} accessibilityLabel="Go back" accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Exercise Illustration */}
        <ExerciseIllustration muscle={exercise.muscle} exerciseName={name} exerciseId={exercise.id} />

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
              {t('exerciseDetail.avoidWarning')}
            </Text>
          </View>
        )}

        {/* Sets & Rest */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <MaterialIcons name="repeat" size={20} color="#00B894" />
            <Text style={styles.infoLabel}>{t('exerciseDetail.setsReps')}</Text>
            <Text style={styles.infoValue}>{exercise.sets}</Text>
          </View>
          <View style={styles.infoCard}>
            <MaterialIcons name="timer" size={20} color="#00B894" />
            <Text style={styles.infoLabel}>{t('exerciseDetail.rest')}</Text>
            <Text style={styles.infoValue}>{exercise.rest}</Text>
          </View>
        </View>

        {/* Target Muscles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="track-changes" size={18} color={C.text} />
            <Text style={styles.sectionTitle}>{t('exerciseDetail.targetMuscles')}</Text>
          </View>
          <View style={styles.targetList}>
            {exercise.targets.map((tgt) => (
              <View key={tgt} style={styles.targetChip}>
                <Text style={styles.targetText}>{tgt}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="fitness-center" size={18} color={C.text} />
            <Text style={styles.sectionTitle}>{t('exerciseDetail.equipmentNeeded')}</Text>
          </View>
          {exercise.equip.length === 0 ? (
            <Text style={styles.bodyText}>{t('exerciseDetail.noEquipment')}</Text>
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
              <Text style={[styles.sectionTitle, { color: C.accent }]}>{t('exerciseDetail.coachTip')}</Text>
            </View>
            <Text style={styles.bodyText}>{tip}</Text>
          </View>
        )}

        {/* Modification */}
        {mod && safety === 'modify' && (
          <View style={[styles.section, styles.modSection]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="warning" size={18} color="#CC7700" />
              <Text style={[styles.sectionTitle, { color: C.orange }]}>{t('exerciseDetail.modRequired')}</Text>
            </View>
            <Text style={styles.bodyText}>{mod}</Text>
          </View>
        )}

        {/* Post-Surgery Note */}
        {hasSurgery && fusionMod && (
          <View style={[styles.section, styles.surgerySection]}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="local-hospital" size={18} color="#FF3B30" />
              <Text style={[styles.sectionTitle, { color: C.red }]}>{t('exerciseDetail.postSurgeryNote')}</Text>
            </View>
            <Text style={styles.bodyText}>{fusionMod}</Text>
          </View>
        )}

        {/* Personal History */}
        {exerciseHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="history" size={18} color="#5856D6" />
              <Text style={[styles.sectionTitle, { color: C.purple }]}>{t('exerciseDetail.myHistory') || 'Meine Leistungen'}</Text>
            </View>
            {exerciseHistory.map((entry, i) => {
              const maxWeight = Math.max(...entry.sets.map((s) => s.weight ?? 0));
              const totalReps = entry.sets.reduce((sum, s) => sum + (s.reps ?? 0), 0);
              const dateStr = new Date(entry.date).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' });
              return (
                <View key={i} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{dateStr}</Text>
                  <Text style={styles.historyDetail}>{entry.sets.length}×</Text>
                  {maxWeight > 0 && <Text style={styles.historyWeight}>{maxWeight} kg</Text>}
                  <Text style={styles.historyReps}>{totalReps} reps</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Add to Workout Button */}
        {safety === 'avoid' ? (
          <View style={styles.blockedButton} accessibilityRole="alert">
            <MaterialIcons name="block" size={20} color="#FF3B30" />
            <Text style={styles.blockedButtonText}>{t('exerciseDetail.notSafe')}</Text>
          </View>
        ) : hasExercise(exercise.id) ? (
          <View>
            <View style={[styles.addButton, styles.addedButton]}>
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>{t('exerciseDetail.addedToWorkout')}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.removeButton, pressed && { opacity: 0.7 }]}
              onPress={() => removeExercise(exercise.id)}
              accessibilityRole="button"
              accessibilityLabel="Remove from workout"
            >
              <MaterialIcons name="delete-outline" size={16} color="#FF3B30" />
              <Text style={styles.removeButtonText}>{t('exerciseDetail.removeFromWorkout')}</Text>
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
            <Text style={styles.addButtonText}>{t('exerciseDetail.addToWorkout')}</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Added Confirmation Overlay */}
      {showAdded && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <View style={styles.overlayCard}>
            <MaterialIcons name="check-circle" size={48} color="#00B894" />
            <Text style={styles.overlayText}>{t('exerciseDetail.addedToWorkout')}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: C.bg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { fontSize: 16, color: C.text3, marginTop: 12 },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: C.bg },
    backBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    musclePill: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: C.card, borderRadius: 12 },
    muscleText: { fontSize: 13, fontWeight: '600', color: C.text2 },
    avoidWarning: { flexDirection: 'row', backgroundColor: C.redLight, borderRadius: 12, padding: 14, marginBottom: 16, gap: 10, alignItems: 'flex-start' },
    avoidText: { flex: 1, fontSize: 13, color: C.red, lineHeight: 19 },
    infoRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    infoCard: { flex: 1, backgroundColor: C.card, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4 },
    infoLabel: { fontSize: 11, color: C.text3, fontWeight: '500' },
    infoValue: { fontSize: 16, fontWeight: '700', color: C.text },
    section: { backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 12 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: C.text },
    bodyText: { fontSize: 14, color: C.text2, lineHeight: 20 },
    modSection: { borderLeftWidth: 3, borderLeftColor: C.orange },
    surgerySection: { borderLeftWidth: 3, borderLeftColor: C.red },
    targetList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    targetChip: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: C.bg, borderRadius: 8 },
    targetText: { fontSize: 12, color: C.text2, fontWeight: '500' },
    blockedButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.redLight, borderRadius: 14, borderWidth: 1.5, borderColor: C.red, paddingVertical: 16, marginTop: 8, gap: 8, minHeight: 52 },
    blockedButtonText: { fontSize: 16, fontWeight: '700', color: C.red },
    addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, marginTop: 8, gap: 8, minHeight: 52 },
    addButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    addedButton: { backgroundColor: C.text2 },
    removeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginTop: 8, gap: 6, minHeight: 44 },
    removeButtonText: { fontSize: 14, fontWeight: '500', color: C.red },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    overlayCard: { backgroundColor: C.card, borderRadius: 20, paddingVertical: 32, paddingHorizontal: 48, alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
    overlayText: { fontSize: 18, fontWeight: '700', color: C.text },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.sep },
    historyDate: { fontSize: 13, color: C.text3, width: 64 },
    historyDetail: { fontSize: 13, fontWeight: '600', color: C.text, minWidth: 28 },
    historyWeight: { fontSize: 13, fontWeight: '700', color: C.accent, minWidth: 56 },
    historyReps: { fontSize: 13, color: C.text2 },
  });
}
