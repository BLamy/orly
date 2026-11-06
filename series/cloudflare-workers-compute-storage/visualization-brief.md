# Cloudflare Workers: Compute and Storage — visual plan

Research and authoring: gpt-6.1-terra. All examples are illustrative; mechanisms and API names are grounded in the cited Cloudflare documentation and, for book one, the supplied Workers SDK digest. Each chapter keeps one visual machine alive across its beats. Stage is 1280 × 720; captions own the bottom strip.

Reusable inventory: Timeline, Camera with cameraInterp, colors and ease from viz/core; local purpose-built SVG machines for mutable request cards, configuration folding, lifetimes, object state, records, and capabilities. The design uses the same pure sampled clock as the existing primitives.

## 1. Workers Have No Server
Requests, bindings, and the life of an isolate · common octopus · #cf542c

### Chapter 1: A request meets an isolate
**Visual machine:** A request card crosses a Worker membrane, turns into a response, and returns.
**On-screen vocabulary:** REQUEST, fetch(request, env, ctx), Request, Response, OUTBOUND FETCH, RESPONSE.

Beat sheet, in narration order:
1. A request arrives, but there is no server for you to keep running.
2. Cloudflare routes the request to a Worker running inside an isolate.
3. In the module format, the exported fetch handler receives the request, the environment, and an execution context.
4. The request describes the incoming method, address, headers, and body.
5. Your handler can compute an answer or fetch another service.
6. It returns a response containing a status, headers, and an optional body.
7. The response travels back to the caller while the platform manages the process around it.
8. Think of the Worker as code invoked for a request, not a machine you administer.

Sources: https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/, https://developers.cloudflare.com/workers/reference/how-workers-works/, series/cloudflare-workers-compute-storage/workers-sdk-digest.txt

### Chapter 2: Bindings make capabilities explicit
**Visual machine:** A configuration strip folds into a typed environment and plugs into a real resource.
**On-screen vocabulary:** wrangler.jsonc, compatibility_date, KV binding, wrangler types, Env, env.MY_KV.

Beat sheet, in narration order:
1. A Worker needs a deliberate way to reach the resources it uses.
2. Wrangler configuration names the Worker, its compatibility date, and its bindings.
3. A binding gives the code a capability to use a resource without placing an account token in every request.
4. The runtime supplies those capabilities on the environment passed to the handler.
5. The Wrangler types command generates an environment type from the configuration and matching runtime definitions.
6. Now the editor can check that the binding name and methods agree with the configured resource.
7. Local development can simulate supported bindings or connect configured remote resources.
8. Keep configuration, generated types, and deployed bindings in agreement as the Worker changes.

Sources: https://developers.cloudflare.com/workers/runtime-apis/bindings/, https://developers.cloudflare.com/workers/languages/typescript/, https://developers.cloudflare.com/workers/wrangler/configuration/, series/cloudflare-workers-compute-storage/workers-sdk-digest.txt

### Chapter 3: A request has a lifetime
**Visual machine:** Overlapping request lanes share one isolate while a bounded background tail follows a response.
**On-screen vocabulary:** ISOLATE, request A, request B, module globals, ctx.waitUntil(), ≤ 30 s.

Beat sheet, in narration order:
1. An isolate may serve more than one request, sometimes with their work overlapping.
2. Module level objects can be reused, but the platform does not promise that the same isolate will always return.
3. Keep each request’s private data inside its handler instead of a shared global variable.
4. Await work that must finish before you construct the response.
5. For a small task that can follow the response, attach its promise to the execution context.
6. The wait can extend execution for up to thirty seconds after the response or a client disconnect.
7. That extension is bounded and is not a guarantee that arbitrary background work completes.
8. For durable retries or long waits, put the work in a queue or a workflow instead.

Sources: https://developers.cloudflare.com/workers/best-practices/workers-best-practices/, https://developers.cloudflare.com/workers/runtime-apis/context/, https://developers.cloudflare.com/workers/platform/limits/

## 2. Durable Objects Have an Address
Identity, storage, and sleeping coordination · American beaver · #725944

### Chapter 1: One name, one coordinator
**Visual machine:** Names become stable addresses; requests from different places converge on the same per-entity coordinator.
**On-screen vocabulary:** room:blue, getByName(), room:blue, room:gold, stub.sayHello(), OBJECT.

Beat sheet, in narration order:
1. A shared room needs one place to coordinate changes from its participants.
2. A Durable Object namespace maps a name to a stable object identity.
3. Asking for the same name yields a stub for the same logical object.
4. The stub alone does not start the object; an invocation sends work to it.
5. Cloudflare places the object and routes callers to its active instance.
6. Different names identify different objects with their own state and storage.
7. An object can leave memory when idle and be recreated when a later event arrives.
8. Choose an identity per entity whose updates must be coordinated together.

