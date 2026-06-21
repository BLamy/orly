import type { Story } from '../types';

// Sample story: how a single request flows through a typical web app.
// Nodes are *revealed* progressively, so the diagram builds up one concept at a
// time and the camera frames whatever exists so far. This is the kind of object
// Phase 2 ("point at a repo") will generate.
export const webAppDataFlow: Story = {
  title: 'The Secret Lives of Data',
  subtitle: 'How a single request flows through a web app',

  nodes: [
    { id: 'browser', label: 'Browser', kind: 'client', x: 6, y: 50, sublabel: 'client app' },
    { id: 'lb', label: 'Load Balancer', kind: 'loadbalancer', x: 26, y: 50, sublabel: 'nginx' },
    { id: 'api', label: 'API Server', kind: 'service', x: 47, y: 50, sublabel: 'app code' },
    { id: 'auth', label: 'Auth Service', kind: 'service', x: 47, y: 15, sublabel: 'identity' },
    { id: 'cache', label: 'Redis', kind: 'cache', x: 71, y: 20, sublabel: 'cache' },
    { id: 'db', label: 'Postgres', kind: 'database', x: 71, y: 50, sublabel: 'source of truth' },
    { id: 'queue', label: 'Job Queue', kind: 'queue', x: 71, y: 80, sublabel: 'async work' },
    { id: 'worker', label: 'Worker', kind: 'worker', x: 93, y: 80, sublabel: 'background' },
  ],

  edges: [
    { id: 'browser-lb', from: 'browser', to: 'lb' },
    { id: 'lb-api', from: 'lb', to: 'api' },
    { id: 'api-auth', from: 'api', to: 'auth' },
    { id: 'api-cache', from: 'api', to: 'cache' },
    { id: 'api-db', from: 'api', to: 'db' },
    { id: 'api-queue', from: 'api', to: 'queue' },
    { id: 'queue-worker', from: 'queue', to: 'worker' },
    { id: 'worker-db', from: 'worker', to: 'db', dashed: true },
  ],

  steps: [
    {
      id: 'cover',
      chapter: 'The Secret Lives of Data',
      cover: true,
      title: 'The life of a request',
      coverSubtitle: 'How a single tap travels through a web app — one step at a time.',
      narration: "We'll follow one request from the browser all the way to the database and back.",
    },
    {
      id: 'browser',
      chapter: 'The client',
      title: 'It starts in the browser',
      narration:
        'Everything begins on the **client** — a browser or mobile app. When you click, it assembles an HTTP request and sends it out over the network.',
      reveal: ['browser'],
      highlight: ['browser'],
    },
    {
      id: 'send',
      chapter: 'The edge',
      title: 'The request goes out',
      narration:
        "The request travels over HTTPS toward your servers. The first thing it reaches isn't your app code — it's the **load balancer**.",
      reveal: ['lb'],
      highlight: ['browser', 'lb'],
      messages: [{ from: 'browser', to: 'lb', kind: 'request', label: 'GET /feed' }],
    },
    {
      id: 'lb',
      chapter: 'The edge',
      title: 'The load balancer spreads traffic',
      narration:
        'A **load balancer** sits in front of many identical API servers and forwards each request to a healthy one. This is how an app serves millions of users without any single machine melting.',
      reveal: ['api'],
      highlight: ['lb', 'api'],
      messages: [{ from: 'lb', to: 'api', kind: 'request' }],
    },
    {
      id: 'auth',
      chapter: 'Who are you?',
      title: 'First, authentication',
      narration:
        'Before doing any real work, the API asks the **auth service**: *is this user who they claim to be?* It validates the session token and hands back the user’s identity.',
      reveal: ['auth'],
      highlight: ['api', 'auth'],
      badges: [{ node: 'auth', text: 'valid', tone: 'ok' }],
      messages: [
        { from: 'api', to: 'auth', kind: 'request', label: 'verify token' },
        { from: 'auth', to: 'api', kind: 'response', label: 'user #42', delay: 1050 },
      ],
    },
    {
      id: 'cache',
      chapter: 'Reading data',
      title: 'Check the cache first',
      narration:
        'Reads dominate most apps, so the API checks **Redis** first. Memory is ~100× faster than disk — if the answer is already cached, we can skip the database entirely.',
      reveal: ['cache'],
      highlight: ['api', 'cache'],
      messages: [{ from: 'api', to: 'cache', kind: 'request', label: 'feed:42' }],
    },
    {
      id: 'miss',
      chapter: 'Reading data',
      title: 'Cache miss',
      narration:
        'This time the cache is empty — a **cache miss**. No problem: we fall back to the source of truth, the database.',
      reveal: ['db'],
      highlight: ['api', 'cache', 'db'],
      badges: [{ node: 'cache', text: 'miss', tone: 'warn' }],
      messages: [
        { from: 'cache', to: 'api', kind: 'response', label: 'miss' },
        { from: 'api', to: 'db', kind: 'request', label: 'SELECT …', delay: 950 },
      ],
    },
    {
      id: 'db',
      chapter: 'Reading data',
      title: 'The database does the real lookup',
      narration:
        '**Postgres** runs the query, reads the rows from disk, and returns exactly the data the request asked for. This is the system’s durable **source of truth**.',
      highlight: ['db', 'api'],
      messages: [{ from: 'db', to: 'api', kind: 'data', label: 'rows' }],
    },
    {
      id: 'warm',
      chapter: 'Reading data',
      title: 'Warm the cache',
      narration:
        'Before responding, the API writes the result back into **Redis**. The next identical request will be a fast cache *hit* — this is why apps feel snappier the second time around.',
      highlight: ['api', 'cache'],
      badges: [{ node: 'cache', text: 'warm', tone: 'ok' }],
      messages: [{ from: 'api', to: 'cache', kind: 'data', label: 'store' }],
    },
    {
      id: 'enqueue',
      chapter: 'Don’t make the user wait',
      title: 'Slow work goes to a queue',
      narration:
        'Some work — sending email, encoding video, rebuilding search — is too slow to finish while the user waits. Instead, the API drops a **job** onto a queue and moves on.',
      reveal: ['queue'],
      highlight: ['api', 'queue'],
      messages: [{ from: 'api', to: 'queue', kind: 'event', label: 'job: notify' }],
    },
    {
      id: 'respond',
      chapter: 'Don’t make the user wait',
      title: 'Respond now, finish later',
      narration:
        'The API can send its response **immediately**, back through the load balancer to the browser. From the user’s point of view, the app is already done.',
      highlight: ['api', 'lb', 'browser'],
      messages: [
        { from: 'api', to: 'lb', kind: 'response', label: '200 OK' },
        { from: 'lb', to: 'browser', kind: 'response', label: '200 OK', delay: 850 },
      ],
    },
    {
      id: 'worker',
      chapter: 'Don’t make the user wait',
      title: 'A worker picks up the job',
      narration:
        'Meanwhile, a separate **worker** process watches the queue. It pulls the job and does the heavy lifting in the background, completely off the request’s critical path.',
      reveal: ['worker'],
      highlight: ['queue', 'worker'],
      messages: [{ from: 'queue', to: 'worker', kind: 'event', label: 'job' }],
    },
    {
      id: 'worker-db',
      chapter: 'Don’t make the user wait',
      title: 'The work completes in the background',
      narration:
        'The worker finishes and writes its results back to the **database** — maybe a sent-email record or a freshly generated thumbnail. The user never waited for any of it.',
      highlight: ['worker', 'db'],
      messages: [{ from: 'worker', to: 'db', kind: 'data', label: 'write' }],
    },
    {
      id: 'recap',
      chapter: 'The whole picture',
      title: 'That’s the data flow',
      narration:
        'One tap, and data moved through a chain of services: **client → load balancer → API → auth → cache → database**, with slow work handed off to a **queue and worker**. Almost every app you use is a variation on this same dance.',
      autoAdvanceMs: 7000,
      messages: [
        { from: 'browser', to: 'lb', kind: 'request', delay: 0, duration: 500 },
        { from: 'lb', to: 'api', kind: 'request', delay: 450, duration: 500 },
        { from: 'api', to: 'db', kind: 'request', delay: 950, duration: 550 },
        { from: 'db', to: 'api', kind: 'data', delay: 1600, duration: 550 },
        { from: 'api', to: 'lb', kind: 'response', delay: 2250, duration: 500 },
        { from: 'lb', to: 'browser', kind: 'response', delay: 2750, duration: 500 },
      ],
    },
  ],
};
