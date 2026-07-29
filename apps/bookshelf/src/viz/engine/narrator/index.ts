// Text-to-speech narration via the browser's Web Speech API — framework-free,
// SSR-safe (every entry point guards on `window`). This is the dev/edit-time
// voice; published scenes usually bake narration (e.g. ElevenLabs) and drive
// the Player with `audio` instead.
//
// Voice preference: Google UK English Male (a Chrome network voice), falling
// back to any en-GB / en / available voice.
const PREFERRED_VOICE_NAME = 'Google UK English Male';
const PREFERRED_LANG = 'en-GB';

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function allVoices(): SpeechSynthesisVoice[] {
  return isSpeechSupported() ? window.speechSynthesis.getVoices() : [];
}

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = allVoices();
  return (
    voices.find((v) => v.name === PREFERRED_VOICE_NAME && v.lang === PREFERRED_LANG) ||
    voices.find((v) => v.name === PREFERRED_VOICE_NAME) ||
    voices.find((v) => v.lang === PREFERRED_LANG && /male/i.test(v.name)) ||
    voices.find((v) => v.lang === PREFERRED_LANG) ||
    voices.find((v) => /^en[-_]/i.test(v.lang)) ||
    voices[0] ||
    null
  );
}

/**
 * Turn on-screen narration into a smoother *spoken* script: drop markdown, and
 * rewrite code-ish symbols that read terribly aloud — arrows ("->"), the
 * `/__virtual__/` underscores, slashes in paths, parens/braces, camelCase
 * identifiers, etc. — into plain words.
 */
export function speechify(text: string): string {
  return (
    text
      // markdown emphasis / code / links
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[\[([^\]]+)\]\]/g, '$1')
      // drop any stray asterisks left over (e.g. globs like fs/*)
      .replace(/\*/g, ' ')
      // normalize smart quotes so contractions speak cleanly
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      // a period *between* word chars (index.ts, api.machines.dev, Node.js) →
      // spoken "dot" so TTS reads it instead of pausing like a sentence end
      .replace(/(?<=[A-Za-z0-9])\.(?=[A-Za-z0-9])/g, ' dot ')
      // arrows -> spoken "to"
      .replace(/->|→|⇄|⟶/g, ' to ')
      // /__virtual__/ , __sw__ , then any remaining underscores
      .replace(/\/?__([a-z0-9]+)__\/?/gi, ' $1 ')
      .replace(/__/g, ' ')
      .replace(/_/g, ' ')
      // brackets / braces / parens / angles
      .replace(/[(){}\[\]<>]/g, ' ')
      // path & url slashes
      .replace(/\//g, ' ')
      // misc symbols
      .replace(/~/g, ' ')
      .replace(/·/g, ', ')
      .replace(/&/g, ' and ')
      .replace(/\s=\s/g, ' equals ')
      .replace(/\s\|\s/g, ' or ')
      // split camelCase / PascalCase so each word is spoken
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      // tidy stray spaces before punctuation and collapse runs
      .replace(/\s+([.,;:!?])/g, '$1')
      .replace(/\s{2,}/g, ' ')
      .trim()
  );
}

export function cancelSpeech(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

/** Speak `text` in the preferred voice. Cancels anything already speaking. */
export function speak(text: string, opts: { onend?: () => void; onerror?: () => void } = {}): void {
  speakImpl(text, opts, true);
}

/**
 * Speak `text` WITHOUT cutting off whatever is already speaking — utterances
 * queue in the synthesizer. Use for flowing caption narration (each beat
 * finishes its sentence); reserve `speak` for one-off replacements and
 * `cancelSpeech` for pause/seek.
 */
export function speakQueued(text: string, opts: { onend?: () => void; onerror?: () => void } = {}): void {
  speakImpl(text, opts, false);
}

function speakImpl(
  text: string,
  opts: { onend?: () => void; onerror?: () => void },
  cancelFirst: boolean,
): void {
  if (!isSpeechSupported() || !text) return;
  const synth = window.speechSynthesis;
  if (cancelFirst) synth.cancel();

  const run = () => {
    const utter = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    } else {
      utter.lang = PREFERRED_LANG;
    }
    utter.rate = 1;
    utter.pitch = 1;
    if (opts.onend) utter.onend = opts.onend;
    if (opts.onerror) utter.onerror = opts.onerror;
    synth.speak(utter);
  };

  // Voices can load asynchronously; wait once if they're not ready yet.
  const start = () => {
    if (allVoices().length === 0) {
      const handler = () => {
        synth.removeEventListener('voiceschanged', handler);
        run();
      };
      synth.addEventListener('voiceschanged', handler, { once: true });
      synth.getVoices();
    } else {
      run();
    }
  };

  // Small delay avoids a Chrome bug where speak() right after cancel() is dropped.
  window.setTimeout(start, 60);
}
