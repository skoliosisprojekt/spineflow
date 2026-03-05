# SpineFlow v2 — Windsurf Installation Guide

## STEP 1: Backup current project

Open Windsurf terminal (Ctrl+`) and run:
```
cd F:\Daten\Spineflow\Windsurf\SpineFlow
git init
git add .
git commit -m "backup before v2 file replacement"
```

## STEP 2: Delete old app code (KEEP node_modules!)

Delete ONLY these folders from your project:
- `app/`
- `lib/`
- `stores/`
- `components/`
- `types/`

DO NOT DELETE: `node_modules/`, `package.json`, `app.json`, `tsconfig.json`, `assets/`, `babel.config.js`

## STEP 3: Copy new files

Extract the ZIP and copy ALL folders into your project root:
- `app/` → `F:\Daten\Spineflow\Windsurf\SpineFlow\app\`
- `lib/` → `F:\Daten\Spineflow\Windsurf\SpineFlow\lib\`
- `stores/` → `F:\Daten\Spineflow\Windsurf\SpineFlow\stores\`
- `components/` → `F:\Daten\Spineflow\Windsurf\SpineFlow\components\`
- `types/` → `F:\Daten\Spineflow\Windsurf\SpineFlow\types\`
- `.env` → `F:\Daten\Spineflow\Windsurf\SpineFlow\.env`
- `.gitignore` → `F:\Daten\Spineflow\Windsurf\SpineFlow\.gitignore`

## STEP 4: Install new dependencies

In Windsurf terminal:
```
cd F:\Daten\Spineflow\Windsurf\SpineFlow
npx expo install expo-sqlite expo-notifications expo-image react-native-url-polyfill
npm install react-native-reanimated lottie-react-native
npx expo install --fix
```

## STEP 5: Test

```
npx expo start --clear
```

Scan QR code with Expo Go on your Pixel 6 Pro.

## STEP 6: Give Windsurf context

Copy the `SpineFlow_Windsurf_ProjectPlan.md` into your project folder too.
Then in Windsurf chat (Ctrl+L), give this prompt:

```
Read SpineFlow_Windsurf_ProjectPlan.md carefully. This is the complete project plan.

The app currently has these screens working:
- Welcome slides (3 value proposition screens)
- Login / Register with age confirmation
- Consent Gate (ToS, Privacy, Disclaimer checkboxes)
- Onboarding (6 steps: surgery, curve type, goal, experience, body type, equipment)
- Home tab (hydration tracking, profile card, quick start)
- Exercises tab (placeholder — needs exercise library with safety badges)
- Workout tab (placeholder — needs set logging)
- Progress tab (placeholder)
- Nutrition tab (placeholder)

Navigation state machine is implemented:
Welcome → Auth → Consent → Onboarding → Tabs

Your next tasks (do ONE at a time, wait for my confirmation):

TASK 1: Build the Exercise Library screen (Exercises tab)
- Load all 36 exercises from data/exercises.ts
- Muscle group filter tabs (All, Chest, Back, Legs, Shoulders, Arms, Core)
- Search bar
- Each card shows: exercise name, muscle group, safety badge (Safe/Modify/Avoid)
- Safety badge uses triple redundancy: color + icon + text (for colorblind users)
- Use getSafety() from lib/safety.ts with user's curve type and surgery from profile store
- Tap card → Exercise Detail screen

Use Google Fonts (Inter) and Material Icons only. No emoji.
Use the theme colors from lib/theme.ts.
Minimum touch target 48x48dp. All elements need accessibilityLabel.
```

## Expected App Flow

1. **Welcome** → 3 slides → "Get Started"
2. **Register** → Email, password, age confirmation → "Create Account"
3. **Consent Gate** → 3 checkboxes (ToS, Privacy, Disclaimer) → "Continue"
4. **Onboarding** → Surgery → Curve → Goal → Experience → Body → Equipment → "Complete"
5. **Home** → Dashboard with hydration, profile, quick start
6. **Exercises** → Library with filters and safety badges
7. **Workout** → Set logging with rest timer
8. **Progress** → History and records
9. **Nutrition** → Calorie and macro tracking

## Files Included (28 TypeScript files + 2 config)

### Foundation (5 files)
- `lib/supabase.ts` — Supabase client (Auth only)
- `lib/theme.ts` — Light + Dark theme colors
- `lib/safety.ts` — getSafety() logic with all fusion overrides
- `types/index.ts` — TypeScript type definitions
- `components/OnboardingStep.tsx` — Reusable onboarding component

### Stores (2 files)
- `stores/authStore.ts` — Auth state, consent, profile completion, welcome seen
- `stores/settingsStore.ts` — Language, theme, units + profile data (surgery, curve, etc.)

### Auth Screens (4 files)
- `app/auth/_layout.tsx` — Auth stack
- `app/auth/login.tsx` — Login with email/password
- `app/auth/register.tsx` — Register with age confirmation
- `app/auth/forgot-password.tsx` — Password reset

### Welcome + Consent (3 files)
- `app/welcome/_layout.tsx` — Welcome stack
- `app/welcome/index.tsx` — 3 value proposition slides
- `app/consent.tsx` — ToS + Privacy + Disclaimer checkboxes

### Onboarding (7 files)
- `app/onboarding/_layout.tsx` — Onboarding stack
- `app/onboarding/surgery.tsx` — Step 1
- `app/onboarding/curve-type.tsx` — Step 2
- `app/onboarding/goal.tsx` — Step 3
- `app/onboarding/experience.tsx` — Step 4
- `app/onboarding/body-type.tsx` — Step 5
- `app/onboarding/equipment.tsx` — Step 6

### Main App (7 files)
- `app/_layout.tsx` — Root layout with navigation state machine
- `app/(tabs)/_layout.tsx` — Tab bar with Material Icons
- `app/(tabs)/index.tsx` — Home dashboard
- `app/(tabs)/exercises.tsx` — Placeholder (Windsurf builds this next)
- `app/(tabs)/workout.tsx` — Placeholder
- `app/(tabs)/progress.tsx` — Placeholder
- `app/(tabs)/nutrition.tsx` — Placeholder

### Config (2 files)
- `.env` — Supabase credentials (NEVER commit to Git)
- `.gitignore` — Excludes node_modules, .env, build files
