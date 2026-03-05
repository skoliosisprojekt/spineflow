import type { Exercise } from '../types';

export const exercises: Exercise[] = [
  // ═══ CHEST (5) ═══
  { id: 1, muscle: 'chest', sets: '4x8-10', rest: '90s',
    targets: ['chest', 'frontDelt', 'triceps'], equip: ['dumbbells', 'bench'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'modify', scurve: 'modify' } },

  { id: 11, muscle: 'chest', sets: '3x10-12', rest: '90s',
    targets: ['chest', 'frontDelt', 'triceps'], equip: ['chestpress'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'modify' } },

  { id: 13, muscle: 'chest', sets: '4x8-10', rest: '90s',
    targets: ['upperChest', 'frontDelt', 'triceps'], equip: ['dumbbells', 'bench'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'modify' } },

  { id: 14, muscle: 'chest', sets: '3x12-15', rest: '60s',
    targets: ['chest', 'frontDelt'], equip: ['cables'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 15, muscle: 'chest', sets: '3xmax', rest: '60s',
    targets: ['chest', 'triceps', 'core', 'frontDelt'], equip: [],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'modify', scurve: 'modify' } },

  // ═══ BACK (8) ═══
  { id: 2, muscle: 'back', sets: '4x10-12', rest: '90s',
    targets: ['lats', 'biceps', 'rhomboids'], equip: ['latpull'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 4, muscle: 'back', sets: '4x10-12', rest: '90s',
    targets: ['rhomboids', 'midTraps', 'lats'], equip: ['cables'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 8, muscle: 'back', sets: '3x6-8', rest: '180s',
    targets: ['lowerBack', 'hamstrings', 'glutes', 'traps'], equip: ['trapbar'],
    safety: { thoracic: 'modify', lumbar: 'avoid', thoracolumbar: 'avoid', scurve: 'avoid' } },

  { id: 10, muscle: 'back', sets: '3x10 each', rest: '60s',
    targets: ['lats', 'rhomboids', 'core'], equip: ['cables'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 12, muscle: 'back', sets: '3x15', rest: '45s',
    targets: ['rearDelts', 'rhomboids', 'upperBack'], equip: ['bands'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 22, muscle: 'back', sets: '4x10 each', rest: '60s',
    targets: ['lats', 'rhomboids', 'biceps'], equip: ['dumbbells', 'bench'],
    safety: { thoracic: 'safe', lumbar: 'modify', thoracolumbar: 'modify', scurve: 'modify' } },

  { id: 23, muscle: 'back', sets: '3x12-15', rest: '60s',
    targets: ['rearDelts', 'rhomboids', 'midTraps'], equip: ['chestpress'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 35, muscle: 'back', sets: '3x12', rest: '60s',
    targets: ['lats', 'serratus', 'tricepsLongHead'], equip: ['cables'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'modify', scurve: 'modify' } },

  // ═══ LEGS (8) ═══
  { id: 3, muscle: 'legs', sets: '4x10', rest: '120s',
    targets: ['quads', 'glutes', 'core'], equip: ['dumbbells'],
    safety: { thoracic: 'safe', lumbar: 'modify', thoracolumbar: 'modify', scurve: 'modify' } },

  { id: 5, muscle: 'legs', sets: '4x10-12', rest: '120s',
    targets: ['quads', 'glutes', 'hamstrings'], equip: ['legpress'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 16, muscle: 'legs', sets: '3x12-15', rest: '60s',
    targets: ['quads'], equip: ['legpress'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 17, muscle: 'legs', sets: '3x10-12', rest: '60s',
    targets: ['hamstrings'], equip: ['legpress'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 18, muscle: 'legs', sets: '3x10', rest: '90s',
    targets: ['hamstrings', 'glutes', 'lowerBack'], equip: ['dumbbells'],
    safety: { thoracic: 'modify', lumbar: 'avoid', thoracolumbar: 'avoid', scurve: 'avoid' } },

  { id: 19, muscle: 'legs', sets: '4x10-12', rest: '90s',
    targets: ['glutes', 'hamstrings', 'core'], equip: ['barbell', 'bench'],
    safety: { thoracic: 'safe', lumbar: 'modify', thoracolumbar: 'modify', scurve: 'modify' } },

  { id: 30, muscle: 'legs', sets: '4x15-20', rest: '45s',
    targets: ['calves'], equip: ['dumbbells'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 31, muscle: 'legs', sets: '3x10 each', rest: '90s',
    targets: ['quads', 'glutes', 'core'], equip: ['dumbbells', 'bench'],
    safety: { thoracic: 'safe', lumbar: 'modify', thoracolumbar: 'modify', scurve: 'avoid' } },

  // ═══ SHOULDERS (5) ═══
  { id: 6, muscle: 'shoulders', sets: '4x8-10', rest: '90s',
    targets: ['deltoids', 'triceps'], equip: ['dumbbells', 'bench'],
    safety: { thoracic: 'modify', lumbar: 'safe', thoracolumbar: 'modify', scurve: 'modify' } },

  { id: 9, muscle: 'shoulders', sets: '3x15', rest: '60s',
    targets: ['rearDelts', 'rotatorCuff', 'upperBack'], equip: ['cables'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 20, muscle: 'shoulders', sets: '3x12-15', rest: '60s',
    targets: ['sideDelts'], equip: ['dumbbells', 'bench'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 21, muscle: 'shoulders', sets: '3x12-15', rest: '60s',
    targets: ['rearDelts', 'rhomboids'], equip: ['chestpress'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 36, muscle: 'shoulders', sets: '3x12 each', rest: '60s',
    targets: ['sideDelts'], equip: ['cables'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  // ═══ ARMS (5) ═══
  { id: 7, muscle: 'arms', sets: '3x10-12', rest: '60s',
    targets: ['biceps'], equip: ['dumbbells'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 24, muscle: 'arms', sets: '3x10-12', rest: '60s',
    targets: ['biceps', 'brachialis', 'forearms'], equip: ['dumbbells'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 25, muscle: 'arms', sets: '3x10-12', rest: '60s',
    targets: ['triceps'], equip: ['cables'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 26, muscle: 'arms', sets: '3x10-12', rest: '60s',
    targets: ['tricepsLongHead'], equip: ['cables'],
    safety: { thoracic: 'modify', lumbar: 'safe', thoracolumbar: 'modify', scurve: 'modify' } },

  { id: 27, muscle: 'arms', sets: '3x12', rest: '60s',
    targets: ['biceps'], equip: ['cables'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  // ═══ CORE (5) ═══
  { id: 28, muscle: 'core', sets: '3x10 each', rest: '60s',
    targets: ['core', 'obliques', 'transverseAbdominis'], equip: ['cables', 'bands'],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 29, muscle: 'core', sets: '3x12 each', rest: '60s',
    targets: ['obliques', 'core', 'shoulders'], equip: ['cables'],
    safety: { thoracic: 'modify', lumbar: 'modify', thoracolumbar: 'modify', scurve: 'avoid' } },

  { id: 32, muscle: 'core', sets: '3x8 each', rest: '45s',
    targets: ['core', 'transverseAbdominis', 'hipFlexors'], equip: [],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 33, muscle: 'core', sets: '3x8 each', rest: '45s',
    targets: ['core', 'lowerBack', 'glutes'], equip: [],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'safe' } },

  { id: 34, muscle: 'core', sets: '3x30-60s', rest: '60s',
    targets: ['core', 'shoulders', 'glutes'], equip: [],
    safety: { thoracic: 'safe', lumbar: 'safe', thoracolumbar: 'safe', scurve: 'modify' } },
];

// Exercise names (English — in full i18n these come from translation files)
export const exerciseNames: Record<number, string> = {
  1: 'Dumbbell Bench Press', 2: 'Lat Pulldown', 3: 'Goblet Squat',
  4: 'Seated Cable Row', 5: 'Leg Press', 6: 'Seated Shoulder Press',
  7: 'Bicep Curls', 8: 'Trap Bar Deadlift', 9: 'Cable Face Pulls',
  10: 'Single-Arm Cable Row', 11: 'Chest Press Machine',
  12: 'Resistance Band Pull-Apart', 13: 'Incline Dumbbell Press',
  14: 'Cable Flyes', 15: 'Push-Ups', 16: 'Leg Extension',
  17: 'Lying Leg Curl', 18: 'DB Romanian Deadlift', 19: 'Hip Thrust',
  20: 'Lateral Raises (Seated)', 21: 'Reverse Pec Deck',
  22: 'Single-Arm Dumbbell Row', 23: 'Reverse Fly Machine',
  24: 'Hammer Curls', 25: 'Tricep Pushdown',
  26: 'Overhead Tricep Extension', 27: 'Cable Curls',
  28: 'Pallof Press', 29: 'Cable Woodchop', 30: 'Seated Calf Raises',
  31: 'Bulgarian Split Squat', 32: 'Dead Bug', 33: 'Bird Dog',
  34: 'Plank', 35: 'Cable Pullover', 36: 'Cable Lateral Raise',
};

// Coach tips per exercise
export const exerciseTips: Record<number, string> = {
  1: 'Each arm moves independently — perfect for correcting the muscle imbalances scoliosis creates.',
  2: 'One of the best exercises for scoliosis! Builds symmetrical back strength. Shoulder-width grip.',
  3: 'The front-loaded weight forces an upright torso — much safer for your spine than back squats.',
  4: 'One of the best exercises for scoliosis! Directly strengthens postural muscles.',
  5: 'Spine is fully supported. Safer than squats. Focus on pushing equally with both legs.',
  6: 'The backrest stabilizes your spine. Dumbbells allow natural movement.',
  7: 'Isolation exercise — no spinal load. Still brace your core and don\'t use momentum.',
  8: 'The trap bar centers load around your body, reducing spinal shear.',
  9: 'Corrects the forward shoulder posture common in scoliosis. Essential.',
  10: 'Unilateral work is gold for scoliosis! Train the weaker side first.',
  11: 'Guided path with back support — great for beginners with scoliosis.',
  12: 'Perfect warm-up exercise. Activates the postural muscles you need for every other exercise.',
  13: 'The incline reduces lower back stress compared to flat bench. Builds the upper chest for a balanced look.',
  14: 'Constant cable tension is great for scoliosis — smooth movement, no jerking, easy to control imbalances.',
  15: 'Free, anywhere, anytime. Engages the entire anterior chain. Use a mirror to check for asymmetric arm push.',
  16: 'Isolation for quads with zero spinal load. Use single-leg to check for left-right strength differences.',
  17: 'Hamstrings support the pelvis and lower back. Strengthening them helps reduce back pain from scoliosis.',
  18: 'Dumbbells allow independent loading, but the hip hinge is still demanding on the spine. Master the movement pattern first.',
  19: 'One of the best glute exercises with minimal spinal compression. Upper back is supported on the bench.',
  20: 'Seated version removes all lower body momentum — pure shoulder isolation. Use mirror to catch uneven lifting.',
  21: 'Machine-supported rear delt work — perfect for scoliosis. The chest pad keeps your spine stable.',
  22: 'The bench support takes load off your spine. Great for finding and fixing left-right imbalances.',
  23: 'The chest pad stabilizes your torso — you can focus purely on your upper back. Great for posture correction.',
  24: 'Builds the brachialis for thicker arms. Neutral grip is easier on the wrists. Zero spinal load.',
  25: 'Standing cable work with zero spinal load. Keep elbows locked at your sides — let the triceps do all the work.',
  26: 'The overhead position stretches the long head of the tricep for maximum growth. Cable version is safer than dumbbell.',
  27: 'Cable provides constant tension (unlike dumbbells which lose tension at the top). Single-arm option great for imbalance work.',
  28: 'The #1 core exercise for scoliosis. Trains your body to resist rotation — directly counters the rotational forces of scoliosis.',
  29: 'Controlled rotation strengthens the obliques and teaches rotational control. But use with caution — rotation can be risky for some curves.',
  30: 'Seated position = zero spinal load. Can do with dumbbells on knees or on a calf machine.',
  31: 'Excellent for fixing leg-to-leg imbalances common in scoliosis. The balance challenge also trains your core.',
  32: 'Lying on your back = zero spinal load. Teaches your deep core muscles to fire. Do this before every workout as activation.',
  33: 'Classic rehab exercise used by physios worldwide. Trains anti-extension and anti-rotation simultaneously.',
  34: 'Isometric hold = no spinal movement. Strengthens the entire core at once. But proper alignment is critical with scoliosis.',
  35: 'Targets the lats without heavy spinal loading. The cable keeps constant tension throughout.',
  36: 'Single-arm cable work lets you match the effort side-to-side — ideal for correcting shoulder asymmetry from scoliosis.',
};

// Modification instructions
export const exerciseMods: Record<number, string> = {
  1: 'Use dumbbells instead of barbell for independent arm movement. No excessive arching.',
  3: 'Hold dumbbell at chest. Use mirror to check symmetry. Avoid barbell back squats.',
  6: 'Always seated with back support. Use dumbbells. Don\'t overextend overhead.',
  8: 'ONLY with trap bar. Avoid conventional deadlifts! Reduced weight, perfect form.',
  11: 'Watch for equal arm extension.',
  13: 'Set bench to 30-45 degree incline. Avoid going too heavy — focus on controlled reps.',
  15: 'Keep core tight to avoid sagging. Use mirror to check if shoulders are level. Start on knees if needed.',
  18: 'Use dumbbells (not barbell). Keep back neutral at all times. Reduce range of motion if needed. Use mirror.',
  19: 'Keep chin tucked, ribs down. Don\'t hyperextend at the top. Use pad on barbell. Start with bodyweight.',
  20: 'Seated to eliminate momentum. Light weight, controlled movement. Check mirror for even arm height.',
  22: 'Support yourself with one hand on bench. Keep back flat and core braced. Don\'t rotate torso.',
  26: 'Use cable version (not dumbbell) for constant tension. Keep core braced. Don\'t flare elbows.',
  28: 'Stand sideways to cable/band. Press straight out from chest. Resist the rotation — that\'s the exercise.',
  29: 'Use light weight. Control the rotation — don\'t let the cable pull you. Keep hips stable, rotate from the torso.',
  31: 'Keep torso upright. Hold dumbbells at sides. Use wall or rack for balance if needed. Check mirror for lateral lean.',
  34: 'For S-curve: focus on keeping hips level. Use mirror or ask someone to check alignment. Shorten hold time if form breaks.',
  35: 'Keep core tight. Don\'t overextend at the top — stop when arms are parallel to floor.',
  36: 'Stand sideways to cable. Keep slight bend in elbow. One arm at a time — great for imbalance correction.',
};

// Post-surgery fusion modifications
export const exerciseFusionMods: Record<number, string> = {
  1: 'Reduce weight by 30-50%. No arching at all — keep back flat. If upper fusion, use incline only.',
  2: 'Use lighter weight, strict form. Pull to chest only (never behind neck). Keep torso upright, no leaning back.',
  3: 'Only with doctor approval. Partial range of motion. Consider leg press as safer alternative.',
  4: 'Excellent post-surgery! Keep torso stationary. Don\'t lean forward past 90 degrees. Light to moderate weight.',
  5: 'Great post-surgery choice! Spine fully supported. Don\'t let knees come too close to chest. Start with very light weight.',
  6: 'Avoid if upper thoracic fusion. For lumbar fusion: seated with back support, partial ROM, light weight only.',
  7: 'Safe post-surgery. Seated is preferred over standing to eliminate any spinal sway. No momentum.',
  8: 'Avoid post-fusion. Spinal compression + hip hinge motion puts excessive stress on fused and adjacent segments.',
  9: 'Safe post-surgery! Light resistance. Great for rebuilding upper back and shoulder posture.',
  10: 'Good post-surgery. Keep torso completely still — no rotation. Light weight, focus on the squeeze.',
  11: 'Good post-surgery choice. Guided movement with back support. Start very light. Don\'t lock out fully.',
  12: 'Excellent post-surgery! Zero spinal load. Perfect for daily posture maintenance. Start with light band.',
  13: 'Good option for upper fusion patients. Keep weight moderate, no arching.',
  14: 'Safe post-surgery! Keep weight light and focus on the squeeze. Standing or seated both fine.',
  15: 'Proceed with caution. Keep core rigid — no sagging. Wall push-ups or incline push-ups are safer alternatives.',
  16: 'Excellent post-surgery! Spine fully supported by seat. Zero spinal load.',
  17: 'Safe post-surgery. Lying position supports spine. Avoid seated leg curl if lumbar fusion.',
  18: 'Avoid post-fusion. Hip hinge movement puts direct stress on lumbar spine. Use leg curl machine instead.',
  19: 'Proceed with caution for lumbar fusion. Bodyweight or light only. Don\'t hyperextend.',
  20: 'Safe post-surgery! Seated eliminates all spinal sway. Keep weight very light.',
  21: 'Good post-surgery. Machine provides stability. Chest pad supports torso. Keep weight light.',
  22: 'Proceed with caution. Use very light weight. Keep torso completely rigid — no rotation at all.',
  23: 'Good post-surgery. Chest pad provides support. Keep weight light, focus on the squeeze.',
  24: 'Safe post-surgery. Seated preferred. No swinging or momentum.',
  25: 'Safe post-surgery. Keep elbows pinned to sides. No leaning forward. Use rope or bar attachment.',
  26: 'Caution with upper fusion — overhead position can stress thoracic segments. Use pushdowns as alternative.',
  27: 'Safe post-surgery. Constant tension throughout movement. Keep elbows stationary.',
  28: 'Excellent post-surgery! Anti-rotation training is exactly what fused spines need. Keep weight very light.',
  29: 'Avoid post-fusion. Rotational movement directly stresses fused segments. Use Pallof Press as a safe alternative.',
  30: 'Safe post-surgery. Zero spinal load in seated position.',
  31: 'Only for experienced lifters post-surgery. Requires excellent balance. Consider leg press single-leg as safer alternative.',
  32: 'Excellent post-surgery! Lying on back, zero spinal compression. Perfect for rebuilding core activation.',
  33: 'Safe post-surgery. On hands and knees = minimal spinal load. Perfect for rebuilding back stability.',
  34: 'Proceed with caution. Keep hold times short (15-20s). Forearm plank is easier than full plank. Stop if any pain.',
  35: 'Only with light weight. Limit range of motion. Cable version is safer than dumbbell.',
  36: 'Safe post-surgery. Cable provides smooth resistance. Sit on a bench if standing is uncomfortable.',
};

export const muscleGroups = [
  { id: 'all', label: 'All' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'legs', label: 'Legs' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'core', label: 'Core' },
] as const;
