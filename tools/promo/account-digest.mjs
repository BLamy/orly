#!/usr/bin/env node
// Redacted, citable facts from the user's own Replay QA account (capture/api/*, gitignored) for the film's
// research: counts, settings, environments/schedules, the featured bug reports. Never login variables, tokens
// or e-mails. Writes films/<slug>/research/sources/account-digest.json and fails if a redaction literal survives.
import fs from 'node:fs';
import path from 'node:path';
const slug = process.argv[process.argv.indexOf('--slug') + 1];
const API = path.resolve('films', slug, 'capture', 'api');
const OUT = path.resolve('films', slug, 'research', 'sources', 'account-digest.json');
const j = (f) => JSON.parse(fs.readFileSync(path.join(API, f), 'utf8'));
const items = (f) => { const d = j(f); return d.items ?? d; };
const bugsOf = (prefix) => fs.readdirSync(API).filter((f) => f.startsWith(prefix)).flatMap(items);
const pick = (b) => ({ id: b.id, title: b.title, status: b.status, severity: b.severity, polish_category: b.polish_category, discovered_at: b.discovered_at, description: b.description, actual_behavior: b.actual_behavior, expected_behavior: b.expected_behavior, replay_recording_id: b.replay_recording_id });
const ef = bugsOf('ef-bugs-p');
const efpr = [...bugsOf('efpr-bugs-p'), ...items('electric-forest-pr-465-bugs.json')];
const find = (arr, re) => arr.find((b) => re.test(b.title));
const status = (f) => j(f);
const projects = items('projects.json');
const scrubEmail = (s) => (typeof s === 'string' ? s.replace(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g, '<email>') : s);
const digest = {
  source: 'Replay QA account of the requester (qa.replay.io), read through the signed-in web app API on 2026-10-14; redacted',
  insights: {
    url: 'https://qa.replay.io/insights',
    projects: 50, total_bugs: 711, open_bugs: 389, resolution_rate: '29%', journeys: 1151, explorations: 89,
    severity: { critical: 4, high: 238, medium: 369, low: 100 },
    discovery_source: { journey_testing: { bugs: 258, share: '36%' }, polish_analysis: { bugs: 453, share: '64%' } },
  },
  projects_total: projects.length,
  per_pull_request_projects: projects.filter((p) => /PR #\d+/.test(p.name)).map((p) => p.name),
  projects: {
    'Electric Forest': status('ef-status.json'),
  },
  settings_page_facts: {
    url_example: 'https://qa.replay.io/projects/<id>/settings',
    header: 'How this project is configured. Edit settings and environment schedules here, or ask QA in the chat — both make the same change.',
    polish_passes: 'Network Performance, React Rendering, Layout Shift, Glitches, User Experience, Accessibility, UI Details (7 enabled)',
    environments_example: 'Production · https://collaborative-ai-editor.brett-lamy.workers.dev/ · Tue at 3:00 AM · America/New_York',
    add_environment: 'Add production, staging, development, preview, or local configuration.',
    integrations: ['Vercel preview access', 'GitHub', 'Issue tracker', 'Logins & variables'],
    other: ['Project status: Active — Running test loops automatically.', 'Budget: credits QA may spend before the project pauses', 'Processing concurrency: containers running QA at once (5 max)', 'Security testing: probe for injection, access-control and data-exposure bugs'],
  },
  new_project_page: { heading: 'Set up QA for your app', sub: "Enter your app's URL and I'll walk you through the rest in a quick chat.", agent_prompt: 'Use Replay QA to test and fix this app. Start at https://docs.replay.io/llms.txt and follow it.' },
  bug_statuses_seen: [...new Set([...ef, ...efpr].map((b) => b.status))],
  featured_bugs: {
    react_commit_67ms: pick(find(efpr, /67ms React commit/)),
    navigation_commit_56ms: pick(find(efpr, /56ms navigation commit/)),
    live_sync_258: pick(find(ef, /258 times/)),
    board_poll_105: pick(find(ef, /every ~800ms/)),
  },
  electric_forest_bug_categories: ef.reduce((m, b) => ((m[b.polish_category ?? 'journey'] = (m[b.polish_category ?? 'journey'] ?? 0) + 1), m), {}),
};
let json = JSON.stringify(digest, (k, v) => scrubEmail(v), 2);
const lit = fs.existsSync(path.join(API, 'redact.local.json')) ? j('redact.local.json').redact : [];
const leaks = lit.filter((s) => json.includes(s));
if (leaks.length) { console.error(`LEAK: ${leaks.length} literal(s)`); process.exit(3); }
fs.writeFileSync(OUT, json + '\n');
console.log(`${path.relative(process.cwd(), OUT)}: ${json.length} B, featured bugs: ${Object.entries(digest.featured_bugs).filter(([, b]) => b?.id).map(([k]) => k).join(', ')}`);
