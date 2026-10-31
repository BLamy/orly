// Injected into strudel.cc before any page script (page.addInitScript) by generator/film/score.mjs.
// Tees every OfflineAudioContext.startRendering() result so the driver can pull the float32
// AudioBuffer that Strudel's own "Export to WAV" renderer produced, and records realtime
// AudioContexts (created after the first user gesture) so the driver can wait for audio init.
(() => {
  if (window.__strudelCapture) return;
  const cap = (window.__strudelCapture = { offline: [], contexts: [], forceSampleRate: 48000 });

  const NativeAC = window.AudioContext;
  if (NativeAC) {
    class PatchedAudioContext extends NativeAC {
      constructor(opts = {}) {
        super({ latencyHint: 'playback', sampleRate: cap.forceSampleRate, ...opts });
        cap.contexts.push(this);
      }
    }
    window.AudioContext = PatchedAudioContext;
    window.webkitAudioContext = PatchedAudioContext;
  }

  const origStartRendering = OfflineAudioContext.prototype.startRendering;
  OfflineAudioContext.prototype.startRendering = function () {
    const info = { length: this.length, sampleRate: this.sampleRate, channels: this.numberOfChannels, t0: performance.now() };
    const p = origStartRendering.call(this);
    p.then(
      (buffer) => {
        info.ms = performance.now() - info.t0;
        info.buffer = buffer;
        cap.offline.push(info);
      },
      (err) => {
        info.error = String((err && err.message) || err);
        cap.offline.push(info);
      },
    );
    return p;
  };
})();
