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

# English, single direct instruction — this small/early moondream2
# revision (2024-08-26) is trained mostly on English data and struggles
# with a compound French question (observed on the VPS: it just echoed
# the question back instead of answering, for most frames). The output
# itself doesn't need to be French: it only ever gets read by the Claude
# prompt in Make that synthesizes the final French critique, never shown
# to a person directly.
PROMPT = (
    "Describe this still from a product video in one short sentence, then "
    "note any obvious visual defect (blur, bad framing, inconsistency). "
    "If there is no defect, say so."
)

MODEL_ID = "vikhyatk/moondream2"
MODEL_REVISION = "2024-08-26"

# This revision's remote code needs transformers==4.44.0 specifically —
# transformers>=5.0.0 dropped pad_token_id from PhiConfig (the base this
# revision's model class extends), so from_pretrained() fails with
# "AttributeError: 'PhiConfig' object has no attribute 'pad_token_id'" on
# anything newer. See README.md's "critique visuelle" prerequisites section
# for the exact pinned install command (transformers/accelerate/einops/timm
# all pinned together, matching moondream2's own HF Space requirements.txt
# for this revision, to avoid cross-dependency conflicts).


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: visual_critique.py <image1> [<image2> ...]", file=sys.stderr)
        return 2

    image_paths = sys.argv[1:]

    try:
        import torch
        from PIL import Image
        from transformers import AutoModelForCausalLM
    except ImportError:
        print(
            "transformers/torch/Pillow ne sont pas installés. Sur le VPS : "
            "pip3 install --break-system-packages torch --index-url "
            "https://download.pytorch.org/whl/cpu && "
            "pip3 install --break-system-packages transformers==4.44.0 "
            "accelerate==0.32.1 einops==0.8.0 timm==0.9.12 pillow",
            file=sys.stderr,
        )
        return 1

    # bfloat16 instead of the default float32 halves the model's memory
    # footprint (~3.8GB instead of ~7.6GB for this ~1.9B-parameter model) —
    # float32 alone was enough to OOM-kill this process on the VPS's 7.8GB
    # of RAM (no swap configured). bfloat16 is well-supported for CPU
    # inference in PyTorch, unlike float16 which has spottier CPU op
    # coverage.
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        revision=MODEL_REVISION,
        trust_remote_code=True,
        device_map={"": "cpu"},
        torch_dtype=torch.bfloat16,
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
