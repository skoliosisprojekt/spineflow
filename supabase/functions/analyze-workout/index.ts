// @ts-nocheck — Deno runtime, not Node.js
const OPENAI_API_KEY: string = Deno.env.get('OPENAI_API_KEY') ?? '';
const OPENAI_MODEL = 'gpt-4o-mini';

// ─── Exercise catalog fed to the AI for generate mode ────────────────────────
const EXERCISE_CATALOG = `
Available exercise IDs (ONLY use these):
1: Dumbbell Bench Press | chest | compound
2: Lat Pulldown | back | compound
3: Goblet Squat | legs | compound
4: Seated Cable Row | back | compound
5: Leg Press | legs | compound (machine)
6: Seated Shoulder Press | shoulders | compound
7: Bicep Curls | arms | isolation
8: Trap Bar Deadlift | back | compound (HEAVY — unsafe for lumbar/thoracolumbar/scurve)
9: Cable Face Pulls | shoulders | activation
10: Single-Arm Cable Row | back | compound
11: Chest Press Machine | chest | compound (machine)
12: Resistance Band Pull-Apart | back | activation
13: Incline Dumbbell Press | chest | compound
14: Cable Flyes | chest | isolation
15: Push-Ups | chest | compound (no equipment)
16: Leg Extension | legs | isolation (machine)
17: Lying Leg Curl | legs | isolation (machine)
18: DB Romanian Deadlift | legs | compound (unsafe for lumbar/thoracolumbar/scurve)
19: Hip Thrust | legs | compound
20: Lateral Raises Seated | shoulders | isolation
21: Reverse Pec Deck | shoulders | isolation (machine)
22: Single-Arm Dumbbell Row | back | compound
23: Reverse Fly Machine | back | isolation (machine)
24: Hammer Curls | arms | isolation
25: Tricep Pushdown | arms | isolation
26: Overhead Tricep Extension | arms | isolation
27: Cable Curls | arms | isolation
28: Pallof Press | core | core
29: Cable Woodchop | core | core
30: Seated Calf Raises | legs | isolation
31: Bulgarian Split Squat | legs | compound
32: Dead Bug | core | activation
33: Bird Dog | core | core
34: Plank | core | core
35: Cable Pullover | back | isolation
36: Cable Lateral Raise | shoulders | isolation
`.trim();

// ─── Shared system prompt ─────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an expert physiotherapist and personal trainer specialising in scoliosis rehabilitation and strength training.

Core scoliosis training rules:
- Back exercises must outnumber chest exercises (2:1 ratio minimum)
- Activation exercises (Face Pulls, Band Pull-Apart, Dead Bug) always come first
- Core work (Pallof Press, Bird Dog, Plank) always comes last
- Order: activation → compound (heaviest first) → isolation → core
- Unilateral exercises help correct muscular imbalances
- Prioritise exercises that strengthen the posterior chain and stabilise the spine

--- ANALYSE MODE (default) ---
When no MODE directive is present, analyse the workout and provide personalised recommendations covering:
1. Volume and intensity patterns
2. Muscle group imbalances (flag if back:chest ratio is poor)
3. Safety observations for the user's curve type
4. Recovery and progression notes
Keep the analysis concise and actionable. Use the user's language.
You may optionally append a structured adjustment block:
<adjustments>[ {"type":"add"|"remove"|"adjust", "exercise_id": N, "reason": "...", "replace_with_id": N|null, "suggested_sets": "3x10"|null, "suggested_weight": N|null} ]</adjustments>

--- GENERATE MODE ---
If the user message starts with "MODE: GENERATE", create a workout plan instead of analysing.
Respond ONLY with a <workout> JSON block — no other text.
Format:
<workout>
{"exercises":[{"exerciseId":N,"sets":N,"reason":"...in user language..."},...]}
</workout>
Rules for generate mode:
- ONLY use exerciseIds from the provided catalog
- Respect the equipment list (only include exercises the user can do)
- Avoid exercises flagged unsafe for the user's curve type
- Avoid repeating exercises from the user's last 2 workouts
- Ensure back:chest ratio ≥ 2:1
- Always start with ≥1 activation exercise
- Always end with ≥1 core exercise
- Keep reasons short (1 short sentence in the user's language)`;

// ─── Edge Function handler ────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  if (!OPENAI_API_KEY) {
    return new Response('OpenAI API key not configured', { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const { workoutData, profile, language, mode, generationParams } = body;
  const isGenerateMode = mode === 'generate';
  const lang = language ?? 'en';

  let userMessage: string;

  if (isGenerateMode) {
    const { duration, muscleGroups, recentExerciseIds, equipment } = generationParams ?? {};

    const muscleGroupLine = muscleGroups?.length
      ? `Target muscle groups: ${muscleGroups.join(', ')}`
      : 'Target muscle groups: all (balanced)';

    const recentLine = recentExerciseIds?.length
      ? `Exercises to AVOID (appeared in last 2 workouts): IDs ${recentExerciseIds.join(', ')}`
      : 'No recent workout history — feel free to choose any suitable exercises.';

    const equipLine = equipment?.length
      ? `Available equipment: ${equipment.join(', ')}`
      : 'Available equipment: basic (dumbbells, bodyweight)';

    userMessage = [
      'MODE: GENERATE',
      '',
      `User profile:`,
      `  Curve type: ${profile?.curveType ?? 'thoracic'}`,
      `  Surgery: ${profile?.surgery ?? 'none'}`,
      `  Goal: ${profile?.goal ?? 'posture'}`,
      `  Experience: ${profile?.experience ?? 'beginner'}`,
      `  ${equipLine}`,
      '',
      `Workout duration: ${duration ?? 45} minutes`,
      muscleGroupLine,
      recentLine,
      '',
      `Recent workout history:`,
      workoutData ? workoutData : 'No history available.',
      '',
      `Response language: ${lang}`,
      '',
      EXERCISE_CATALOG,
      '',
      'Generate the workout plan now. Return ONLY the <workout> JSON block.',
    ].join('\n');
  } else {
    userMessage = [
      `Please analyse this workout and provide personalised recommendations.`,
      '',
      `User profile:`,
      `  Curve type: ${profile?.curveType ?? 'unknown'}`,
      `  Surgery: ${profile?.surgery ?? 'none'}`,
      `  Goal: ${profile?.goal ?? 'posture'}`,
      `  Experience: ${profile?.experience ?? 'beginner'}`,
      '',
      `Workout data:`,
      workoutData ?? '(no data)',
      '',
      `Response language: ${lang}`,
    ].join('\n');
  }

  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      max_tokens: isGenerateMode ? 1400 : 900,
      temperature: 0.6,
    }),
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text();
    return new Response(`OpenAI error: ${errText}`, { status: 502 });
  }

  const openaiData = await openaiRes.json();
  const responseText: string = openaiData.choices?.[0]?.message?.content ?? '';

  return new Response(responseText, {
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
