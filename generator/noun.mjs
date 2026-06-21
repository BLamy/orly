// Noun Project API v2 — 2-legged OAuth 1.0a (HMAC-SHA1), zero deps. Returns an
// icon for a search term as a data URI (the API only exposes PNG thumbnails on
// this plan; SVG needs a Pro plan). Attribution is required (CC-BY) — callers
// should surface it.
import crypto from 'node:crypto';

// Read lazily (at call time) so a .env loaded after import still applies.
const getKey = () => process.env.NOUN_PROJECT_KEY || process.env.NOUN_KEY;
const getSecret = () => process.env.NOUN_PROJECT_SECRET || process.env.NOUN_SECRET;

const pctEncode = (s) =>
  encodeURIComponent(s).replace(/[!*'()]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

function authHeader(method, urlStr) {
  const u = new URL(urlStr);
  const oauth = {
    oauth_consumer_key: getKey(),
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
  };
  const all = {};
  for (const [k, v] of u.searchParams) all[k] = v; // query params MUST be signed
  for (const [k, v] of Object.entries(oauth)) all[k] = v;
  const paramStr = Object.keys(all)
    .map((k) => [pctEncode(k), pctEncode(all[k])])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : 1))
    .map((p) => p[0] + '=' + p[1])
    .join('&');
  const base = [method.toUpperCase(), pctEncode(u.origin + u.pathname), pctEncode(paramStr)].join('&');
  const signingKey = pctEncode(getSecret()) + '&';
  oauth.oauth_signature = crypto.createHmac('sha1', signingKey).update(base).digest('base64');
  return 'OAuth ' + Object.keys(oauth).sort().map((k) => pctEncode(k) + '="' + pctEncode(oauth[k]) + '"').join(', ');
}

async function nounGet(urlStr) {
  const res = await fetch(urlStr, { headers: { Authorization: authHeader('GET', urlStr), Accept: 'application/json' } });
  if (!res.ok) throw new Error('Noun API ' + res.status + ': ' + (await res.text()).slice(0, 160));
  return res.json();
}

export function hasNoun() {
  return !!(getKey() && getSecret());
}

const cache = new Map();

export async function iconForTerm(term) {
  if (!hasNoun()) return null;
  if (cache.has(term)) return cache.get(term);
  let result = null;
  try {
    const url = `https://api.thenounproject.com/v2/icon?query=${encodeURIComponent(term)}&limit=1&thumbnail_size=200`;
    const data = await nounGet(url);
    const icon = data.icons?.[0];
    if (icon) result = { id: icon.id, url: icon.thumbnail_url, attribution: icon.attribution, license: icon.license_description };
  } catch (e) {
    console.error(`noun "${term}": ${e.message}`);
  }
  cache.set(term, result);
  return result;
}

/** Resolve a term to { dataUri, attribution } (PNG data URI), or null. */
export async function iconDataUri(term) {
  const r = await iconForTerm(term);
  if (!r) return null;
  try {
    const png = await fetch(r.url);
    if (!png.ok) return null;
    const buf = Buffer.from(await png.arrayBuffer());
    return { dataUri: `data:image/png;base64,${buf.toString('base64')}`, attribution: r.attribution, term };
  } catch {
    return null;
  }
}