Sources: https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/, https://developers.cloudflare.com/durable-objects/api/namespace/, https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/

### Chapter 2: A private transactional notebook
**Visual machine:** A per-object table accepts a transaction, schedules an alarm, and rolls back along a recovery timeline.
**On-screen vocabulary:** ctx.storage.sql.exec(), TRANSACTION, PRIVATE TO OBJECT, setAlarm(), alarm(), PITR · 30 DAYS.

Beat sheet, in narration order:
1. The object needs a notebook that survives the process holding it.
2. Cloudflare recommends the sequel lite storage backend for new Durable Object namespaces.
3. Each object has private, strongly consistent transactional storage attached to its identity.
4. The sequel interface can update rows inside a transaction, atomically with other storage operations on that object.
5. An alarm schedules a future invocation of the object without an incoming request.
6. An alarm can be retried and may run more than once, so its effects should tolerate repetition.
7. Point in time recovery can restore the object’s sequel lite data to a point in the previous thirty days.
8. This private notebook is per object; it is not a transaction spanning separate objects.

Sources: https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/, https://developers.cloudflare.com/durable-objects/api/alarms/

### Chapter 3: The room sleeps but connections stay
**Visual machine:** Client strands remain connected while the object vanishes, then reconstructs from storage and socket attachments.
**On-screen vocabulary:** acceptWebSocket(), CONNECTED, MEMORY, HIBERNATED, constructor(), attachment.

Beat sheet, in narration order:
1. A live room can have connected clients even while nobody is sending messages.
2. The hibernation web socket interface lets an idle object leave memory without disconnecting those clients.
3. Accepting the server socket through the object state enables this hibernation path.
4. While the object sleeps, its ordinary in memory variables are gone.
5. A new event wakes it and runs the constructor again before handling the event.
6. Restore durable room data from storage and connection specific data from socket attachments.
7. The hibernation interface applies when the object is the web socket server, not to outgoing sockets.
8. Treat memory as a cache of the room, and durable storage as the state that survives eviction.

Sources: https://developers.cloudflare.com/durable-objects/best-practices/websockets/, https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/

## 3. A Place for Every Byte
Choose storage by shape and consistency · satin bowerbird · #246a80

### Chapter 1: Choose by access and consistency
**Visual machine:** The same value lands on contrasting read paths: globally cached keys, a private coordinator, and direct object storage.
**On-screen vocabulary:** KV, cached reads, DO SQLite, per entity, R2, strong direct reads.

Beat sheet, in narration order:
1. The right storage depends on the shape of the data and the promise your reader needs.
2. Workers key value storage favors widely distributed reads of values addressed by key.
3. Its caches are eventually consistent, so a different location may briefly read an older value or cached absence.
4. For a single entity that needs coordinated strongly consistent updates, use a Durable Object with private storage.
5. For large objects addressed by key, object storage offers a different interface.
6. Direct reads from R two see completed object writes strongly and globally.
7. A separate cache in front of an object can still serve an older response.
8. Pick the consistency contract before you pick the name that sounds fastest.

Sources: https://developers.cloudflare.com/kv/concepts/how-kv-works/, https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/, https://developers.cloudflare.com/r2/reference/consistency/

### Chapter 2: Objects are not rows
**Visual machine:** A large file becomes independently addressable object parts, while cached copies diverge from the authoritative bucket.
**On-screen vocabulary:** R2 BUCKET, put(key, body), get(key), MULTIPART, DIRECT READ, CACHE.

Beat sheet, in narration order:
1. A photograph, a backup, and a video are naturally stored as objects rather than database rows.
2. An R two bucket holds objects under keys; a Worker binding can put and get those objects.
3. Large uploads can be assembled from parts before the completed object becomes visible.
4. Direct object reads, writes, deletes, and listings have strong consistency guarantees.
5. The service does not charge Internet egress fees for retrieving objects.
6. If a cached custom domain serves the object, that separate cache can outlive an overwrite or deletion.
7. Use versioned names or cache purging when a public cached copy needs to change.
8. Keep metadata and access patterns in mind: an object store is not a relational query engine.

Sources: https://developers.cloudflare.com/r2/, https://developers.cloudflare.com/r2/reference/consistency/, https://developers.cloudflare.com/r2/api/workers/workers-api-reference/

### Chapter 3: Three ways to use SQL
**Visual machine:** Rows flow through three lenses: a D1 database, an object-local SQLite table, and a pooled connection to an existing database.
**On-screen vocabulary:** D1, withSession(), DO SQLite, PRIVATE, HYPERDRIVE, PostgreSQL / MySQL.

