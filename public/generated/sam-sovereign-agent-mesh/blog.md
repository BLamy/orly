# Sovereign Agent Mesh

In [google/sam](https://github.com/google/sam), a node does not join the mesh by merely opening a socket. It first earns an identity, proves that identity at the router, discovers a service through an interest-scoped catalog, and only then makes the MCP call. This book follows that path at source revision `0fb93d87b89881977cc77589b35c98444b6b5270`.

## Chapter 1 · The Identity Earns a Route

The node begins locally. `GetOrGenerateKey` loads or creates its libp2p Ed25519 key, then `Enroll` packages the JWT, peer ID, public key, requested role, and labels into an `EnrollRequest`. The request is a protobuf message, not an informal hello.

<figure><img src="/generated/sam-sovereign-agent-mesh/blog/chapter-1-2.png" alt="A sam-node sending an EnrollRequest toward the control plane"><figcaption>The node's local key becomes a concrete enrollment request headed for the control plane.</figcaption></figure>

On the other side, `HandleRegister` verifies the JWT, decodes the peer identity, validates labels, resolves roles, and mints a Biscuit token. The response returns the control plane's public key and router addresses alongside the signed identity. The node saves both the identity and the mesh configuration before it connects onward.

<figure><img src="/generated/sam-sovereign-agent-mesh/blog/chapter-1-6.png" alt="HandleRegister validating an EnrollRequest with a policy grid"><figcaption>Enrollment is a policy decision: verify, resolve, then mint the facts that the node will carry.</figcaption></figure>

<figure><img src="/generated/sam-sovereign-agent-mesh/blog/chapter-1-9.png" alt="A signed Biscuit and saved identity leaving the control plane"><figcaption>The first route arrives with saved identity, router addresses, and signed Biscuit facts.</figcaption></figure>

## Chapter 2 · The Gate Before the Road

The enrollment token is not a free pass. The node opens `AuthProtocolID`, sends an `AuthFrame` containing its Biscuit, and waits for the router's `AuthResponse`. `HandleAuthHandshake` checks the token against trusted control-plane keys before adding the peer to `authenticatedPeers`.

<figure><img src="/generated/sam-sovereign-agent-mesh/blog/chapter-2-4.png" alt="A sam-node presenting a Biscuit at an authentication gate"><figcaption>The router's gate opens only after `VerifyBiscuit` accepts the proof and the peer becomes authenticated.</figcaption></figure>

The proof is mutual: the router sends its own Biscuit back, and the node verifies the other side too. Only after that handshake can the relay ACL allow reservation and connection. A direct private address may fail; address preparation then builds a `/p2p-circuit` path through the router without changing the request itself.

<figure><img src="/generated/sam-sovereign-agent-mesh/blog/chapter-2-7.png" alt="An authenticated peer crossing a relay circuit to a remote peer"><figcaption>Once both peers are trusted, `AllowReserve` and `AllowConnect` turn the relay into a usable road.</figcaption></figure>

## Chapter 3 · Interest Finds the Tool

Discovery is deliberately narrower than the mesh. A `ServiceAnnounce` carries a service type, service name, keys, labels, load, and latency, but it is a signed routing hint rather than authorization. The node expresses interest in the `review_pr` tool, and the discovery layer keeps the provider table focused on that interest.

<figure><img src="/generated/sam-sovereign-agent-mesh/blog/chapter-3-3.png" alt="A provider table connecting a sam-node's interest to a remote service"><figcaption>`ServiceAnnounce` turns a remote service into a provider row keyed to the tool the caller actually wants.</figcaption></figure>

The fast path uses gossip: `Discovery.Ensure` finds providers and `gossipToolRows` produces the `mcp://code-reviewer/review_pr` address. If the fast path has no answer, the node falls back to `DiscoverRemoteServices`, `fanOutFetch`, and `fetchRemoteToolCatalogue`. Either way, discovery finds a candidate; the later Biscuit checks still decide whether the call is allowed.

<figure><img src="/generated/sam-sovereign-agent-mesh/blog/chapter-3-6.png" alt="A gossipToolRows result showing the code-reviewer review_pr tool"><figcaption>The catalog resolves one useful tool identity while keeping the authorization boundary elsewhere.</figcaption></figure>

## Chapter 4 · One Call, Many Proofs

The sidecar gives callers a narrow front door. `CallRemoteToolParams` names the peer, tool, arguments, and required labels. `SplitToolName` separates the service from the tool, and `ConnectMCPSession` opens the MCP protocol stream, sends an `AuthFrame`, reads the `AuthResponse`, and checks labels before exposing a session.

<figure><img src="/generated/sam-sovereign-agent-mesh/blog/chapter-4-3.png" alt="CallRemoteToolParams entering an MCP stream toward a remote service"><figcaption>One call carries its destination, arguments, and required labels into the MCP stream.</figcaption></figure>

At the node gate, `WithBiscuitAuth` reconstructs request context and verifies the token before `HandleMCPStream` forwards the registered service traffic. The final `session.CallTool` produces the structured result. For an outbound web request, the sidecar rewrites the destination as a peer service path and carries the mesh proof as `X-Sam-Biscuit` while stripping the local gate header.

<figure><img src="/generated/sam-sovereign-agent-mesh/blog/chapter-4-8.png" alt="An authenticated MCP stream returning a structured tool result with a mesh proof ribbon"><figcaption>The tool result is the last step in a chain that includes discovery, label checks, mutual authentication, and the Biscuit carried across the service path.</figcaption></figure>

## Sources

- [google/sam](https://github.com/google/sam)
- `internal/node/enroll.go`
- `internal/controlplane/server.go`
- `internal/router/router.go`
- `internal/node/discovery/discovery.go`
- `internal/node/mcp.go`
- `internal/node/mcp_handlers.go`
- `internal/node/sidecar.go`
