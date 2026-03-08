import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useProfileStore } from '../stores/settingsStore';
import { useWorkoutStore } from '../stores/workoutStore';
import { usePremiumStore } from '../stores/premiumStore';
import { useHistoryStore } from '../stores/historyStore';
import i18n from '../i18n';
import {
  generateWorkout,
  type GeneratedWorkout,
  type GeneratedWorkoutExercise,
} from '../lib/workoutGenerator';
import { runAIWorkoutGeneration } from '../lib/aiAnalysis';
import { useNetwork } from '../lib/network';
import { lightTheme as C } from '../lib/theme';

// ─── Constants ───────────────────────────────────────────────────────────────

const DURATIONS = [30, 45, 60, 90] as const;
type Duration = (typeof DURATIONS)[number];

const DURATION_COUNTS: Record<Duration, string> = {
  30: '4–5',
  45: '6–7',
  60: '8–9',
  90: '11–12',
};

const MUSCLE_IDS = ['all', 'back', 'chest', 'legs', 'shoulders', 'arms', 'core'] as const;

const CATEGORY_COLORS: Record<string, string> = {
  activation: C.blue,
  compound:   C.accent,
  isolation:  C.text3,
  core:       C.purple,
};

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PlannerScreen() {
  const router  = useRouter();
  const { t } = useTranslation();
  const profile = useProfileStore();
  const { addExercise, clearWorkout } = useWorkoutStore();
  const isPremium = usePremiumStore((s) => s.isPremium);

  const [duration, setDuration]       = useState<Duration>(45);
  const [muscles, setMuscles]         = useState<string[]>([]);        // empty = all
  const [workout, setWorkout]         = useState<GeneratedWorkout | null>(null);
  const [removed, setRemoved]         = useState<Set<number>>(new Set());
  const [generating, setGenerating]   = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  const history = useHistoryStore((s) => s.workouts);
  const { isOnline } = useNetwork();

  // ── Helpers ────────────────────────────────────────────────────────────────

  const toggleMuscle = useCallback((id: string) => {
    if (id === 'all') {
      setMuscles([]);
      return;
    }
    setMuscles((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((m) => m !== id);
        return next;
      }
      return [...prev, id];
    });
  }, []);

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setRemoved(new Set());
    // generateWorkout is synchronous; defer one frame for UX feedback
    requestAnimationFrame(() => {
      try {
        const result = generateWorkout(
          duration,
          {
            curveType:  profile.curveType,
            surgery:    profile.surgery,
            goal:       profile.goal,
            experience: profile.experience,
            equipment:  profile.equipment,
          },
          muscles.length > 0 ? muscles : undefined,
        );
        setWorkout(result);
      } catch {
        Alert.alert('Fehler', 'Workout konnte nicht generiert werden.');
      } finally {
        setGenerating(false);
      }
    });
  }, [duration, muscles, profile]);

  const handleRegenerate = useCallback(() => {
    setRemoved(new Set());
    setIsAiGenerated(false);
    handleGenerate();
  }, [handleGenerate]);

  const handleAIGenerate = useCallback(async () => {
    if (!isOnline) return; // guard — button is hidden offline, but defensive
    setAiGenerating(true);
    setRemoved(new Set());
    try {
      const result = await runAIWorkoutGeneration({
        duration,
        profile: {
          curveType:  profile.curveType,
          surgery:    profile.surgery,
          goal:       profile.goal,
          experience: profile.experience,
          equipment:  profile.equipment,
        },
        muscleGroups: muscles.length > 0 ? muscles : undefined,
        history,
        language: i18n.language || 'de',
      });
      setWorkout(result);
      setIsAiGenerated(true);
    } catch (err) {
      Alert.alert(
        'KI-Fehler',
        err instanceof Error ? err.message : 'KI-Workout konnte nicht generiert werden.',
      );
    } finally {
      setAiGenerating(false);
    }
  }, [duration, muscles, profile, history]);

  const handleRemove = useCallback((id: number) => {
    setRemoved((prev) => new Set([...prev, id]));
  }, []);

  const visibleExercises: GeneratedWorkoutExercise[] = workout
    ? workout.exercises.filter((e) => !removed.has(e.exerciseId))
    : [];

  const totalMin = visibleExercises.reduce((s, e) => s + e.estimatedMinutes, 0);

  const handleStartWorkout = useCallback(() => {
    if (!workout || visibleExercises.length === 0) return;
    clearWorkout();
    for (const ex of visibleExercises) {
      addExercise(ex.exerciseId, ex.sets);
    }
    router.replace('/(tabs)/workout' as any);
  }, [workout, visibleExercises, clearWorkout, addExercise, router]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          style={s.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <Text style={s.headerTitle}>{t('planner.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Duration Selector */}
        <Text style={s.sectionLabel}>{t('planner.duration')}</Text>
        <View style={s.durationRow}>
          {DURATIONS.map((d) => (
            <Pressable
              key={d}
              style={[s.durationPill, duration === d && s.durationPillActive]}
              onPress={() => setDuration(d)}
              accessibilityRole="button"
              accessibilityLabel={`${d} ${t('planner.minutes')}`}
              accessibilityState={{ selected: duration === d }}
            >
              <Text style={[s.durationPillText, duration === d && s.durationPillTextActive]}>
                {d} {t('planner.minutes')}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.durationHint}>~{DURATION_COUNTS[duration]} {t('planner.exercises')}</Text>

        {/* Muscle Group Filter */}
        <Text style={s.sectionLabel}>Muskelgruppen</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.muscleRow}
        >
          {MUSCLE_IDS.map((id) => {
            const active = id === 'all' ? muscles.length === 0 : muscles.includes(id);
            const label = t(`muscles.${id}`);
            return (
              <Pressable
                key={id}
                style={[s.musclePill, active && s.musclePillActive]}
                onPress={() => toggleMuscle(id)}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
              >
                <Text style={[s.musclePillText, active && s.musclePillTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Generate Button */}
        <Pressable
          style={({ pressed }) => [s.generateBtn, pressed && { opacity: 0.85 }]}
          onPress={handleGenerate}
          disabled={generating}
          accessibilityRole="button"
          accessibilityLabel={t('planner.generate')}
        >
          {generating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="auto-awesome" size={20} color="#FFFFFF" />
              <Text style={s.generateBtnText}>{t('planner.generate')}</Text>
            </>
          )}
        </Pressable>

        {/* Premium AI Banner */}
        <Pressable
          style={({ pressed }) => [s.premiumBanner, pressed && { opacity: 0.9 }]}
          onPress={() => {
            if (isPremium) {
              handleAIGenerate();
            } else {
              router.push('/premium' as any);
            }
          }}
          disabled={aiGenerating}
          accessibilityRole="button"
          accessibilityLabel={t('planner.aiGenerateButton')}
        >
          <View style={s.premiumBannerTop}>
            <Text style={s.premiumBannerTitle}>👑 KI-Workout</Text>
            {!isPremium && (
              <View style={s.premiumBadge}>
                <Text style={s.premiumBadgeText}>PREMIUM</Text>
              </View>
            )}
          </View>
          <Text style={s.premiumBannerDesc}>{t('planner.aiGenerate')}</Text>
          {aiGenerating ? (
            <View style={s.premiumBannerBtn}>
              <ActivityIndicator size="small" color={C.orange} />
              <Text style={s.premiumBannerBtnText}>{t('ai.analyzing')}</Text>
            </View>
          ) : isPremium && !isOnline ? (
            <View style={s.premiumBannerBtn}>
              <MaterialIcons name="cloud-off" size={16} color={C.text3} />
              <Text style={[s.premiumBannerBtnText, { color: C.text3 }]}>
                {t('offline.aiWorkoutUnavailable')}
              </Text>
            </View>
          ) : (
            <View style={s.premiumBannerBtn}>
              <MaterialIcons name="auto-awesome" size={16} color={C.orange} />
              <Text style={s.premiumBannerBtnText}>
                {isPremium ? t('planner.aiGenerateButton') : `${t('premium.unlock')} →`}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Generated Workout Results */}
        {workout && visibleExercises.length > 0 && (
          <View style={s.resultsSection}>
            {/* Results header */}
            <View style={s.resultsHeader}>
              {isAiGenerated && (
                <View style={s.aiBadge}>
                  <Text style={s.aiBadgeText}>🤖 {t('planner.aiGenerated')}</Text>
                </View>
              )}
              <Text style={s.resultsTitle}>
                {Math.round(totalMin)} {t('planner.minutes')} — {visibleExercises.length} {t('planner.exercises')}
              </Text>
              <View style={s.resultsInfo}>
                <MaterialIcons name="info-outline" size={13} color={C.text3} />
                <Text style={s.resultsInfoText}>{t('planner.optimizedOrder')}</Text>
              </View>
            </View>

            {/* Exercise cards */}
            {visibleExercises.map((ex, idx) => (
              <ExerciseCard
                key={ex.exerciseId}
                ex={ex}
                index={idx + 1}
                onRemove={() => handleRemove(ex.exerciseId)}
              />
            ))}

            {/* Action row */}
            <View style={s.actionsRow}>
              <Pressable
                style={({ pressed }) => [s.actionBtn, pressed && { opacity: 0.8 }]}
                onPress={() => router.push('/(tabs)/exercises' as any)}
                accessibilityRole="button"
                accessibilityLabel={t('workout.addExercise')}
              >
                <MaterialIcons name="add" size={18} color={C.accent} />
                <Text style={s.actionBtnText}>{t('workout.addExercise')}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [s.actionBtn, pressed && { opacity: 0.8 }]}
                onPress={handleRegenerate}
                accessibilityRole="button"
                accessibilityLabel={t('planner.regenerate')}
              >
                <MaterialIcons name="refresh" size={18} color={C.accent} />
                <Text style={s.actionBtnText}>{t('planner.regenerate')}</Text>
              </Pressable>
            </View>

            {/* Start workout button */}
            <Pressable
              style={({ pressed }) => [s.startBtn, pressed && { opacity: 0.88 }]}
              onPress={handleStartWorkout}
              accessibilityRole="button"
              accessibilityLabel={t('planner.startWorkout')}
            >
              <MaterialIcons name="play-arrow" size={22} color="#FFFFFF" />
              <Text style={s.startBtnText}>{t('planner.startWorkout')}</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExerciseCard({
  ex, index, onRemove,
}: {
  ex: GeneratedWorkoutExercise;
  index: number;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const catColor = CATEGORY_COLORS[ex.category] ?? C.text3;
  const catLabel = t(`planner.${ex.category}`, { defaultValue: ex.category });

  return (
    <View style={s.exCard}>
      {/* Index + name row */}
      <View style={s.exCardTop}>
        <View style={s.exCardIndex}>
          <Text style={s.exCardIndexText}>{index}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.exCardName} numberOfLines={2}>{ex.name}</Text>
          <Text style={s.exCardMuscle}>{ex.muscle}</Text>
        </View>
        <Pressable
          style={s.removeBtn}
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`${ex.name} entfernen`}
          hitSlop={6}
        >
          <MaterialIcons name="close" size={18} color={C.text3} />
        </Pressable>
      </View>

      {/* Badge row */}
      <View style={s.exCardBadges}>
        {/* Category badge */}
        <View style={[s.categoryBadge, { backgroundColor: catColor + '22' }]}>
          <Text style={[s.categoryBadgeText, { color: catColor }]}>{catLabel}</Text>
        </View>
        {/* Safety badge */}
        <View style={[s.safetyBadge, ex.safety === 'modify' ? s.safetyModify : s.safetySafe]}>
          <Text style={[s.safetyBadgeText, ex.safety === 'modify' ? s.safetyModifyText : s.safetySafeText]}>
            {ex.safety === 'modify' ? t('safety.modify') : t('safety.safe')}
          </Text>
        </View>
      </View>

      {/* Sets & time row */}
      <View style={s.exCardMeta}>
        <View style={s.exCardMetaItem}>
          <MaterialIcons name="repeat" size={13} color={C.text3} />
          <Text style={s.exCardMetaText}>{ex.sets} Sets</Text>
        </View>
        <View style={s.exCardMetaItem}>
          <MaterialIcons name="schedule" size={13} color={C.text3} />
          <Text style={s.exCardMetaText}>~{ex.estimatedMinutes} {t('planner.minutes')}</Text>
        </View>
      </View>

      {/* KI Begründung */}
      {ex.reason && (
        <View style={s.reasonRow}>
          <Text style={s.reasonText}>🤖 {ex.reason}</Text>
        </View>
      )}

      {/* Modification warning */}
      {ex.modification && (
        <View style={s.modificationRow}>
          <MaterialIcons name="warning" size={13} color={C.orange} />
          <Text style={s.modificationText}>{ex.modification}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.card,
    borderBottomWidth: 0.5,
    borderBottomColor: C.sep,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },

  // Duration pills
  durationRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  durationPill: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.sep,
  },
  durationPillActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  durationPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text3,
  },
  durationPillTextActive: {
    color: '#FFFFFF',
  },
  durationHint: {
    fontSize: 12,
    color: C.text3,
    marginBottom: 20,
    textAlign: 'center',
  },

  // Muscle group pills
  muscleRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
    marginBottom: 20,
  },
  musclePill: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: C.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.sep,
  },
  musclePillActive: {
    backgroundColor: C.accentLight,
    borderColor: C.accent,
  },
  musclePillText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text3,
  },
  musclePillTextActive: {
    color: C.accent,
    fontWeight: '600',
  },

  // Generate button
  generateBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: C.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Premium banner
  premiumBanner: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.orange + '55',
    marginBottom: 24,
  },
  premiumBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  premiumBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  premiumBadge: {
    backgroundColor: C.orange,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  premiumBannerDesc: {
    fontSize: 12,
    color: C.text3,
    lineHeight: 17,
    marginBottom: 10,
  },
  premiumBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  premiumBannerBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.orange,
  },

  // Results section
  resultsSection: {
    marginTop: 4,
  },
  resultsHeader: {
    marginBottom: 14,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 4,
  },
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultsInfoText: {
    fontSize: 12,
    color: C.text3,
  },

  // Exercise card
  exCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  exCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  exCardIndex: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  exCardIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text3,
  },
  exCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    lineHeight: 19,
  },
  exCardMuscle: {
    fontSize: 12,
    color: C.text3,
    marginTop: 1,
    textTransform: 'capitalize',
  },
  removeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: C.bg,
  },
  exCardBadges: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  safetyBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  safetySafe: {
    backgroundColor: C.accentLight,
  },
  safetySafeText: {
    color: C.accent,
  },
  safetyModify: {
    backgroundColor: C.orangeLight,
  },
  safetyModifyText: {
    color: C.orange,
  },
  safetyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  exCardMeta: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 4,
  },
  exCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exCardMetaText: {
    fontSize: 12,
    color: C.text3,
  },
  modificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    backgroundColor: C.orangeLight,
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  modificationText: {
    fontSize: 11,
    color: '#E65100',
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },

  // Action row
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.accent,
  },

  // AI badge
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.accentLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.accent,
  },

  // KI reason row (on exercise cards)
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    backgroundColor: C.accentLight,
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  reasonText: {
    fontSize: 11,
    color: C.accentDark,
    lineHeight: 16,
    flex: 1,
    fontStyle: 'italic',
  },

  // Start button
  startBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: C.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
