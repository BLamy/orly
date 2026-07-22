// A tiny, safe boolean-expression evaluator for the endings' `when` strings
// (e.g. "controlGap <= 82 && shutdownKept && (paused || oversightScaled)").
// The expressions are authored by us (the script), but we still avoid eval():
// a recursive-descent parser over a fixed grammar keeps it self-contained and
// scrub-safe. Grammar: || , && , ! , comparisons (<= >= < > == !=), parens,
// numbers, true/false, and identifiers resolved from the game context.

export type Ctx = Record<string, number | boolean>;

type Tok = { t: string; v?: string };

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  const re = /\s*(<=|>=|==|!=|&&|\|\||[<>!()]|[A-Za-z_][A-Za-z0-9_]*|\d+)/y;
  let m: RegExpExecArray | null;
  let i = 0;
  while (i < src.length) {
    re.lastIndex = i;
    m = re.exec(src);
    if (!m) throw new Error(`bad token in condition at ${i}: ${src.slice(i, i + 12)}`);
    i = re.lastIndex;
    const s = m[1];
    if (/^\d+$/.test(s)) out.push({ t: 'num', v: s });
    else if (/^[A-Za-z_]/.test(s)) out.push({ t: 'id', v: s });
    else out.push({ t: s });
  }
  out.push({ t: 'eof' });
  return out;
}

export function evalCondition(expr: string, ctx: Ctx): boolean {
  const toks = lex(expr);
  let p = 0;
  const peek = () => toks[p];
  const eat = (t?: string) => {
    const tok = toks[p++];
    if (t && tok.t !== t) throw new Error(`expected ${t} got ${tok.t}`);
    return tok;
  };
  const num = (x: number | boolean) => (typeof x === 'boolean' ? (x ? 1 : 0) : x);

  // or → and → not → cmp → primary
  function parseOr(): number | boolean {
    let l = parseAnd();
    while (peek().t === '||') { eat(); const r = parseAnd(); l = Boolean(l) || Boolean(r); }
    return l;
  }
  function parseAnd(): number | boolean {
    let l = parseNot();
    while (peek().t === '&&') { eat(); const r = parseNot(); l = Boolean(l) && Boolean(r); }
    return l;
  }
  function parseNot(): number | boolean {
    if (peek().t === '!') { eat(); return !Boolean(parseNot()); }
    return parseCmp();
  }
  function parseCmp(): number | boolean {
    const l = parsePrimary();
    const op = peek().t;
    if (['<', '>', '<=', '>=', '==', '!='].includes(op)) {
      eat();
      const r = parsePrimary();
      const a = num(l);
      const b = num(r);
      switch (op) {
        case '<': return a < b;
        case '>': return a > b;
        case '<=': return a <= b;
        case '>=': return a >= b;
        case '==': return a === b;
        case '!=': return a !== b;
      }
    }
    return l;
  }
  function parsePrimary(): number | boolean {
    const tok = peek();
    if (tok.t === '(') { eat(); const e = parseOr(); eat(')'); return e; }
    if (tok.t === 'num') { eat(); return parseInt(tok.v!, 10); }
    if (tok.t === 'id') {
      eat();
      if (tok.v === 'true') return true;
      if (tok.v === 'false') return false;
      const val = ctx[tok.v!];
      return val === undefined ? false : val; // undefined flag → false/0
    }
    throw new Error(`unexpected token ${tok.t}`);
  }

  const result = parseOr();
  eat('eof');
  return Boolean(result);
}
