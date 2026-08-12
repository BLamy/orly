// Web Speech narration for chapters that ship no recorded MP3.
//
// When a manifest chapter has no `audio`, the player runs on the timeline's
// own clock and — with this module — speaks each caption through the
// browser's speechSynthesis instead of playing silence. Voice quality varies
// wildly between engines, so the picker ranks whatever the current browser
// offers and takes the best:
//   - Chrome: 'Google UK English Male' — the voice this repo narrated with
//     before ElevenLabs (see viz/engine/narrator, the dev-time narrator).
//   - Safari: user-downloaded Premium/Enhanced voices, then Siri/macOS staples.
//   - Edge: the online 'Natural' voices.
//   - Anything else: best available English voice.
import { useEffect, useRef, useState } from 'react';
import { isSpeechSupported, speechify } from '../viz/engine/narrator';

export const speechSupported = isSpeechSupported;

/** Higher is better. English only — everything else scores 0. */
function scoreVoice(v: SpeechSynthesisVoice): number {
  if (!/^en[-_]?/i.test(v.lang)) return 0;
  const n = v.name;
  let s = 1;
  if (/premium/i.test(n)) s += 500; // Safari, user-downloaded
  else if (/enhanced/i.test(n)) s += 450; // Safari, user-downloaded
  else if (n === 'Google UK English Male') s += 400; // the pre-ElevenLabs house voice
  else if (/natural/i.test(n)) s += 350; // Edge online voices
  else if (n === 'Google US English') s += 300;
  else if (/siri/i.test(n)) s += 250;
  else if (/samantha|ava|zoe|allison/i.test(n)) s += 200; // macOS staples
  else if (/^google/i.test(n)) s += 150;
  if (/^en[-_]GB/i.test(v.lang)) s += 10; // match the house voice's register
  if (v.localService) s += 5; // tiebreak: no network hiccups mid-sentence
  return s;
}

function pickBest(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = 0;
  for (const v of voices) {
    const s = scoreVoice(v);
    if (s > bestScore) {
      best = v;
      bestScore = s;
    }
  }
  return best;
}

/** The best English voice this browser has. Chrome populates getVoices()
 *  asynchronously, so re-pick on `voiceschanged`. */
export function useBestVoice(enabled: boolean): SpeechSynthesisVoice | null {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    if (!enabled || !speechSupported()) return;
    const synth = window.speechSynthesis;
    const pick = () => setVoice(pickBest(synth.getVoices()));
    pick();
    synth.addEventListener('voiceschanged', pick);
    return () => synth.removeEventListener('voiceschanged', pick);
  }, [enabled]);
  return voice;
}

/**
 * Speak `text` whenever it changes while `enabled`. Each new caption cancels
 * the previous utterance (matching the one-pill-at-a-time CC display), and
 * pausing/muting/unmounting cancels outright.
 */
export function useSpokenCaption({
  text,
  enabled,
}: {
  /** The active caption's text, or null when none is on screen. */
  text: string | null;
  /** Speak only while true (chapter has no MP3, player is playing, unmuted). */
  enabled: boolean;
}): void {
  const voice = useBestVoice(enabled);
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  const spokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!speechSupported()) return;
    const synth = window.speechSynthesis;
    if (!enabled || !text) {
      synth.cancel();
      spokenRef.current = null;
      return;
    }
    // Chrome refuses speak() before the first user gesture — and the blocked
    // attempt can wedge the whole playback clock (observed: the rAF-driven
    // timeline froze a few seconds in). Skip until the page has activation;
    // narration joins at the next caption after the first interaction.
    const act = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } })
      .userActivation;
    if (act && !act.hasBeenActive) return;
    // Re-runs also fire when `voice` resolves asynchronously — don't restart
    // a caption that is already being spoken just because the voice loaded.
    if (spokenRef.current === text && (synth.speaking || synth.pending)) return;
    synth.cancel();
    spokenRef.current = text;
    // Small delay avoids a Chrome bug where speak() right after cancel() is
    // dropped (same workaround as the original narrator module).
    const id = window.setTimeout(() => {
      const u = new SpeechSynthesisUtterance(speechify(text));
      const v = voiceRef.current;
      if (v) {
        u.voice = v;
        u.lang = v.lang;
      }
      u.rate = 1;
      u.pitch = 1;
      synth.speak(u);
    }, 60);
    return () => window.clearTimeout(id);
  }, [text, enabled, voice]);

  useEffect(
    () => () => {
      if (speechSupported()) window.speechSynthesis.cancel();
    },
    []
  );
}
