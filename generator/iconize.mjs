// Pick a Noun Project search term for each node/message and attach the icon
// (as a data URI) to the story. Used at generation time and to enhance existing
// books. A storyboard may also supply node.icon / message.icon search terms
// directly (preferred); otherwise we infer one from the label/kind.
import { iconDataUri } from './noun.mjs';

const NODE_KEYWORDS = [
  [/client|browser|frontend|\bui\b|webpage/, 'browser'],
  [/compose|onion|middleware|stack|\blayer|pipeline/, 'layers'],
  [/log\b|logger|logging/, 'list'],
  [/time|clock|timer|latency/, 'clock'],
  [/context|\bctx\b|state|session/, 'cube'],
  [/respond|response|reply|emit/, 'send'],
  [/request|dispatch|incoming/, 'download'],
  [/callback|handler|function|route|router|controller/, 'code'],
  [/database|postgres|\bsql|\bdb\b|datastore|storage/, 'database'],
  [/queue|channel|\bbus\b|stream/, 'queue'],
  [/cache|redis|in-memory|mirror|buffer/, 'memory'],
  [/auth|token|\bkey\b|secret|credential|passkey/, 'key'],
  [/vault|encrypt|cipher/, 'safe'],
  [/user|account|person|customer/, 'user'],
  [/\bfile|vfs|filesystem|\bdisk|folder|directory/, 'folder'],
  [/network|proxy|tunnel|gateway|relay|wireguard|tailscale/, 'shield'],
  [/worker|agent|\bjob\b|task|bot|daemon|runtime/, 'robot'],
  [/\bfly\b|machine|cloud|deploy|\bvm\b|container/, 'cloud'],
  [/\bgit\b|github|repository|\brepo\b/, 'git'],
  [/model|\bai\b|\bllm\b|claude|gpt|openai|anthropic/, 'brain'],
  [/lock|locked/, 'lock'],
  [/server|backend|http|service|api\b/, 'server'],
  [/bridge|host/, 'bridge'],
  [/record|recording|capture|replay/, 'video'],
];
const KIND_TERM = {
  client: 'user', loadbalancer: 'router', service: 'server', database: 'database',
  cache: 'memory', queue: 'queue', worker: 'gear', external: 'cloud',
  vault: 'safe', key: 'key', proxy: 'shield', record: 'file',
};

export function iconTermForNode(n) {
  if (n.iconTerm) return n.iconTerm;
  // match the label/id first (the node's primary concept); only fall back to
  // the sublabel, which is often a generic qualifier ("first middleware").
  const primary = `${n.label || ''} ${n.id || ''}`.toLowerCase();
  for (const [re, term] of NODE_KEYWORDS) if (re.test(primary)) return term;
  const sub = `${n.sublabel || ''}`.toLowerCase();
  for (const [re, term] of NODE_KEYWORDS) if (re.test(sub)) return term;
  return KIND_TERM[n.kind] || 'cube';
}

export function msgIconTerm(m) {
  if (m.iconTerm) return m.iconTerm;
  const hay = `${m.label || ''}`.toLowerCase();
  if (/key|token|auth|cred|secret|passkey|jwt|bearer/.test(hay)) return 'key';
  if (/lock|encrypt|cipher/.test(hay)) return 'lock';
  if (/file|write|patch|save|read|doc|payload|body/.test(hay)) return 'file';
  if (m.kind === 'data') return 'file';
  if (m.kind === 'event') return 'bell';
  return null; // requests/responses keep the plain dot
}

// Mutates story.nodes[].icon and story.steps[].messages[].icon with data URIs.
// `cache` (Map term->result) dedupes downloads across chapters. Returns the set
// of attribution strings used (CC-BY requires displaying them).
export async function applyIcons(story, cache = new Map()) {
  const attribution = new Set();
  const get = async (term) => {
    if (!term) return null;
    if (cache.has(term)) return cache.get(term);
    const r = await iconDataUri(term).catch(() => null);
    cache.set(term, r);
    return r;
  };
  for (const n of story.nodes || []) {
    const r = await get(iconTermForNode(n));
    if (r) { n.icon = r.dataUri; n.iconMode = 'replace'; if (r.attribution) attribution.add(r.attribution); }
  }
  for (const st of story.steps || []) {
    for (const m of st.messages || []) {
      const r = await get(msgIconTerm(m));
      if (r) { m.icon = r.dataUri; if (r.attribution) attribution.add(r.attribution); }
    }
  }
  return [...attribution];
}
