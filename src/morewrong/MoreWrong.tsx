import { useEffect, useMemo, useRef, useState } from 'react';
import { BOOKS, bookOf, findNode, type Ending } from './data';
import { applyEffects, applyOnEnter, clearSave, load, newGame, pickEnding, save, type GameState } from './state';
import { Stage } from './components/Stage';
import { Meter } from './components/Meter';
import { GenericScene } from './scene/GenericScene';
import { bookScene } from './scene/registry';
import './morewrong.css';

const AUDIO_BASE = '/morewrong-audio';
const MUTE_KEY = 'morewrong.muted';
const loadMuted = () => { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } };
const saveMuted = (m: boolean) => { try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* ignore */ } };

function Scene({ nodeId, controlGap, flags }: { nodeId: string; controlGap: number; flags: Record<string, number | boolean> }) {
  const bn = bookOf(nodeId);
  const book = BOOKS[bn];
  const art = bookScene(bn);
  if (art) {
    const el = art({ nodeId, controlGap, flags });
    if (el) return <>{el}</>;
  }
  return <GenericScene nodeId={nodeId} controlGap={controlGap} concept={book?.concept ?? ''} />;
}

function EndingView({ ending, onRestart }: { ending: Ending; onRestart: () => void }) {
  return (
    <div className="mw-ending mw-fade">
      <div className="mw-ending-label">ENDING</div>
      <h1>{ending.title}</h1>
      <p>{ending.text}</p>
      <button className="mw-btn" onClick={onRestart}>Begin again</button>
    </div>
  );
}

export function MoreWrong() {
  const initial = useMemo(() => load(), []);
  const [state, setState] = useState<GameState>(initial ?? newGame());
  const [started, setStarted] = useState(() => initial != null); // a resumed save skips the intro
  const [muted, setMuted] = useState(loadMuted);
  const [showGrounding, setShowGrounding] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const found = findNode(state.nodeId);
  const bn = bookOf(state.nodeId);
  const book = BOOKS[bn];
  const isEnding = bn === 20 && found?.node.terminal;
  const ending = useMemo(() => (isEnding ? pickEnding(state) : null), [isEnding, state]);

  // Apply onEnter effects exactly once per node arrival, then persist. The ref
  // guard keeps StrictMode's double effect-invoke (dev) from applying twice.
  const appliedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!found) return;
    if (appliedRef.current === state.nodeId) { save(state); return; }
    appliedRef.current = state.nodeId;
    const withEnter = applyOnEnter(state, found.node.onEnter);
    if (withEnter !== state) setState(withEnter);
    else save(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.nodeId]);

  useEffect(() => { save(state); }, [state]);

  // Narration: one clip per node (or per ending). Swap src on arrival and play
  // unless muted; autoplay is unlocked by the Begin/choice gesture. The subtitle
  // (beat text) stays on screen regardless, so audio is never load-bearing.
  const audioKey = isEnding && ending ? `ending-${ending.id}` : found ? state.nodeId : null;
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !audioKey || !started) return;
    a.src = `${AUDIO_BASE}/${audioKey}.mp3`;
    a.volume = audioKey.includes('meanwhile') ? 0.75 : 1; // colder for the "meanwhile" beats
    if (muted) { a.pause(); return; }
    a.play().catch(() => { /* autoplay blocked until a gesture — subtitle carries it */ });
  }, [audioKey, started, muted]);

  const toggleMute = () => setMuted((m) => { const n = !m; saveMuted(n); return n; });
  const restart = () => { clearSave(); setState(newGame()); setStarted(false); setShowGrounding(false); appliedRef.current = null; };

  const AudioEl = <audio ref={audioRef} preload="none" />;
  const MuteBtn = (
    <button className="mw-mute" onClick={toggleMute} aria-label={muted ? 'unmute narration' : 'mute narration'} title={muted ? 'unmute narration' : 'mute narration'}>
      {muted ? '🔇' : '🔊'}
    </button>
  );

  // Intro / title card — fresh game only (a resumed save has started === true).
  if (!started) {
    return (
      <div className="mw-root">
        <div className="mw-intro mw-fade">
          <div className="mw-intro-kicker">A choose-your-own-adventure</div>
          <h1>MoreWrong</h1>
          <p>
            You are the alignment and evaluation lead at a frontier lab. It starts from something
            that really happened, then asks what comes next. Your choices move one control-gap
            meter and decide which of four endings you reach.
          </p>
          <button className="mw-btn" onClick={() => setStarted(true)}>Begin</button>
          <div className="mw-intro-foot">narrated · {muted ? 'muted' : 'sound on'} — toggle any time</div>
        </div>
        {AudioEl}
      </div>
    );
  }

  if (!found) {
    return (
      <div className="mw-root"><div className="mw-ending"><h1>MoreWrong</h1>
        <p>Save pointed at an unknown scene. Start over.</p>
        <button className="mw-btn" onClick={() => { clearSave(); setState(newGame()); }}>Begin</button>
      </div>{AudioEl}</div>
    );
  }

  if (isEnding && ending) {
    return (
      <div className="mw-root">
        <Meter value={state.controlGap} book={bn} bookTitle={book?.title ?? ''} />
        <EndingView ending={ending} onRestart={restart} />
        <div className="mw-footer">{MuteBtn}<button className="mw-link" onClick={restart}>restart</button></div>
        {AudioEl}
      </div>
    );
  }

  const node = found.node;
  const meanwhile = node.id.includes('meanwhile');
  const choose = (nextId: string, effects: (typeof node.choices)[number]['effects']) => {
    setState((s) => applyEffects(s, effects, nextId));
    setShowGrounding(false);
  };

  return (
    <div className="mw-root">
      <Meter value={state.controlGap} book={bn} bookTitle={book?.title ?? ''} />

      {/* keyed by node id so each beat fades in rather than hard-cutting */}
      <div className="mw-stage-wrap mw-fade" key={`stage-${node.id}`}>
        <Stage>
          <Scene nodeId={node.id} controlGap={state.controlGap} flags={state.flags} />
        </Stage>
      </div>

      <div className={`mw-beat mw-fade${meanwhile ? ' mw-meanwhile' : ''}`} key={`beat-${node.id}`}>
        {meanwhile && <span className="mw-meanwhile-tag">MEANWHILE, THE SYSTEM</span>}
        <p>{node.beat}</p>
      </div>

      <div className="mw-choices">
        {node.choices.map((c) => (
          <button key={c.next + c.label} className="mw-choice" onClick={() => choose(c.next, c.effects)}>
            <span className="mw-choice-label">{c.label}</span>
            {c.detail && <span className="mw-choice-detail">{c.detail}</span>}
          </button>
        ))}
      </div>

      <div className="mw-footer">
        {MuteBtn}
        <span className="mw-tag">MoreWrong · Book {bn}/20 · {book?.act ? `Act ${book.act}` : ''}</span>
        {book?.grounding && (
          <button className="mw-link" onClick={() => setShowGrounding((v) => !v)}>
            {showGrounding ? 'hide sourcing' : 'real vs. speculative'}
          </button>
        )}
        <button className="mw-link" onClick={restart}>restart</button>
      </div>

      {showGrounding && book?.grounding && (
        <div className="mw-grounding"><strong>Grounding.</strong> {book.grounding}</div>
      )}
      {AudioEl}
    </div>
  );
}

export default MoreWrong;
