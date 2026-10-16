import os
import time
import math
import shutil
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

WORKSPACE_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = WORKSPACE_DIR / "scripts" / "video_assets"
RAW_VIDEO_DIR = ASSETS_DIR / "raw_video"
OUTPUT_MP4 = WORKSPACE_DIR / "LedgerShield_Demo_Walkthrough.mp4"

def record_browser():
    if RAW_VIDEO_DIR.exists():
        shutil.rmtree(RAW_VIDEO_DIR)
    RAW_VIDEO_DIR.mkdir(parents=True, exist_ok=True)

    print("Launching Chromium via Playwright (1920x1080)...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="chrome",
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--font-render-hinting=none"
            ]
        )
        
        ctx = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=str(RAW_VIDEO_DIR),
            record_video_size={"width": 1920, "height": 1080}
        )
        page = ctx.new_page()
        
        start_time = time.time()
        def elapsed():
            return time.time() - start_time
            
        def wait_until(target_sec):
            rem = target_sec - elapsed()
            if rem > 0:
                time.sleep(rem)

        # -------------------------------------------------------------
        # SCENE 1: Introduction & 3D Spatial Vault (0.0s -> 16.3s)
        # -------------------------------------------------------------
        print(f"[{elapsed():.1f}s] Starting Scene 1: Intro & 3D Spatial Vault...")
        page.goto("http://localhost:3000", wait_until="networkidle")
        time.sleep(1.5)

        # Open 3D Spatial Vault Modal
        vault_btn = page.locator("button:has-text('3D Spatial Vault')").first
        try:
            if vault_btn.is_visible(timeout=3000):
                vault_btn.click()
                time.sleep(1.0)
                # Mouse movement around center of screen to tilt 3D perspective
                for i in range(12):
                    angle = (i / 12) * 6.28
                    page.mouse.move(700 + int(110 * math.cos(angle)), 480 + int(80 * math.sin(angle)))
                    time.sleep(0.3)
                
                # Close modal
                close_btn = page.locator("button[title='Close 3D Vault Inspector']").first
                if close_btn.is_visible(timeout=2000):
                    close_btn.click()
                    time.sleep(0.8)
        except Exception as e:
            print(f"Scene 1 warning: {e}")
        
        wait_until(16.3)

        # -------------------------------------------------------------
        # SCENE 2: Ingesting Northstar Electrical (16.3s -> 27.7s)
        # -------------------------------------------------------------
        print(f"[{elapsed():.1f}s] Starting Scene 2: Load Northstar Dataset...")
        demo_btn = page.locator("button:has-text('Load Demo Data')").first
        try:
            if demo_btn.is_visible(timeout=3000):
                demo_btn.click()
                time.sleep(2.0)
        except Exception as e:
            print(f"Scene 2 warning: {e}")

        # Smooth scroll down through transactions
        page.mouse.wheel(0, 320)
        time.sleep(3.0)
        page.mouse.wheel(0, -320)
        time.sleep(2.0)

        wait_until(27.7)

        # -------------------------------------------------------------
        # SCENE 3: Two-Stage Reconciliation (27.7s -> 39.7s)
        # -------------------------------------------------------------
        print(f"[{elapsed():.1f}s] Starting Scene 3: Run Reconciliation...")
        reconcile_btn = page.locator("button:has-text('Run Reconciliation')").first
        try:
            if reconcile_btn.is_visible(timeout=3000):
                reconcile_btn.click()
                time.sleep(3.0)
        except Exception as e:
            print(f"Scene 3 warning: {e}")

        # Scroll down to show categorized items
        page.mouse.wheel(0, 260)
        time.sleep(2.5)
        page.mouse.wheel(0, -260)
        time.sleep(2.0)

        wait_until(39.7)

        # -------------------------------------------------------------
        # SCENE 4: Human-in-the-Loop Inspector & Rule (39.7s -> 51.7s)
        # -------------------------------------------------------------
        print(f"[{elapsed():.1f}s] Starting Scene 4: Audit Inspector Drawer...")
        inspect_btns = page.locator("button[title='Inspect audit trail and rationale']")
        try:
            if inspect_btns.count() > 0:
                inspect_btns.first.click()
                time.sleep(2.0)

                # Click Remember Rule button
                rule_btn = page.locator("button:has-text('Remember Rule')").first
                if rule_btn.is_visible(timeout=2000):
                    rule_btn.click()
                    time.sleep(2.0)

                # Approve transaction
                approve_btn = page.locator("button:has-text('Approve Transaction')").first
                if approve_btn.is_visible(timeout=2000):
                    approve_btn.click()
                    time.sleep(1.5)
        except Exception as e:
            print(f"Scene 4 warning: {e}")

        wait_until(51.7)

        # -------------------------------------------------------------
        # SCENE 5: Client Inquiry Builder (51.7s -> 61.7s)
        # -------------------------------------------------------------
        print(f"[{elapsed():.1f}s] Starting Scene 5: Client Inquiry Builder...")
        inquiry_tab = page.locator("button:has-text('Client Inquiry Builder')").first
        try:
            if inquiry_tab.is_visible(timeout=3000):
                inquiry_tab.click()
                time.sleep(2.0)

                # Scroll through generated questions
                page.mouse.wheel(0, 280)
                time.sleep(2.0)

                # Click copy markdown
                copy_btn = page.locator("button:has-text('Copy Markdown')").first
                if copy_btn.is_visible(timeout=2000):
                    copy_btn.click()
                    time.sleep(1.5)

                page.mouse.wheel(0, -280)
                time.sleep(1.0)
        except Exception as e:
            print(f"Scene 5 warning: {e}")

        wait_until(61.7)

        # -------------------------------------------------------------
        # SCENE 6: Export & Benchmark & Closing (61.7s -> 76.5s)
        # -------------------------------------------------------------
        print(f"[{elapsed():.1f}s] Starting Scene 6: Export & Benchmark...")
        try:
            export_tab = page.locator("button:has-text('Export & Audit')").first
            if export_tab.is_visible(timeout=3000):
                export_tab.click()
                time.sleep(3.0)

            benchmark_tab = page.locator("button:has-text('Gemma Benchmark')").first
            if benchmark_tab.is_visible(timeout=3000):
                benchmark_tab.click()
                time.sleep(4.0)

            # Return to studio for final hero view
            studio_tab = page.locator("button:has-text('Reconciliation Studio')").first
            if studio_tab.is_visible(timeout=3000):
                studio_tab.click()
                time.sleep(2.5)
        except Exception as e:
            print(f"Scene 6 warning: {e}")

        wait_until(77.0)
        print(f"[{elapsed():.1f}s] Finished recording actions!")

        # Close context to flush video
        ctx.close()
        browser.close()

    print("Browser closed. Locating recorded webm video...")
    webm_files = list(RAW_VIDEO_DIR.glob("*.webm"))
    if not webm_files:
        raise RuntimeError("No recorded video found in raw_video directory!")
    
    recorded_webm = webm_files[0]
    print(f"Found recorded video: {recorded_webm} ({recorded_webm.stat().st_size / (1024*1024):.2f} MB)")
    return recorded_webm

