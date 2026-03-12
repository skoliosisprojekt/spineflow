import { useMemo } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Exercise, SafetyLevel } from '../types';
import SafetyBadge from './SafetyBadge';
import { exerciseNames } from '../data/exercises';
import { useTheme } from '../lib/theme';
import type { ThemeColors } from '../lib/theme';

const muscleIcons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  chest: 'expand',
  back: 'swap-vert',
  legs: 'directions-walk',
  shoulders: 'accessibility-new',
  arms: 'fitness-center',
  core: 'self-improvement',
};

interface ExerciseCardProps {
  exercise: Exercise;
  safety: SafetyLevel;
  onPress: () => void;
}

export default function ExerciseCard({ exercise, safety, onPress }: ExerciseCardProps) {
  const C = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const name = exerciseNames[exercise.id] || `Exercise ${exercise.id}`;
  const muscleLabel = exercise.muscle.charAt(0).toUpperCase() + exercise.muscle.slice(1);
  const icon = muscleIcons[exercise.muscle] || 'fitness-center';

  const borderColor = safety === 'safe' ? C.accent : safety === 'modify' ? C.orange : C.red;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { borderLeftColor: borderColor, opacity: pressed ? 0.85 : 1 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${muscleLabel}, ${safety}`}
      accessibilityHint="Double tap to view exercise details"
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name={icon} size={24} color={C.text3} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <View style={styles.meta}>
          <Text style={styles.muscle}>{muscleLabel}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.sets}>{exercise.sets}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <SafetyBadge level={safety} size="small" />
        <MaterialIcons name="chevron-right" size={20} color={C.text4} style={styles.chevron} />
      </View>
    </Pressable>
  );
}

function makeStyles(C: ThemeColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: C.card,
      borderRadius: 12, marginHorizontal: 16, marginBottom: 8, padding: 14, borderLeftWidth: 4,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 3, elevation: 1, minHeight: 64,
    },
    iconContainer: {
      width: 40, height: 40, borderRadius: 10, backgroundColor: C.bg,
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    content: { flex: 1, justifyContent: 'center' },
    name: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 },
    meta: { flexDirection: 'row', alignItems: 'center' },
    muscle: { fontSize: 12, color: C.text3, fontWeight: '500' },
    dot: { fontSize: 12, color: C.text4, marginHorizontal: 5 },
    sets: { fontSize: 12, color: C.text3 },
    right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    chevron: { marginLeft: 2 },
  });
}
