#!/usr/bin/env python3
"""Transcribes one audio file to plain text using faster-whisper, entirely
local/offline (no paid API). Called by server/render-server.js as a
subprocess (transcribeVoiceover), once per job, on the final rendered
video's extracted audio track.

Usage: python3 transcribe.py <audio_file>

Prints ONLY the transcript to stdout (one line, segments joined with a
single space) so the caller can capture it directly — every other message
(model loading, progress, warnings) goes to stderr instead.

The "base" model is downloaded automatically on first use (via
huggingface_hub, cached under ~/.cache/huggingface) — the very first
transcription after installing faster-whisper will be slower than every
one after it.
"""

import sys


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: transcribe.py <audio_file>", file=sys.stderr)
        return 2

    audio_path = sys.argv[1]

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        print(
            "faster-whisper n'est pas installé. Sur le VPS : pip3 install faster-whisper",
            file=sys.stderr,
        )
        return 1

    # int8 on CPU: the lightest-weight combination faster-whisper supports —
    # matches the "rester léger en ressources" requirement for a VPS with no
    # GPU. "base" is the model size requested (small is a drop-in alternative
    # by changing this one string, for a bit more accuracy at higher cost).
    model = WhisperModel("base", device="cpu", compute_type="int8")

    segments, _info = model.transcribe(audio_path, beam_size=5)
    transcript = " ".join(segment.text.strip() for segment in segments)
    print(transcript)
    return 0


if __name__ == "__main__":
    sys.exit(main())
