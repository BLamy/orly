import { useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

export const ALPHABET = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'] as const;

export interface AlphabetGroup<T> {
  letter: string;
  items: T[];
}

export function alphabetize<T>(
  items: readonly T[],
  getLabel: (item: T) => string,
  ignoreLeadingArticles = true,
): AlphabetGroup<T>[] {
  const keyOf = (item: T) => {
    const label = getLabel(item).trim();
    return ignoreLeadingArticles ? label.replace(/^(the|a|an)\s+/i, '').trim() || label : label;
  };
  const groups = new Map<string, T[]>();

  for (const item of [...items].sort((a, b) => keyOf(a).localeCompare(keyOf(b)))) {
    const first = keyOf(item).charAt(0).toUpperCase();
    const letter = first >= 'A' && first <= 'Z' ? first : '#';
    const group = groups.get(letter) ?? [];
    group.push(item);
    groups.set(letter, group);
  }

  return ALPHABET
    .filter((letter) => groups.has(letter))
    .map((letter) => ({ letter, items: groups.get(letter)! }));
}

export function AlphabetIndex({
  activeLetters,
  onJump,
  onInteraction,
}: {
  activeLetters: ReadonlySet<string>;
  onJump: (letter: string) => void;
  onInteraction?: () => void;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const lastPickedLetter = useRef<string | null>(null);
  const [bubble, setBubble] = useState<{ letter: string; y: number } | null>(null);

  const pick = (clientY: number) => {
    onInteraction?.();
    const rail = railRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    const index = Math.max(
      0,
      Math.min(ALPHABET.length - 1, Math.floor(((clientY - rect.top) / rect.height) * ALPHABET.length)),
    );
    const letter = ALPHABET[index];
    if (letter !== lastPickedLetter.current) {
      lastPickedLetter.current = letter;
      navigator.vibrate?.(10);
    }
    setBubble({ letter, y: rect.top + ((index + 0.5) / ALPHABET.length) * rect.height });

    let target = index;
    while (target < ALPHABET.length && !activeLetters.has(ALPHABET[target])) target++;
    if (target >= ALPHABET.length) {
      for (target = index; target >= 0 && !activeLetters.has(ALPHABET[target]); target--);
    }
    if (target >= 0 && target < ALPHABET.length) onJump(ALPHABET[target]);
  };

  return (
    <>
      <div
        ref={railRef}
        className="mobile-alpha-index"
        role="scrollbar"
        aria-label="Alphabet index"
        aria-orientation="vertical"
        aria-valuenow={0}
        onPointerDown={(event) => {
          (event.target as Element).setPointerCapture?.(event.pointerId);
          pick(event.clientY);
        }}
        onPointerMove={(event) => event.buttons > 0 && pick(event.clientY)}
        onPointerUp={() => {
          lastPickedLetter.current = null;
          setBubble(null);
        }}
        onPointerCancel={() => {
          lastPickedLetter.current = null;
          setBubble(null);
        }}
      >
        {ALPHABET.map((letter) => (
          <span
            key={letter}
            className={`mobile-alpha-letter${activeLetters.has(letter) ? '' : ' is-dim'}`}
          >
            {letter}
          </span>
        ))}
      </div>
      {bubble && (
        <div className="mobile-alpha-bubble" style={{ top: bubble.y }}>
          {bubble.letter}
        </div>
      )}
    </>
  );
}

export function AlphabetizedList<T>({
  groups,
  renderItem,
  beforeSections,
  rowsClassName = '',
  sectionClassName = '',
  headingClassName = '',
  scrollContainerRef,
  topOffset = () => 0,
  onIndexInteraction,
  indexPortal,
  showIndex = true,
}: {
  groups: readonly AlphabetGroup<T>[];
  renderItem: (item: T) => ReactNode;
  beforeSections?: ReactNode;
  rowsClassName?: string;
  sectionClassName?: string;
  headingClassName?: string;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  topOffset?: () => number;
  onIndexInteraction?: () => void;
  indexPortal?: HTMLElement;
  showIndex?: boolean;
}) {
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const activeLetters = useMemo(() => new Set(groups.map((group) => group.letter)), [groups]);

  const jumpTo = (letter: string) => {
    const section = sectionRefs.current.get(letter);
    if (!section) return;
    const scroller = scrollContainerRef?.current;
    if (scroller) {
      const scrollerTop = scroller.getBoundingClientRect().top;
      scroller.scrollTo({
        top: section.getBoundingClientRect().top - scrollerTop + scroller.scrollTop - topOffset() - 4,
      });
    } else {
      window.scrollTo({
        top: section.getBoundingClientRect().top + window.scrollY - topOffset() - 4,
      });
    }
  };

  const index = (
    <AlphabetIndex
      activeLetters={activeLetters}
      onJump={jumpTo}
      onInteraction={onIndexInteraction}
    />
  );

  return (
    <>
      <div className={rowsClassName || undefined}>
        {beforeSections}
        {groups.map((group) => (
          <section
            key={group.letter}
            className={sectionClassName || undefined}
            ref={(element) => {
              if (element) sectionRefs.current.set(group.letter, element);
              else sectionRefs.current.delete(group.letter);
            }}
          >
            <h2 className={headingClassName || undefined}>{group.letter}</h2>
            {group.items.map(renderItem)}
          </section>
        ))}
      </div>
      {showIndex && (indexPortal ? createPortal(index, indexPortal) : index)}
    </>
  );
}
