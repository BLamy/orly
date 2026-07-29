import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { addons } from 'storybook/preview-api';
import { onMotionBinding, onMotionTime } from '../core/motion-bus';
import type { MotionBinding } from '../core/motion-bus';
import { cancelSpeech, speakQueued, speechify } from '../narrator';
import { EVT_DOC, EVT_OP, EVT_TIME } from './protocol';
import type { MotionDoc, MotionOp } from './protocol';

/**
 * The preview half of the Motion addon: a global decorator that relays
 * between the story's Player (via the motion bus) and the manager panel
 * (via Storybook's channel). It also does EDIT-time narration — captions
 * spoken with the free in-browser voice while playing; the panel's voice
 * toggle turns it on. Baked narration (e.g. ElevenLabs) only enters at
 * publish, via the Player's `audio` prop.
 */
export function MotionBridge({ children }: { children: ReactNode }) {
  useEffect(() => {
    const channel = addons.getChannel();
    let binding: MotionBinding | null = null;
    let unsubTimeline: (() => void) | null = null;
    let docTimer = 0;
    let voiceOn = false;

    const emitDoc = () => {
      if (!binding) {
        channel.emit(EVT_DOC, null);
        return;
      }
      const d = binding.timeline.describe();
      const doc: MotionDoc = {
        channels: d.channels,
        captions: d.captions,
        duration: binding.timeline.duration,
        file: binding.file,
        slug: binding.slug,
        overrides: binding.timeline.exportOverrides(),
        narration: binding.timeline.exportNarration(),
      };
      channel.emit(EVT_DOC, doc);
    };
    const scheduleDoc = () => {
      window.clearTimeout(docTimer);
      docTimer = window.setTimeout(emitDoc, 80);
    };

    const offBinding = onMotionBinding((b) => {
      unsubTimeline?.();
      binding = b;
      unsubTimeline = b ? b.timeline.subscribe(scheduleDoc) : null;
      emitDoc();
    });

    let lastEmit = 0;
    let lastPlaying = false;
    let lastSpoken: number | null = null;
    let lastT = 0;
    const offTime = onMotionTime(({ t, playing, looping }) => {
      const now = performance.now();
      if (playing !== lastPlaying || now - lastEmit > 33) {
        lastEmit = now;
        channel.emit(EVT_TIME, { t, playing, looping });
      }
      if (playing !== lastPlaying && !playing) cancelSpeech();
      lastPlaying = playing;

      // edit-time narration: speak a caption when the playhead enters it
      // during continuous playback (never on seeks/jumps)
      const jumped = Math.abs(t - lastT) > 0.3;
      lastT = t;
      if (!voiceOn || !playing || !binding) return;
      const current = binding.timeline.sample(t).captions[0];
      if (current && current.id !== lastSpoken) {
        lastSpoken = current.id;
        if (!jumped) speakQueued(speechify(current.text));
      }
    });

    const onOp = (op: MotionOp) => {
      if (op.op === 'voice') {
        voiceOn = op.on;
        if (!op.on) cancelSpeech();
        return;
      }
      if (!binding) return;
      switch (op.op) {
        case 'kf':
          binding.timeline.updateKeyframe(op.id, op.patch);
          break;
        case 'cap':
          binding.timeline.updateCaption(op.id, op.patch);
          break;
        case 'seek':
          binding.controls.seek(op.t);
          break;
        case 'toggle':
          binding.controls.toggle();
          break;
        case 'loop':
          binding.controls.setLooping(op.on);
          break;
        case 'reset':
          binding.timeline.resetOverrides();
          break;
      }
    };
    channel.on(EVT_OP, onOp);

    return () => {
      channel.off(EVT_OP, onOp);
      offBinding();
      offTime();
      unsubTimeline?.();
      window.clearTimeout(docTimer);
      cancelSpeech();
    };
  }, []);

  return <>{children}</>;
}
