#!/usr/bin/env python3
"""Analyzes one or more images with moondream2, entirely local/offline (no
paid API, no GPU required). Called by server/render-server.js as a
subprocess (analyzeFrames), once per job, on a handful of the stills
already extracted by extractPreviewFrames.

Usage: python3 visual_critique.py <image1> [<image2> ...]

For each image, asks moondream2 to describe it and flag any obvious visual
problem (blur, framing, inconsistency). Prints ONE line per image to
stdout, in the form "<basename>: <answer>" — every other message (model
loading, progress, warnings) goes to stderr instead.

Note: the official "moondream" PyPI package's local ("Photon") backend
hard-requires a CUDA or Apple Silicon accelerator (it raises at import
time on a GPU-less machine) — unusable here. moondream2 loaded through
transformers is the older but still CPU-capable path, which is what this
script uses instead. The model (~3.7GB) is downloaded automatically on
first use (via huggingface_hub, cached under ~/.cache/huggingface) — the
very first analysis after installing transformers will be much slower
than every one after it.
"""

import sys

PROMPT = (
    "Décris cette image issue d'une vidéo produit. "
    "Y a-t-il un problème visuel évident (flou, cadrage, incohérence) ?"
)

MODEL_ID = "vikhyatk/moondream2"
MODEL_REVISION = "2024-08-26"


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: visual_critique.py <image1> [<image2> ...]", file=sys.stderr)
        return 2

    image_paths = sys.argv[1:]

    try:
        from PIL import Image
        from transformers import AutoModelForCausalLM
    except ImportError:
        print(
            "transformers/Pillow ne sont pas installés. Sur le VPS : "
            "pip3 install --break-system-packages torch --index-url "
            "https://download.pytorch.org/whl/cpu && "
            "pip3 install --break-system-packages transformers einops pillow",
            file=sys.stderr,
        )
        return 1

    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        revision=MODEL_REVISION,
        trust_remote_code=True,
        device_map={"": "cpu"},
    )

    # Older moondream2 revisions only expose encode_image/answer_question;
    # the tokenizer is only needed on that fallback path, so it's loaded
    # lazily (and once, not per image) rather than unconditionally.
    tokenizer = None

    for image_path in image_paths:
        image = Image.open(image_path).convert("RGB")
        if hasattr(model, "query"):
            answer = model.query(image, PROMPT)["answer"]
        else:
            if tokenizer is None:
                from transformers import AutoTokenizer

                tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, revision=MODEL_REVISION)
            enc_image = model.encode_image(image)
            answer = model.answer_question(enc_image, PROMPT, tokenizer)
        answer = " ".join(answer.split())
        print(f"{image_path}: {answer}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
