import { File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { exerciseNames } from '../data/exercises';
import type { WorkoutRecord } from '../stores/historyStore';

export function formatWorkoutText(workout: WorkoutRecord): string {
  const d = new Date(workout.date);
  const dateStr = d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const lines: string[] = [];
  lines.push('===================================');
  lines.push('  SPINEFLOW WORKOUT LOG');
  lines.push('===================================');
  lines.push('');
  lines.push(`Date:      ${dateStr}`);
  lines.push(`Time:      ${timeStr}`);
  lines.push(`Exercises: ${workout.exercises.length}`);
  lines.push(`Sets:      ${workout.completedSets}/${workout.totalSets}`);
  lines.push(`Reps:      ${workout.totalReps}`);
  lines.push(`Volume:    ${workout.totalVolume.toLocaleString()} kg`);
  lines.push('');
  lines.push('-----------------------------------');

  for (const ex of workout.exercises) {
    const name = exerciseNames[ex.exerciseId] || `Exercise ${ex.exerciseId}`;
    lines.push('');
    lines.push(`> ${name}`);

    if (ex.sets.length === 0) continue;

    for (let i = 0; i < ex.sets.length; i++) {
      const s = ex.sets[i];
      const vol = s.weight * s.reps;
      lines.push(`  Set ${i + 1}: ${s.weight} kg x ${s.reps} reps${vol > 0 ? ` (${vol} kg vol)` : ''}`);
    }
  }

  lines.push('');
  lines.push('-----------------------------------');
  lines.push('Exported from SpineFlow');
  lines.push('');

  return lines.join('\n');
}

export async function shareWorkout(workout: WorkoutRecord): Promise<void> {
  const text = formatWorkoutText(workout);
  const d = new Date(workout.date);
  const fileName = `SpineFlow_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.txt`;

  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(text);

  await shareAsync(file.uri, { mimeType: 'text/plain', dialogTitle: 'Export Workout' });
}