Beat sheet, in narration order:
1. Tables and queries can live behind several different Cloudflare interfaces.
2. D one is a managed serverless relational database built on sequel lite.
3. When using read replicas, a session and its bookmarks provide sequential consistency across that session.
4. A Durable Object’s sequel lite database is private to that object and sits alongside its coordinating code.
5. Hyperdrive is different: it helps Workers connect to an existing supported database.
6. It pools connections close to the database and can cache eligible queries.
7. The existing database remains the database; the pool is an access layer.
8. Choose shared relational data, entity local transactions, or an existing database connection according to the workload.

Sources: https://developers.cloudflare.com/d1/, https://developers.cloudflare.com/d1/best-practices/read-replication/, https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/, https://developers.cloudflare.com/hyperdrive/concepts/connection-pooling/

### Chapter 4: Versioned trees and analytical tables
**Visual machine:** A commit tree branches beside events flowing into Iceberg tables and a query lens.
**On-screen vocabulary:** ARTIFACTS, Git commits, branches, BASIN PIPELINES, ICEBERG / R2, BASIN SQL.

Beat sheet, in narration order:
1. Some data is a changing project, while other data is a stream of observations.
2. Artifacts stores versioned files and projects in Git compatible repositories.
3. A Worker can create or inspect a repository, and ordinary Git clients can push or clone it.
4. Branches and commits preserve history instead of treating every version as an unrelated blob.
5. Basin addresses analytics: pipelines ingest and transform data into tables.
6. Its catalog manages Apache Iceberg tables backed by object storage.
7. Basin sequel queries those tables; it is an analytics path rather than a replacement for the application’s transaction store.
8. Use a versioned tree for project history and an analytical table for querying accumulated events.

Sources: https://developers.cloudflare.com/artifacts/, https://developers.cloudflare.com/artifacts/api/workers-binding/, https://developers.cloudflare.com/basin/, https://developers.cloudflare.com/basin-sql/get-started/

## 4. Queues, Logs, and Durable Work
Delivery, replay, and resilient execution · Atlantic salmon · #9a4a3b

### Chapter 1: A queue delivers a task
**Visual machine:** A conveyor leases jobs to a consumer; a failed acknowledgment sends the same job around again.
**On-screen vocabulary:** PRODUCER, Queue.send(), CONSUMER, ack(), retry(), IDEMPOTENCY KEY.

Beat sheet, in narration order:
1. A request should not wait while a slow task works through a backlog.
2. A producer sends a message to a queue, and a consumer processes a batch later.
3. Queues deliver at least once, so a message can occasionally arrive again.
4. A consumer acknowledges successful work and can request a retry for a failure.
5. If processing fails before the acknowledgment is recorded, the task may be delivered again.
6. Give a task a stable identifier and make its side effects safe to repeat.
7. Configure retries and a dead letter queue for messages that cannot be processed successfully.
8. The queue is for distributing work, not for independently replaying a shared history forever.

Sources: https://developers.cloudflare.com/queues/reference/how-queues-works/, https://developers.cloudflare.com/queues/reference/delivery-guarantees/, https://developers.cloudflare.com/queues/configuration/batching-retries/

### Chapter 2: A log keeps its history
**Visual machine:** An ordered strip of records grows while two subscription cursors read it independently and a retention boundary advances.
**On-screen vocabulary:** K2 STREAM, append, subscription A, subscription B, earliest, RETENTION.

Beat sheet, in narration order:
1. A durable log keeps records after a reader has consumed them.
2. K two appends records to an ordered stream and lets independent subscriptions read that history.
3. Each subscription tracks its own progress, so one reader does not advance another.
4. A new subscription can begin at the earliest retained record to replay available history.
5. Records expire according to retention even if a slow subscription has not read them.
6. Delivery is at least once, and workers sharing a subscription are not guaranteed to process records in order.
7. At the time of writing, K two is a public beta for paid Workers accounts, with ten gigabytes per account by default.
8. The default retention is seven days, with up to thirty days by default and higher limits available by request.

Sources: https://developers.cloudflare.com/k2/, https://developers.cloudflare.com/k2/concepts/, https://developers.cloudflare.com/k2/reference/delivery-guarantees/, https://developers.cloudflare.com/k2/platform/limits/

### Chapter 3: A workflow remembers the steps
**Visual machine:** A checkpointed work ribbon survives a failed step, sleeps, resumes, and connects queue and log to one business process.
**On-screen vocabulary:** step.do(), CHECKPOINT, RETRY, step.sleep(), QUEUE / K2, WORKFLOW.

Beat sheet, in narration order:
1. Some jobs are not one task but a sequence that must survive interruption.
2. A workflow records the result of each durable step so completed work can be reused when execution resumes.
3. A failed step can retry with configured delays and backoff.
4. A workflow can sleep or wait for an external event without holding a process open.
5. For example, a queue message can start a workflow for a requested operation.
6. That workflow can perform the operation and publish an event to a log for other subscribers.
7. A retry can repeat side effects, so use stable identifiers and idempotent operations at the boundaries.
8. Queues distribute tasks, logs preserve replayable history, and workflows remember the progress of a process.

