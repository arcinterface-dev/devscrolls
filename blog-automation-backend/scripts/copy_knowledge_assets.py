"""Script to copy and synchronize author knowledge assets from DevScrolls blog repo into the backend knowledge_assets directory.
"""
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
BLOG_ROOT = BASE_DIR.parent
ASSETS_DIR = BASE_DIR / "knowledge_assets"

def copy_assets():
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    samples_dest = ASSETS_DIR / "writing_samples"
    samples_dest.mkdir(parents=True, exist_ok=True)

    # 1. Voice profile
    voice_profile_src = BLOG_ROOT / ".dev" / "writing-samples" / "VOICE_PROFILE.md"
    if voice_profile_src.exists():
        shutil.copy2(voice_profile_src, ASSETS_DIR / "VOICE_PROFILE.md")
        print(f"Copied {voice_profile_src.name}")

    # 2. Writing samples
    writing_samples_dir = BLOG_ROOT / ".dev" / "writing-samples"
    if writing_samples_dir.exists():
        for sample in writing_samples_dir.glob("*.md"):
            if sample.name != "VOICE_PROFILE.md":
                shutil.copy2(sample, samples_dest / sample.name)
                print(f"Copied sample: {sample.name}")

    # 3. Tone and voice rules
    tone_rules_src = BLOG_ROOT / ".agents" / "rules" / "post-tone-and-voice.md"
    if tone_rules_src.exists():
        shutil.copy2(tone_rules_src, ASSETS_DIR / "post-tone-and-voice.md")
        print(f"Copied {tone_rules_src.name}")

    # 4. Generation guardrails (AGENTS.md)
    agents_rules_src = BLOG_ROOT / "AGENTS.md"
    if agents_rules_src.exists():
        shutil.copy2(agents_rules_src, ASSETS_DIR / "blog_generation_rules.md")
        print("Copied AGENTS.md -> blog_generation_rules.md")

    # 5. SEO Guidelines
    seo_src = BLOG_ROOT / "knowledge-base" / "08_SEO_Master_Guide.md"
    if seo_src.exists():
        shutil.copy2(seo_src, ASSETS_DIR / "seo_guidelines.md")
        print("Copied SEO Master Guide -> seo_guidelines.md")

if __name__ == "__main__":
    copy_assets()