def composite_final_video(recorded_webm: Path):
    master_audio = ASSETS_DIR / "narration_master.mp3"
    print(f"Compositing video {recorded_webm} with audio {master_audio} into {OUTPUT_MP4}...")
    
    # FFmpeg command to combine video and audio into a high quality MP4
    cmd = [
        "ffmpeg", "-y",
        "-i", str(recorded_webm),
        "-i", str(master_audio),
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(OUTPUT_MP4)
    ]
    
    subprocess.run(cmd, check=True)
    
    # Check final duration and size
    res = subprocess.run([
        "ffprobe", "-i", str(OUTPUT_MP4),
        "-show_entries", "format=duration,size",
        "-v", "quiet", "-of", "json"
    ], capture_output=True, text=True, check=True)
    
    import json
    info = json.loads(res.stdout)
    duration = float(info["format"]["duration"])
    size_mb = float(info["format"]["size"]) / (1024 * 1024)
    
    print("=" * 60)
    print("DEMO VIDEO PRODUCTION COMPLETE!")
    print(f"Output File: {OUTPUT_MP4}")
    print(f"Duration:    {duration:.2f} seconds ({duration/60:.2f} minutes -> exactly {int(duration//60)}:{int(duration%60):02d})")
    print(f"File Size:   {size_mb:.2f} MB")
    print(f"Resolution:  1920x1080 (Full HD)")
    print("=" * 60)

if __name__ == "__main__":
    webm = record_browser()
    composite_final_video(webm)
