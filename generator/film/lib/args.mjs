// Tiny CLI arg parser for the film stages (no dependency).
//
//   const a = parseArgs(process.argv.slice(2), { boolean: ['dry-run', 'force'], string: ['slug', 'shots'] });
//   a.slug, a['dry-run'], a._ (positionals). `--k v`, `--k=v`, `--flag`, `--no-flag`.
//   list(a.shots) -> ['a','b'] for comma lists. Unknown flags are kept (strict: true rejects them).
export function parseArgs(argv, spec = {}) {
  const bool = new Set(spec.boolean || []);
  const str = new Set(spec.string || []);
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      out._.push(a);
      continue;
    }
    let k = a.slice(2);
    let v;
    const eq = k.indexOf('=');
    if (eq >= 0) {
      v = k.slice(eq + 1);
      k = k.slice(0, eq);
    }
    if (spec.strict && !bool.has(k) && !str.has(k) && !(k.startsWith('no-') && bool.has(k.slice(3)))) {
      throw new Error(`unknown flag --${k}`);
    }
    if (v === undefined) {
      if (bool.has(k)) v = true;
      else if (k.startsWith('no-') && bool.has(k.slice(3))) {
        k = k.slice(3);
        v = false;
      } else if (i + 1 < argv.length && (!argv[i + 1].startsWith('--') || str.has(k))) v = argv[++i];
      else v = true;
    } else if (bool.has(k)) v = !/^(0|false|no)$/i.test(v);
    out[k] = v;
  }
  for (const [k, d] of Object.entries(spec.default || {})) if (out[k] === undefined) out[k] = d;
  return out;
}

export const list = (v) =>
  v == null || v === true || v === ''
    ? []
    : String(v)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

export const num = (v, d) => (v == null || v === true || v === '' ? d : Number(v));

export function die(msg, code = 1) {
  console.error(`error: ${msg}`);
  process.exit(code);
}

/** The leading `//` comment block of a script (its usage doc), for --help. */
export async function helpText(url) {
  const { readFileSync } = await import('node:fs');
  const lines = readFileSync(new URL(url), 'utf8').split('\n');
  const out = [];
  for (const l of lines.slice(lines[0].startsWith('#!') ? 1 : 0)) {
    if (!l.startsWith('//')) break;
    out.push(l.replace(/^\/\/ ?/, ''));
  }
  return out.join('\n');
}
