import { MaterialIcons } from '@expo/vector-icons';

export interface ExerciseStep {
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
}

/**
 * Each exercise has 3-4 movement phases.
 * The step text comes from translation keys: exerciseAnim.<id>.s1, s2, s3, s4
 */
export const exerciseSteps: Record<number, ExerciseStep[]> = {
  // CHEST
  1: [ // Dumbbell Bench Press
    { icon: 'airline-seat-flat', color: '#5B8DEF' },
    { icon: 'arrow-downward', color: '#FF9500' },
    { icon: 'arrow-upward', color: '#00B894' },
    { icon: 'check-circle', color: '#00B894' },
  ],
  11: [ // Chest Press Machine
    { icon: 'event-seat', color: '#5B8DEF' },
    { icon: 'arrow-forward', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'arrow-back', color: '#5B8DEF' },
  ],
  13: [ // Incline Dumbbell Press
    { icon: 'airline-seat-recline-normal', color: '#5B8DEF' },
    { icon: 'arrow-downward', color: '#FF9500' },
    { icon: 'arrow-upward', color: '#00B894' },
    { icon: 'check-circle', color: '#00B894' },
  ],
  14: [ // Cable Flyes
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'open-with', color: '#FF9500' },
    { icon: 'compress', color: '#00B894' },
    { icon: 'check-circle', color: '#00B894' },
  ],
  15: [ // Push-Ups
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'arrow-downward', color: '#FF9500' },
    { icon: 'arrow-upward', color: '#00B894' },
    { icon: 'straighten', color: '#00B894' },
  ],

  // BACK
  2: [ // Lat Pulldown
    { icon: 'pan-tool', color: '#5B8DEF' },
    { icon: 'arrow-downward', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'arrow-upward', color: '#5B8DEF' },
  ],
  4: [ // Seated Cable Row
    { icon: 'event-seat', color: '#5B8DEF' },
    { icon: 'arrow-back', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'arrow-forward', color: '#5B8DEF' },
  ],
  8: [ // Trap Bar Deadlift
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'arrow-downward', color: '#FF9500' },
    { icon: 'arrow-upward', color: '#00B894' },
    { icon: 'accessibility-new', color: '#00B894' },
  ],
  10: [ // Single-Arm Cable Row
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'arrow-back', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'arrow-forward', color: '#5B8DEF' },
  ],
  12: [ // Resistance Band Pull-Apart
    { icon: 'pan-tool', color: '#5B8DEF' },
    { icon: 'open-with', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'compress', color: '#5B8DEF' },
  ],
  22: [ // Single-Arm Dumbbell Row
    { icon: 'airline-seat-flat', color: '#5B8DEF' },
    { icon: 'arrow-upward', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'arrow-downward', color: '#5B8DEF' },
  ],
  23: [ // Reverse Fly Machine
    { icon: 'event-seat', color: '#5B8DEF' },
    { icon: 'open-with', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'compress', color: '#5B8DEF' },
  ],
  35: [ // Cable Pullover
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'arrow-downward', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'arrow-upward', color: '#5B8DEF' },
  ],

  // LEGS
  3: [ // Goblet Squat
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'arrow-downward', color: '#FF9500' },
    { icon: 'arrow-upward', color: '#00B894' },
    { icon: 'accessibility-new', color: '#00B894' },
  ],
  5: [ // Leg Press
    { icon: 'event-seat', color: '#5B8DEF' },
    { icon: 'arrow-downward', color: '#FF9500' },
    { icon: 'arrow-upward', color: '#00B894' },
    { icon: 'do-not-disturb-on', color: '#FF3B30' },
  ],
  16: [ // Leg Extension
    { icon: 'event-seat', color: '#5B8DEF' },
    { icon: 'arrow-upward', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'arrow-downward', color: '#5B8DEF' },
  ],
  17: [ // Lying Leg Curl
    { icon: 'airline-seat-flat', color: '#5B8DEF' },
    { icon: 'arrow-upward', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'arrow-downward', color: '#5B8DEF' },
  ],
  18: [ // DB Romanian Deadlift
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'arrow-downward', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'arrow-upward', color: '#00B894' },
  ],
  19: [ // Hip Thrust
    { icon: 'airline-seat-flat-angled', color: '#5B8DEF' },
    { icon: 'arrow-downward', color: '#FF9500' },
    { icon: 'arrow-upward', color: '#00B894' },
    { icon: 'check-circle', color: '#00B894' },
  ],
  30: [ // Seated Calf Raises
    { icon: 'event-seat', color: '#5B8DEF' },
    { icon: 'arrow-downward', color: '#FF9500' },
    { icon: 'arrow-upward', color: '#00B894' },
    { icon: 'check-circle', color: '#00B894' },
  ],
  31: [ // Bulgarian Split Squat
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'arrow-downward', color: '#FF9500' },
    { icon: 'arrow-upward', color: '#00B894' },
    { icon: 'accessibility-new', color: '#00B894' },
  ],

  // SHOULDERS
  6: [ // Seated Shoulder Press
    { icon: 'event-seat', color: '#5B8DEF' },
    { icon: 'arrow-upward', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'arrow-downward', color: '#5B8DEF' },
  ],
  9: [ // Cable Face Pulls
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'arrow-back', color: '#FF9500' },
    { icon: 'open-with', color: '#00B894' },
    { icon: 'arrow-forward', color: '#5B8DEF' },
  ],
  20: [ // Lateral Raises (Seated)
    { icon: 'event-seat', color: '#5B8DEF' },
    { icon: 'open-with', color: '#FF9500' },
    { icon: 'pause', color: '#00B894' },
    { icon: 'arrow-downward', color: '#5B8DEF' },
  ],
  21: [ // Reverse Pec Deck
    { icon: 'event-seat', color: '#5B8DEF' },
    { icon: 'open-with', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'compress', color: '#5B8DEF' },
  ],
  36: [ // Cable Lateral Raise
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'arrow-upward', color: '#FF9500' },
    { icon: 'pause', color: '#00B894' },
    { icon: 'arrow-downward', color: '#5B8DEF' },
  ],

  // ARMS
  7: [ // Bicep Curls
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'arrow-upward', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'arrow-downward', color: '#5B8DEF' },
  ],
  24: [ // Hammer Curls
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'arrow-upward', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'arrow-downward', color: '#5B8DEF' },
  ],
  25: [ // Tricep Pushdown
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'arrow-downward', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'arrow-upward', color: '#5B8DEF' },
  ],
  26: [ // Overhead Tricep Extension
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'arrow-upward', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'arrow-downward', color: '#5B8DEF' },
  ],
  27: [ // Cable Curls
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'arrow-upward', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'arrow-downward', color: '#5B8DEF' },
  ],

  // CORE
  28: [ // Pallof Press
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'arrow-forward', color: '#FF9500' },
    { icon: 'pause', color: '#00B894' },
    { icon: 'arrow-back', color: '#5B8DEF' },
  ],
  29: [ // Cable Woodchop
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'rotate-right', color: '#FF9500' },
    { icon: 'check-circle', color: '#00B894' },
    { icon: 'rotate-left', color: '#5B8DEF' },
  ],
  32: [ // Dead Bug
    { icon: 'airline-seat-flat', color: '#5B8DEF' },
    { icon: 'open-with', color: '#FF9500' },
    { icon: 'compress', color: '#00B894' },
    { icon: 'swap-horiz', color: '#5B8DEF' },
  ],
  33: [ // Bird Dog
    { icon: 'accessibility', color: '#5B8DEF' },
    { icon: 'open-with', color: '#FF9500' },
    { icon: 'pause', color: '#00B894' },
    { icon: 'compress', color: '#5B8DEF' },
  ],
  34: [ // Plank
    { icon: 'accessibility-new', color: '#5B8DEF' },
    { icon: 'straighten', color: '#FF9500' },
    { icon: 'pause', color: '#00B894' },
    { icon: 'air', color: '#00B894' },
  ],
};
