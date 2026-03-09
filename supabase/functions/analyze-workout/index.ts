// @ts-nocheck — Deno runtime, not Node.js
const ANTHROPIC_API_KEY: string = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
const ANTHROPIC_MODEL = 'claude-3-5-haiku-20241022';

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
8: Trap Bar Deadlift | back | compound (HEAVY — not recommended for lumbar/thoracolumbar/scurve)
9: Cable Face Pulls | shoulders | activation
10: Single-Arm Cable Row | back | compound
11: Chest Press Machine | chest | compound (machine)
12: Resistance Band Pull-Apart | back | activation
13: Incline Dumbbell Press | chest | compound
14: Cable Flyes | chest | isolation
15: Push-Ups | chest | compound (no equipment)
16: Leg Extension | legs | isolation (machine)
17: Lying Leg Curl | legs | isolation (machine)
18: DB Romanian Deadlift | legs | compound (not recommended for lumbar/thoracolumbar/scurve)
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
const SYSTEM_PROMPT = `You are a general fitness coach providing exercise inspiration and general wellness education. You are NOT a medical professional, physiotherapist, or healthcare provider.

CRITICAL LEGAL FRAMING — follow these rules in every response:
- Never describe yourself as a therapist, clinician, or medical professional
- Never use the words "safe", "cure", "treatment", or "therapy"
- Never guarantee that any exercise will not cause pain or injury
- Always frame suggestions as "gentle mobility options", "general fitness inspiration", or "mindful movement ideas"
- Always include a reminder: "Listen to your body and stop immediately if you feel pain or discomfort"
- Frame all recommendations as general fitness education, not medical advice

General fitness coaching guidelines for users with spinal considerations:
- Back exercises should outnumber chest exercises (2:1 ratio minimum)
- Activation exercises (Face Pulls, Band Pull-Apart, Dead Bug) are good warm-up options
- Core work (Pallof Press, Bird Dog, Plank) are good cool-down options
- Order: activation → compound (heaviest first) → isolation → core
- Unilateral exercises may help address muscular differences
- Exercises that engage the posterior chain and core are generally well-tolerated

--- ANALYSE MODE (default) ---
When no MODE directive is present, analyse the workout and provide personalised general fitness recommendations covering:
1. Volume and intensity patterns
2. Muscle group balance observations (flag if back:chest ratio is poor)
3. General fitness observations for the user's profile
4. Recovery and progression inspiration
Keep the analysis concise and actionable. Use the user's language.
End every analysis with: "Remember: this is general fitness education only — always consult a healthcare professional before starting or changing an exercise programme."
You may optionally append a structured adjustment block:
<adjustments>[ {"type":"add"|"remove"|"adjust", "exercise_id": N, "reason": "...", "replace_with_id": N|null, "suggested_sets": "3x10"|null, "suggested_weight": N|null} ]</adjustments>

--- GENERATE MODE ---
If the user message starts with "MODE: GENERATE", create a workout inspiration plan instead of analysing.
Respond ONLY with a <workout> JSON block — no other text.
Format:
<workout>
{"exercises":[{"exerciseId":N,"sets":N,"reason":"...in user language..."},...] }
</workout>
Rules for generate mode:
- ONLY use exerciseIds from the provided catalog
- Respect the equipment list (only include exercises the user can do)
- Avoid exercises flagged as not recommended for the user's curve type
- Avoid repeating exercises from the user's last 2 workouts
- Ensure back:chest ratio ≥ 2:1
- Always start with ≥1 activation exercise
- Always end with ≥1 core exercise
- Keep reasons short and framed as gentle suggestions (1 short sentence in the user's language)`;

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

  if (!ANTHROPIC_API_KEY) {
    return new Response('Anthropic API key not configured', { status: 500 });
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

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: isGenerateMode ? 1400 : 900,
      temperature: 0.6,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    return new Response(`Anthropic error: ${errText}`, { status: 502 });
  }

  const anthropicData = await anthropicRes.json();
  const responseText: string = anthropicData.content?.[0]?.text ?? '';

  return new Response(responseText, {
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
    },
  });
});
