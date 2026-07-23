import { useEffect, useMemo, useRef, useState } from 'react';
import { getNode, type Effects } from './graph';
import { applyEffects, applyOnEnter, clearSave, load, newGame, routeNext, save, type GameState } from './gamestate';
import { Stage } from './components/Stage';
import { Hud } from './components/Hud';
import { graphScene } from './scene/graph-scenes';
import './morewrong.css';

const AUDIO_BASE = '/morewrong-audio';
const MUTE_KEY = 'morewrong.muted';
const loadMuted = () => { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } };
const saveMuted = (m: boolean) => { try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* ignore */ } };

const RANK_COLOR: Record<string, string> = {
  good: '#34d399', bad: '#fbbf24', catastrophe: '#fb7185', neutral: '#8da2be',
};

export function MoreWrong() {
  const initial = useMemo(() => load(), []);
  const [state, setState] = useState<GameState>(initial ?? newGame());
  const [started, setStarted] = useState(() => initial != null);
  const [muted, setMuted] = useState(loadMuted);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const node = getNode(state.nodeId);
  const isEnding = node?.kind === 'ending';

  // onEnter effects, once per arrival (StrictMode-safe).
  const appliedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!node) return;
    if (appliedRef.current === state.nodeId) { save(state); return; }
    appliedRef.current = state.nodeId;
    const withEnter = applyOnEnter(state, node.onEnter);
    if (withEnter !== state) setState(withEnter); else save(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.nodeId]);
  useEffect(() => { save(state); }, [state]);

  // Narration: one clip per node (endings included). Subtitle stays on screen.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !node || !started) return;
    a.src = `${AUDIO_BASE}/${state.nodeId}.mp3`;
    a.volume = state.nodeId.includes('meanwhile') ? 0.75 : 1;
    if (muted) { a.pause(); return; }
    a.play().catch(() => { /* autoplay blocked until a gesture — subtitle carries it */ });
  }, [state.nodeId, started, muted, node]);

  const toggleMute = () => setMuted((m) => { const n = !m; saveMuted(n); return n; });
  const restart = () => { clearSave(); setState(newGame()); setStarted(false); appliedRef.current = null; };
  const choose = (nextId: string, effects: Effects | undefined) => setState((s) => applyEffects(s, effects, nextId));
  const advance = (nextId: string) => setState((s) => ({ ...s, nodeId: nextId }));

  const AudioEl = <audio ref={audioRef} preload="none" />;
  const MuteBtn = (
    <button className="mw-mute" onClick={toggleMute} aria-label={muted ? 'unmute' : 'mute'} title={muted ? 'unmute narration' : 'mute narration'}>
      {muted ? '🔇' : '🔊'}
    </button>
  );

  // Title card (fresh game only).
  if (!started) {
    return (
      <div className="mw-root">
        <div className="mw-intro mw-fade">
          <div className="mw-intro-kicker">a game about shipping A.I.</div>
          <h1>MoreWrong</h1>
          <p>You're the founder of a frontier A.I. lab. You have a model, a runway, and a cofounder who keeps saying <i>evals</i>. Every call is a real tradeoff between aligned and <b>shipped</b>. Pick wrong enough and you find out what "misalignment" cashes out to.</p>
          <button className="mw-btn" onClick={() => setStarted(true)}>Start the company →</button>
          <div className="mw-intro-foot">narrated · {muted ? 'muted' : 'sound on'} — toggle any time</div>
        </div>
        {AudioEl}
      </div>
    );
  }

  if (!node) {
    return <div className="mw-root"><div className="mw-ending"><h1>MoreWrong</h1><p>Lost the thread. Start over.</p><button className="mw-btn" onClick={restart}>Restart</button></div>{AudioEl}</div>;
  }

  if (isEnding && node.ending) {
    const rc = RANK_COLOR[node.ending.rank ?? 'neutral'] ?? '#8da2be';
    return (
      <div className="mw-root">
        <Hud stats={state.stats} />
        <div className="mw-stage-wrap mw-fade" key={`stage-${node.id}`}><Stage>{graphScene(node.id, state.stats)}</Stage></div>
        <div className="mw-ending mw-fade" key={`end-${node.id}`}>
          <div className="mw-ending-label" style={{ color: rc }}>ENDING · {node.ending.rank ?? ''}</div>
          <h1 style={{ color: rc }}>{node.ending.title}</h1>
          <p>{node.ending.text}</p>
          <button className="mw-btn" onClick={restart}>Run it back</button>
        </div>
        <div className="mw-footer">{MuteBtn}</div>
        {AudioEl}
      </div>
    );
  }

  const routing = !!node.route?.length;

  return (
    <div className="mw-root">
      <Hud stats={state.stats} />

      <div className="mw-stage-wrap mw-fade" key={`stage-${node.id}`}>
        <Stage>{graphScene(node.id, state.stats)}</Stage>
      </div>

      <div className="mw-beat mw-fade" key={`beat-${node.id}`}><p>{node.beat}</p></div>

      <div className="mw-choices">
        {routing ? (
          <button className="mw-choice" onClick={() => { const to = routeNext(node, state); if (to) advance(to); }}>
            <span className="mw-choice-label">See how it plays out →</span>
          </button>
        ) : (
          (node.choices ?? []).map((c) => (
            <button key={c.next + c.label} className="mw-choice" onClick={() => choose(c.next, c.effects)}>
              <span className="mw-choice-label">{c.label}</span>
              {c.detail && <span className="mw-choice-detail">{c.detail}</span>}
            </button>
          ))
        )}
      </div>

      <div className="mw-footer">
        {MuteBtn}
        <span className="mw-tag">MoreWrong · you are the founder</span>
        <button className="mw-link" onClick={restart}>restart</button>
      </div>
      {AudioEl}
    </div>
  );
}

export default MoreWrong;
