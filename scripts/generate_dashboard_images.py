"""Generate dashboard images: 1 hero background + 2 simulation banners.

Uses Replicate Flux Dev directly, converts to WebP, uploads to Supabase Storage
(simulation.assets bucket), and updates banner_url on each simulation.

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

# Load .env from project root
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import replicate
import requests
from PIL import Image

# ── Config ──────────────────────────────────────────────────────────────────

SUPABASE_URL = "http://127.0.0.1:54321"
SUPABASE_ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9"
    ".CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
)
SUPABASE_SERVICE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0"
    ".EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
)

VELGARIEN_SIM_ID = "10000000-0000-0000-0000-000000000001"
CAPYBARA_SIM_ID = "20000000-0000-0000-0000-000000000001"

BUCKET = "simulation.assets"
FLUX_MODEL = "black-forest-labs/flux-dev"

WEBP_QUALITY = 85

# ── Image definitions ───────────────────────────────────────────────────────

IMAGES = [
    {
        "name": "Dashboard Hero",
        "storage_path": "platform/dashboard-hero.webp",
        "simulation_id": None,  # Platform-level asset
        "prompt": (
            "Abstract dark fantasy painting of fractured reality, shattered mirror "
            "reflecting multiple worlds, deep black void with amber and gold cracks "
            "between fragments, through the cracks glimpses of different realities "
            "— brutalist concrete, bioluminescent caverns, starfields — oil painting "
            "style, concept art quality, dramatic lighting, wide panoramic composition, "
            "not photorealistic, not bright"
        ),
        "width": 1344,
        "height": 768,
    },
    {
        "name": "Velgarien Banner",
        "storage_path": f"{VELGARIEN_SIM_ID}/banner.webp",
        "simulation_id": VELGARIEN_SIM_ID,
        "prompt": (
            "Brutalist dystopian cityscape panorama, massive concrete towers under "
            "oppressive grey sky, surveillance cameras and searchlights, desaturated "
            "palette with harsh contrast, cinematic wide shot, architectural photography "
            "style, industrial atmosphere, not bright, not colorful"
        ),
        "width": 1024,
        "height": 683,
    },
    {
        "name": "Capybara Kingdom Banner",
        "storage_path": f"{CAPYBARA_SIM_ID}/banner.webp",
        "simulation_id": CAPYBARA_SIM_ID,
        "prompt": (
            "Vast underground cavern panorama with bioluminescent fungi and phosphorescent "
            "water, Victorian gothic subterranean city with rope bridges and fungal spires, "
            "deep greens and warm amber light, oil painting style, concept art quality, "
            "wide establishing shot, Sunless Sea aesthetic, not photorealistic"
        ),
        "width": 1024,
        "height": 683,
    },
]

# ── Helpers ──────────────────────────────────────────────────────────────────


def convert_to_webp(image_bytes: bytes, max_width: int, max_height: int) -> bytes:
    """Convert raw image bytes to WebP, resizing to target dimensions."""
    img = Image.open(io.BytesIO(image_bytes))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    img = img.resize((max_width, max_height), Image.LANCZOS)
    output = io.BytesIO()
    img.save(output, format="WEBP", quality=WEBP_QUALITY)
    return output.getvalue()


def upload_to_storage(path: str, data: bytes) -> str:
    """Upload bytes to Supabase Storage and return the public URL."""
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "image/webp",
    }

    # Try to delete existing file first (ignore errors)
    requests.delete(url, headers=headers, timeout=10)

    resp = requests.post(
        url,
        headers=headers,
        data=data,
        timeout=30,
    )
    if resp.status_code not in (200, 201):
        # Try upsert via PUT
        resp = requests.put(url, headers=headers, data=data, timeout=30)
    resp.raise_for_status()

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}"
    return public_url


def update_simulation_banner(simulation_id: str, banner_url: str) -> None:
    """Update the banner_url field on a simulation."""
    url = f"{SUPABASE_URL}/rest/v1/simulations?id=eq.{simulation_id}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "apikey": SUPABASE_SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    resp = requests.patch(
        url,
        json={"banner_url": banner_url},
        headers=headers,
        timeout=10,
    )
    resp.raise_for_status()
    print(f"    Updated banner_url on simulation {simulation_id}")


def generate_image(prompt: str) -> bytes:
    """Generate an image via Replicate Flux Dev and return raw bytes."""
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

    # Output is FileOutput or list of FileOutput
    if isinstance(output, list):
        return output[0].read()
    return output.read()


# ── Main ─────────────────────────────────────────────────────────────────────


def main() -> None:
    print("=== Dashboard Image Generation ===\n")

    # Check for Replicate token
    token = os.environ.get("REPLICATE_API_TOKEN") or os.environ.get("REPLICATE_API_KEY")
    if not token:
        print("ERROR: REPLICATE_API_TOKEN not set in environment or .env")
        sys.exit(1)

    print(f"Replicate token: {token[:8]}...\n")

    for img in IMAGES:
        print(f"--- {img['name']} ---")
        print(f"  Prompt: {img['prompt'][:80]}...")
        print(f"  Target: {img['width']}x{img['height']}")

        # Generate
        print("  Generating via Flux Dev...")
        raw_bytes = generate_image(img["prompt"])
        print(f"  Raw output: {len(raw_bytes)} bytes")

        # Convert to WebP at target size
        webp_bytes = convert_to_webp(raw_bytes, img["width"], img["height"])
        print(f"  WebP: {len(webp_bytes)} bytes")

        # Upload
        print(f"  Uploading to {BUCKET}/{img['storage_path']}...")
        public_url = upload_to_storage(img["storage_path"], webp_bytes)
        print(f"  Public URL: {public_url}")

        # Update simulation banner if applicable
        if img["simulation_id"]:
            update_simulation_banner(img["simulation_id"], public_url)

        print()
        time.sleep(2)  # Brief pause between API calls

    print("=== Done ===")
    print("\nHero image path: platform/dashboard-hero.webp")
    print("Banner URLs have been set on the simulation records.")


if __name__ == "__main__":
    main()
