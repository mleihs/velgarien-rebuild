"""Generate lore section images for the dashboard LoreScroll component.

4 atmospheric images uploaded to simulation.assets/platform/lore/.
Uses the same pipeline as generate_dashboard_images.py:
  Replicate Flux Dev → WebP conversion → Supabase Storage.

Requires:
  - Backend .venv activated (for replicate + Pillow)
  - REPLICATE_API_TOKEN env var or in .env
  - Local Supabase running (supabase start)
"""

from __future__ import annotations

import io
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import replicate
import requests
from PIL import Image

# ── Config ──────────────────────────────────────────────────────────────────

SUPABASE_URL = "http://127.0.0.1:54321"
SUPABASE_SERVICE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0"
    ".EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
)

BUCKET = "simulation.assets"
FLUX_MODEL = "black-forest-labs/flux-dev"
WEBP_QUALITY = 85
STORAGE_PREFIX = "platform/lore"

# ── Image definitions ───────────────────────────────────────────────────────

IMAGES = [
    {
        "name": "The Unnamed — The World Before",
        "filename": "the-unnamed.webp",
        "prompt": (
            "Abstract painting of a unified primordial world before destruction, "
            "warm amber mist dissolving into golden light, the sense of perfect "
            "wholeness about to shatter, a single vast landscape containing hints "
            "of all possible worlds — underground caverns, brutalist towers, "
            "starfields, gardens — all blended into one harmonious entity, "
            "oil painting style, concept art quality, dreamlike atmosphere, "
            "warm amber and gold palette, NOT photorealistic, NOT bright"
        ),
        "width": 1024,
        "height": 576,
    },
    {
        "name": "The Fracture — The Breaking",
        "filename": "the-fracture.webp",
        "prompt": (
            "Dark fantasy painting of reality shattering like a cosmic mirror, "
            "golden cracks splitting across a black void, through each fragment "
            "a different world is visible — concrete dystopia, bioluminescent "
            "caverns, organic coral cities, deep space stations — the fragments "
            "are drifting apart, edges glowing with amber energy, dramatic "
            "chiaroscuro lighting, oil painting style, concept art quality, "
            "wide panoramic composition, NOT photorealistic"
        ),
        "width": 1024,
        "height": 576,
    },
    {
        "name": "The Bleed — Where Worlds Touch",
        "filename": "the-bleed.webp",
        "prompt": (
            "Surreal painting of two realities pressing together, a brutalist "
            "concrete corridor where the walls are dissolving into bioluminescent "
            "fungi and dripping water, propaganda posters morphing into organic "
            "growths, a single glowing mushroom growing from a crack in the floor, "
            "the boundary between industrial dystopia and underground fantasy "
            "kingdom blurring, eerie atmospheric lighting, teal and amber "
            "colour palette, oil painting style, concept art, NOT photorealistic"
        ),
        "width": 1024,
        "height": 576,
    },
    {
        "name": "The Bureau — Impossible Geography",
        "filename": "the-bureau.webp",
        "prompt": (
            "Fantasy painting of an impossible office that spans multiple realities, "
            "filing cabinets stretching into non-Euclidean space, maps and "
            "cartographic instruments glowing with inner light, the walls are "
            "simultaneously stone, glass, coral, and concrete, a desk covered "
            "in charts that show impossible geographies, dim atmospheric lighting "
            "with warm lamplight pools, scholarly chaos, oil painting style, "
            "concept art quality, Escher meets Victorian study, NOT photorealistic"
        ),
        "width": 1024,
        "height": 576,
    },
]

# ── Helpers (same as generate_dashboard_images.py) ─────────────────────────


def convert_to_webp(image_bytes: bytes, max_width: int, max_height: int) -> bytes:
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    img = img.resize((max_width, max_height), Image.LANCZOS)
    output = io.BytesIO()
    img.save(output, format="WEBP", quality=WEBP_QUALITY)
    return output.getvalue()


def upload_to_storage(path: str, data: bytes) -> str:
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "image/webp",
    }
    requests.delete(url, headers=headers, timeout=10)
    resp = requests.post(url, headers=headers, data=data, timeout=30)
    if resp.status_code not in (200, 201):
        resp = requests.put(url, headers=headers, data=data, timeout=30)
    resp.raise_for_status()
    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"


def generate_image(prompt: str) -> bytes:
    output = replicate.run(
        FLUX_MODEL,
        input={
            "prompt": prompt,
            "guidance": 3.5,
            "num_inference_steps": 28,
            "output_format": "webp",
            "output_quality": 90,
        },
    )
    if isinstance(output, list):
        return output[0].read()
    return output.read()


# ── Main ─────────────────────────────────────────────────────────────────────


def main() -> None:
    print("=== Lore Image Generation ===\n")

    token = os.environ.get("REPLICATE_API_TOKEN") or os.environ.get("REPLICATE_API_KEY")
    if not token:
        print("ERROR: REPLICATE_API_TOKEN not set in environment or .env")
        sys.exit(1)

    print(f"Replicate token: {token[:8]}...\n")

    for img in IMAGES:
        storage_path = f"{STORAGE_PREFIX}/{img['filename']}"
        print(f"--- {img['name']} ---")
        print(f"  Prompt: {img['prompt'][:80]}...")
        print(f"  Target: {img['width']}x{img['height']}")

        print("  Generating via Flux Dev...")
        raw_bytes = generate_image(img["prompt"])
        print(f"  Raw output: {len(raw_bytes)} bytes")

        webp_bytes = convert_to_webp(raw_bytes, img["width"], img["height"])
        print(f"  WebP: {len(webp_bytes)} bytes")

        print(f"  Uploading to {BUCKET}/{storage_path}...")
        public_url = upload_to_storage(storage_path, webp_bytes)
        print(f"  Public URL: {public_url}")
        print()

        time.sleep(2)

    print("=== Done ===")
    print(f"\nImages uploaded to: {BUCKET}/{STORAGE_PREFIX}/")
    print("Files: the-unnamed.webp, the-fracture.webp, the-bleed.webp, the-bureau.webp")


if __name__ == "__main__":
    main()
