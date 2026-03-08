/**
 * setup-posthog-dashboard.js
 *
 * Creates the "Safe-Gym CEO Overview" dashboard in PostHog with 4 core insights.
 *
 * Required environment variables:
 *   POSTHOG_PERSONAL_API_KEY  – Personal API key (Settings → Personal API Keys)
 *   POSTHOG_PROJECT_ID        – Numeric project ID (visible in any PostHog URL)
 *
 * Usage:
 *   POSTHOG_PERSONAL_API_KEY=phx_xxx POSTHOG_PROJECT_ID=12345 node scripts/setup-posthog-dashboard.js
 */

const POSTHOG_HOST = 'https://eu.posthog.com';

// ── Config ────────────────────────────────────────────────────────────────────

const API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

if (!API_KEY || !PROJECT_ID) {
  console.error('\n❌  Missing required environment variables.');
  console.error('    POSTHOG_PERSONAL_API_KEY  =', API_KEY  ? '✓ set' : '✗ MISSING');
  console.error('    POSTHOG_PROJECT_ID        =', PROJECT_ID ? '✓ set' : '✗ MISSING');
  console.error('\nRun with:');
  console.error(
    '  POSTHOG_PERSONAL_API_KEY=phx_xxx POSTHOG_PROJECT_ID=12345 node scripts/setup-posthog-dashboard.js\n',
  );
  process.exit(1);
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const url = `${POSTHOG_HOST}/api/projects/${PROJECT_ID}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok) {
    throw new Error(
      `PostHog API error ${res.status} on ${method} ${path}\n${JSON.stringify(json, null, 2)}`,
    );
  }
  return json;
}

// ── Insight definitions ───────────────────────────────────────────────────────

function insights(dashboardId) {
  return [
    // ── 1. Onboarding Drop-off Funnel ────────────────────────────────────────
    {
      name: 'Onboarding Drop-off',
      filters: {
        insight: 'FUNNELS',
        date_from: '-30d',
        funnel_window_interval: 14,
        funnel_window_interval_unit: 'day',
        events: [
          {
            id: 'Onboarding Step Completed',
            type: 'events',
            order: 0,
            name: 'Onboarding Step Completed',
          },
          {
            id: 'Onboarding Finished',
            type: 'events',
            order: 1,
            name: 'Onboarding Finished',
          },
        ],
      },
      dashboards: [dashboardId],
    },

    // ── 2. Daily Active Workouts Trend ───────────────────────────────────────
    {
      name: 'Daily Active Workouts',
      filters: {
        insight: 'TRENDS',
        date_from: '-14d',
        interval: 'day',
        display: 'ActionsLineGraph',
        events: [
          {
            id: 'Workout Started',
            type: 'events',
            name: 'Workout Started',
            math: 'total',
          },
        ],
      },
      dashboards: [dashboardId],
    },

    // ── 3. AI vs Manual Workout Generation (Breakdown) ───────────────────────
    {
      name: 'AI vs Manual Generation',
      filters: {
        insight: 'TRENDS',
        date_from: '-14d',
        interval: 'day',
        display: 'ActionsLineGraph',
        breakdown: 'source',
        breakdown_type: 'event',
        events: [
          {
            id: 'Workout Started',
            type: 'events',
            name: 'Workout Started',
            math: 'total',
          },
        ],
      },
      dashboards: [dashboardId],
    },

    // ── 4. Churn — Account Deletions Trend ───────────────────────────────────
    {
      name: 'Churn (Account Deletions)',
      filters: {
        insight: 'TRENDS',
        date_from: '-30d',
        interval: 'day',
        display: 'ActionsLineGraph',
        events: [
          {
            id: 'Account Deleted',
            type: 'events',
            name: 'Account Deleted',
            math: 'total',
          },
        ],
      },
      dashboards: [dashboardId],
    },
  ];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀  PostHog CEO Dashboard Setup');
  console.log(`    Host:       ${POSTHOG_HOST}`);
  console.log(`    Project ID: ${PROJECT_ID}\n`);

  // Step 1: Create dashboard
  process.stdout.write('  [1/5] Creating dashboard "Safe-Gym CEO Overview" … ');
  const dashboard = await api('POST', '/dashboards/', {
    name: 'Safe-Gym CEO Overview',
    description: 'Key product & business metrics: onboarding funnel, workout activity, AI adoption, and churn.',
    pinned: true,
  });
  console.log(`✓  (id: ${dashboard.id})`);

  // Steps 2–5: Create each insight
  const insightDefs = insights(dashboard.id);
  for (let i = 0; i < insightDefs.length; i++) {
    const def = insightDefs[i];
    process.stdout.write(`  [${i + 2}/${insightDefs.length + 1}] Creating insight "${def.name}" … `);
    const insight = await api('POST', '/insights/', def);
    console.log(`✓  (id: ${insight.id})`);
  }

  // Final output
  const dashboardUrl = `${POSTHOG_HOST}/project/${PROJECT_ID}/dashboard/${dashboard.id}`;
  console.log('\n✅  Dashboard created successfully!\n');
  console.log('  🔗  Open it now:');
  console.log(`      ${dashboardUrl}\n`);
}

main().catch((err) => {
  console.error('\n❌  Setup failed:\n', err.message);
  process.exit(1);
});
