"""Synthesize a chapter's spoken segments with kyutai pocket-tts.

Called by tts-pocket.mjs — not meant to be run by hand. Reads a job file
{"voice": str, "segments": [str, ...], "outDir": str}, writes one raw PCM
file per segment (mono, signed 16-bit little-endian, model sample rate) to
outDir/seg-<i>.pcm, and prints {"sampleRate": int, "durations": [float]} as
the last stdout line. Progress goes to stderr.

Requires: pip install pocket-tts  (or run via `uv run --with pocket-tts`).
"""
import json
import os
import sys


def main() -> None:
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        job = json.load(f)
    voice = job.get("voice") or "alba"
    segments = job["segments"]
    out_dir = job["outDir"]

    print(f"pocket-tts: loading model (voice={voice}) …", file=sys.stderr)
    from pocket_tts import TTSModel  # deferred: import is slow

    model = TTSModel.load_model()
    sample_rate = int(model.sample_rate)

    durations = []
    for i, text in enumerate(segments):
        # A fresh voice state per segment: generate_audio may advance the
        # state, and independent segments must not bleed into each other.
        state = model.get_state_for_audio_prompt(voice)
        audio = model.generate_audio(state, text)  # 1-D float tensor in [-1, 1]
        pcm = audio.detach().to("cpu").clamp(-1.0, 1.0).mul(32767.0).numpy().astype("<i2")
        with open(os.path.join(out_dir, f"seg-{i}.pcm"), "wb") as f:
            f.write(pcm.tobytes())
        durations.append(len(pcm) / sample_rate)
        print(f"pocket-tts: segment {i + 1}/{len(segments)} — {durations[-1]:.1f}s", file=sys.stderr)

    print(json.dumps({"sampleRate": sample_rate, "durations": durations}))


if __name__ == "__main__":
    main()
