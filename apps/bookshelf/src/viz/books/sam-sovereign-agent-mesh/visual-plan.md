# Sovereign Agent Mesh — visual plan

Source: `https://github.com/google/sam`, digest taken from the shallow `main`
checkout at `0fb93d87b89881977cc77589b35c98444b6b5270`.

Throughline: one tool request changes shape as it crosses SAM. It begins as a
local node's identity, becomes an attested Biscuit, earns a mesh route, finds
a provider, and ends as an MCP result.

## Chapter 1 — The identity earns a route

Visual idea: a blank key store grows one persistent identity envelope. The
envelope is filled with the real `EnrollRequest` fields, held against the
control-plane policy grid, then returns as a signed Biscuit plus router
addresses.

Grounding: `internal/node/enroll.go`, `internal/controlplane/server.go`,
`api/sam.proto`, `internal/identity/`.

Beats:

1. Start with an empty `Store`; a single key-shaped object enters when
   `GetOrGenerateKey` calls Ed25519 key-pair generation and `SaveKey`.
2. The node assembles `EnrollRequest`: `jwt`, `peer_id`, `public_key`,
   `requested_role`, and `labels` become visible chips.
3. The request crosses a `POST /register` boundary as protobuf; the exact
   HTTP path stays on screen while the narration explains the exchange.
4. `HandleRegister` verifies the JWT, decodes the peer ID, validates labels,
   and resolves roles. A policy matrix highlights one requested role and
   fades the rejected alternatives.
5. `MintBiscuitToken` stamps the peer fact, role, policy facts, and labels into
   the same envelope; the control-plane public key is shown beside it.
6. The node stores the Biscuit and mesh config, then the returned router
   addresses become the first visible road out of the control plane.
7. Close by carrying the envelope toward a router, with the request now
   carrying proof instead of a bare identity.

## Chapter 2 — The gate before the road

Visual idea: a small libp2p mesh is a set of doors, not a collection of open
arrows. The same Biscuit is presented at each gate; a direct path fades when
`preparePeerAddrs` rejects an unreachable private address, and a relay circuit
opens only after authentication.

Grounding: `internal/router/router.go`, `internal/node/node.go`,
`internal/node/middleware.go`, `internal/node/gate.go`, `api/sam.proto`.

Beats:

1. Bring in `sam-node`, `sam-router`, and a remote peer as three real roles,
   with an empty `authenticatedPeers` map between them.
2. A node opens `AuthProtocolID` and sends an `AuthFrame` containing its
   Biscuit; the packet pauses at the router's gate.
3. `HandleAuthHandshake` verifies the Biscuit against trusted control-plane
   keys, then flips the router's authenticated peer entry.
4. `AuthResponse` returns the router's own Biscuit; `performMutualAuth`
   checks the remote router role before the relationship is reciprocal.
5. A relay reservation and connect attempt animate through
   `relayACL.AllowReserve` and `AllowConnect`; unauthenticated paths are
   crossed out.
6. `preparePeerAddrs` filters failed private addresses and synthesizes a
   `/p2p-circuit` address, so the persistent route changes from direct to
   relay without changing the request.
7. Close on an authenticated path, not a generic network arrow: the route is
   an earned capability.

## Chapter 3 — Interest finds the tool

Visual idea: a provider table is mostly dark until one exact tool name creates
interest. The same `ServiceAnnounce` object fills in routing keys and load
hints, then the query follows the fast gossip path or the catalog fan-out.

Grounding: `internal/node/discovery/discovery.go`,
`internal/node/mcp_handlers.go`, `internal/node/mcp.go`, `api/sam.proto`.

Beats:

1. Show a quiet `GossipSub` field. One provider's `ServiceAnnounce` carries
   `type`, `service_name`, `keys`, `labels`, `active_requests`,
   `latency_ewma_ms`, and `timestamp`.
2. A local `find_remote_tools` intent becomes a single highlighted interest
   key, `review_pr`, while unrelated provider cells stay dim.
3. `Discovery.Ensure` subscribes the consumer to that key; the provider's
   announcement is framed as a routing hint, explicitly separate from
   authorization.
4. `gossipToolRows` turns the provider into a namespaced result such as
   `mcp://code-reviewer/review_pr`; the persistent query row lengthens into
   a catalog entry.
5. If the fast path is empty, `DiscoverRemoteServices` gathers providers and
   `fanOutFetch` opens the catalog path one peer at a time.
6. `fetchRemoteToolCatalogue` calls `list_local_services`, then lists tools
   on each matching MCP service; a small matrix fills as results arrive.
7. Close by spotlighting the selected peer and tool while the rest of the
   matrix fades to a whisper.

## Chapter 4 — One call, many proofs

Visual idea: the selected tool name becomes a travelling MCP session. It is
split into service and tool, authenticated on the stream, handed to the MCP
SDK, and finally rendered as a result. A second egress ribbon shows the
sidecar's HTTP-to-libp2p rewrite as the same request changes transport.

Grounding: `internal/node/mcp.go`, `internal/node/middleware.go`,
`internal/node/gate.go`, `internal/node/sidecar.go`,
`internal/node/mcp_handlers.go`, `api/sam.proto`.

Beats:

1. The local sidecar mounts `/mcp`, `/sam/`, and the OpenAI-compatible routes;
   `call_remote_tool` is the one highlighted entry point.
2. Its `CallRemoteToolParams` fields — `peer_id`, `tool_name`, `arguments`,
   and `required_labels` — collapse into one request card.
3. `ConnectMCPSession` opens `MCPProtocolID`, writes `AuthFrame`, and waits
   for `AuthResponse`; the card cannot move before the ACK.
4. The target's `WithBiscuitAuth` verifies the token, injects the service and
   connection-peer facts, and returns its own identity for mutual checking.
5. `HandleMCPStream` chooses the registered `MCPService` pass-through or the
   internal catalog; the selected service lane lights up.
6. `callMCPToolOnce` uses `SplitToolName`, preserves the structured arguments,
   and calls `session.CallTool`; the result travels back on the same stream.
7. The sidecar egress ribbon rewrites the request to
   `libp2p://peer/service` and adds `X-Sam-Biscuit` while stripping the local
   gate header before the request leaves the node.
8. End on one quiet card: identity, route, discovery, and MCP call are four
   transformations of the same request.