Sources: https://developers.cloudflare.com/workflows/get-started/guide/, https://developers.cloudflare.com/workflows/build/sleeping-and-retrying/, https://developers.cloudflare.com/queues/reference/delivery-guarantees/, https://developers.cloudflare.com/k2/reference/delivery-guarantees/

## 5. Beyond the Isolate
Containers, sandboxes, browsers, and platforms · peregrine falcon · #5b5092

### Chapter 1: When you need a Linux process
**Visual machine:** A Worker hands a request to a Durable Object that starts a Linux image with processes and an HTTP service.
**On-screen vocabulary:** WORKER, DURABLE OBJECT, CONTAINER IMAGE, Linux VM, PROCESS, HTTP.

Beat sheet, in narration order:
1. Some workloads need a Linux process or a native dependency rather than only a Worker isolate.
2. Cloudflare Containers run an image you provide inside a Linux virtual machine.
3. A Worker can reach a container through a Durable Object that controls its lifecycle.
4. Inside the image, processes see the filesystem and other resources made available to that container.
5. The Worker can forward requests to an application listening inside the container.
6. Instances can start on demand and stop when idle according to their configuration.
7. Choose this environment when the software really needs its operating system and packaged dependencies.
8. A container extends the Worker application with a different execution environment.

Sources: https://developers.cloudflare.com/containers/, https://developers.cloudflare.com/containers/api/durable-object-container/

### Chapter 2: A sandbox is a trust boundary
**Visual machine:** Untrusted code moves into one of two isolated chambers; allowed capabilities cross a gate while secrets stay outside.
**On-screen vocabulary:** CONTAINER, DYNAMIC WORKER, LOADER.load(), CAPABILITIES, NETWORK, ONE TRUST BOUNDARY.

Beat sheet, in narration order:
1. Untrusted code needs a boundary around the things it can reach.
2. Cloudflare offers sandbox environments based on containers and on dynamic Workers.
3. A container runs a Linux image; a dynamic Worker runs Java Script in an isolate loaded at runtime.
4. The host Worker chooses which bindings or methods to expose and whether network access is allowed.
5. Everything placed inside one sandbox is available to the code running there.
6. Use a separate sandbox for each trust boundary, such as a user or a job.
7. Keep credentials outside when possible, and mediate outbound requests or expose narrow methods.
8. Isolation protects the surrounding application; it does not make untrusted code safe inside its own sandbox.

Sources: https://developers.cloudflare.com/sandbox/, https://developers.cloudflare.com/sandbox/concepts/security/, https://developers.cloudflare.com/dynamic-workers/getting-started/

### Chapter 3: A browser as a service
**Visual machine:** A browser window renders a page, turns into a screenshot, then keeps a session open for multi-step control.
**On-screen vocabulary:** Browser Run, quickAction("screenshot", …), SCREENSHOT, SESSION, Puppeteer / Playwright, BROWSER BINDING.

Beat sheet, in narration order:
1. Some tasks need a real browser to load a page and execute its Java Script.
2. Browser Run hosts headless browser instances on Cloudflare’s network.
3. A quick action handles a common task such as a screenshot or a document capture.
4. A Worker with a browser binding can call supported quick actions directly.
5. For a multi step interaction, open a browser session and drive it with a browser automation tool.
6. Sessions can be managed and reused across requests when the workflow requires it.
7. Quick actions are a convenient interface to a hosted browser, not a replacement for every custom interaction.
8. Choose the smallest browser interface that matches the job.

Sources: https://developers.cloudflare.com/browser-run/, https://developers.cloudflare.com/browser-run/quick-actions/, https://developers.cloudflare.com/browser-run/cdp/session-management/

### Chapter 4: A platform routes tenant code
**Visual machine:** Tenant name tabs select deployed user Workers within a dispatch namespace, each with its own attached bindings.
**On-screen vocabulary:** DISPATCH WORKER, env.DISPATCHER.get(name), DISPATCH NAMESPACE, TENANT A, TENANT B, USER BINDINGS.

Beat sheet, in narration order:
1. A platform may need to run code deployed on behalf of many customers.
2. Workers for Platforms groups user Workers in a dispatch namespace.
3. A dispatch Worker receives a request and selects a user Worker by name.
4. The selected Worker receives the request through its own fetch handler.
5. Bindings attached to a user Worker grant access to resources the platform chooses to provide.
6. Request scoped capabilities can instead be passed through dynamic dispatch properties.
7. The platform is responsible for choosing tenant identity and the capabilities each tenant receives.
8. Together, dispatch and bindings let one platform route requests to many separate user programs.

Sources: https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/get-started/, https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/configuration/bindings/
