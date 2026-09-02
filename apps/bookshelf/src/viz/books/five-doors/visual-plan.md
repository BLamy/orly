# Five Doors — visual plan

Subject: how a Replay QA project matures from testing production once to closing the loop on a
laptop, one environment at a time. Grounding: loop-qa `src/lib/projectEnvironment.ts`
(kinds/triggers), `netlify/functions/lib/environment-schedules.ts` (cadence → cron, 15-minute sweep),
`netlify/functions/lib/project-environments.ts` (resolution order, variable overlay, exclusions),
`docs/github-app/overview.md` + `src/lib/githubTestRun.ts` (parked versions, "Awaiting Deployment"),
`netlify/functions/lib/reverse-proxy-instructions.ts` + `docs/frp-tunnel/*` (replayqa proxy,
connection purpose interactive|ci, allowlisted forward proxy, awaiting_start), and
`src/guidance/core/product-knowledge.md` (explorations, journeys, credits, bug limit).

Throughline: the feedback loop. Every chapter ends with the loop one notch shorter.

## Chapter 1 — Start With Production
Machine: a map of the app's pages. The QA browser (a dot) explores it; visited pages light up;
a chosen path solidifies into a journey and is replayed; a failing step spawns a bug card with a
recording strip. Two dials — budget credits and bug limit — sit beside the map.

## Chapter 2 — Add Staging, Test Every Night
Machine: a 24-hour dial. A staging card is added beside production; its trigger becomes a cron line;
a sweep hand ticks every 15 minutes; crossing 9 PM fills a queue with every approved journey.
Environment variables overlay project logins by name; one journey is excluded for staging.

## Chapter 3 — Let Github Open the Door
Machine: a pull-request lane. A commit enters, a "Replay QA" check spins, the version parks at a
gate labeled Awaiting Deployment; a deployment-status packet delivers the preview URL; the gate opens;
journeys run; the sticky comment fills in and the check concludes.

## Chapter 4 — Bring CI Into the Tunnel
Machine: a CI runner holding the app on localhost. The runner starts the replayqa proxy; the tunnel
(forward proxy with an allowlist → tunnel server, public port 7000) draws itself; QA browsers route
through it; a preview environment is stamped with the github-action trigger.

## Chapter 5 — The Tightest Loop: Your Laptop
Machine: a laptop, a paused project ("Awaiting start"), the same proxy command, "Local computer
connected", Start QA. A journey fails, a fix lands, the rerun passes. Recap: five concentric loop
rings shrink — weekly, nightly, per pull request, per CI job, per save.
