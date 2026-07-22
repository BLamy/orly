import { useEffect, useMemo, useRef, useState } from 'react';
import { BOOKS, bookOf, findNode, type Ending } from './data';
import { applyEffects, applyOnEnter, clearSave, load, newGame, pickEnding, save, type GameState } from './state';
import { Stage } from './components/Stage';
import { Meter } from './components/Meter';
import { GenericScene } from './scene/GenericScene';
import { bookScene } from './scene/registry';
import './morewrong.css';

function Scene({ nodeId, controlGap }: { nodeId: string; controlGap: number }) {
  const bn = bookOf(nodeId);
  const book = BOOKS[bn];
  const art = bookScene(bn);
  if (art) {
    const el = art({ nodeId, controlGap });
    if (el) return <>{el}</>;
  }
  return <GenericScene nodeId={nodeId} controlGap={controlGap} concept={book?.concept ?? ''} />;
}

function EndingView({ ending, onRestart }: { ending: Ending; onRestart: () => void }) {
  return (
    <div className="mw-ending">
      <div className="mw-ending-label">ENDING</div>
      <h1>{ending.title}</h1>
      <p>{ending.text}</p>
      <button className="mw-btn" onClick={onRestart}>Begin again</button>
    </div>
  );
}

export function MoreWrong() {
  const [state, setState] = useState<GameState>(() => load() ?? newGame());
  const [showGrounding, setShowGrounding] = useState(false);

  const found = findNode(state.nodeId);
  const bn = bookOf(state.nodeId);
  const book = BOOKS[bn];

  // Apply onEnter effects exactly once per node arrival, then persist. The ref
  // guard keeps StrictMode's double effect-invoke (dev) from applying a node's
  // meter/flag effects twice.
  const appliedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!found) return;
    if (appliedRef.current === state.nodeId) {
      save(state);
      return;
    }
    appliedRef.current = state.nodeId;
    const withEnter = applyOnEnter(state, found.node.onEnter);
    if (withEnter !== state) setState(withEnter);
    else save(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.nodeId]);

  useEffect(() => { save(state); }, [state]);

  const isEnding = bn === 20 && found?.node.terminal;
  const ending = useMemo(() => (isEnding ? pickEnding(state) : null), [isEnding, state]);

  if (!found) {
    return (
      <div className="mw-root"><div className="mw-ending"><h1>MoreWrong</h1>
        <p>Save pointed at an unknown scene. Start over.</p>
        <button className="mw-btn" onClick={() => { clearSave(); setState(newGame()); }}>Begin</button>
      </div></div>
    );
  }

  const restart = () => { clearSave(); setState(newGame()); setShowGrounding(false); };

  if (isEnding && ending) {
    return (
      <div className="mw-root">
        <Meter value={state.controlGap} book={bn} bookTitle={book?.title ?? ''} />
        <EndingView ending={ending} onRestart={restart} />
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

      <div className="mw-stage-wrap">
        <Stage>
          <Scene nodeId={node.id} controlGap={state.controlGap} />
        </Stage>
      </div>

      <div className={`mw-beat${meanwhile ? ' mw-meanwhile' : ''}`}>
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
    </div>
  );
}

export default MoreWrong;
