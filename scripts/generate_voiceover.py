import os
import asyncio
import subprocess
from pathlib import Path
import edge_tts

OUTPUT_DIR = Path(__file__).resolve().parent / "video_assets"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

VOICE = "en-US-AndrewNeural"  # Professional, authoritative, natural American male voice

SECTIONS = [
    {
        "id": "scene1_intro",
        "text": "Every month, independent bookkeepers spend 20 plus hours deciphering messy bank feeds. Sending confidential statements to cloud AI leaks client data and risks hallucinated account codes. LedgerShield solves this: reconcile confidently, keep financial data local."
    },
    {
        "id": "scene2_load",
        "text": "Let's load Northstar Electrical Services, with 57 realistic contractor transactions and an active Chart of Accounts. All transactions start unreviewed, with zero cloud exposure."
    },
    {
        "id": "scene3_reconcile",
        "text": "Now watch LedgerShield's two-stage engine in action. Deterministic rules resolve recurring suppliers instantly, while local open-weight AI classifies ambiguous expenses against our Chart of Accounts."
    },
    {
        "id": "scene4_inspect",
        "text": "LedgerShield never silently auto-approves. Let's inspect Platt Electric Supply. In one click, we persist a custom vendor rule directly into local SQLite, automating all future statements."
    },
    {
        "id": "scene5_inquiry",
        "text": "For tricky marketplace charges without receipts, switch to the Client Inquiry Builder. It generates structured questions ready to copy straight into Slack or email."
    },
    {
        "id": "scene6_export_benchmark",
        "text": "Finally, export audit-compliant CSVs ready for QuickBooks or Xero, and inspect our benchmark showing an 82 percent accuracy rate at zero marginal token cost. LedgerShield: reconcile confidently, keep financial data local."
    }
]

async def generate_audio():
    print(f"Generating AI Voiceover using {VOICE}...")
    total_duration = 0.0
    durations = {}
    
    for sec in SECTIONS:
        mp3_path = OUTPUT_DIR / f"{sec['id']}.mp3"
        print(f"Synthesizing {sec['id']}...")
        comm = edge_tts.Communicate(sec['text'], VOICE, rate="+8%")
        await comm.save(str(mp3_path))
        
        # Check duration with ffprobe
        cmd = [
            "ffprobe", "-i", str(mp3_path),
            "-show_entries", "format=duration",
            "-v", "quiet", "-of", "csv=p=0"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        dur = float(res.stdout.strip())
        durations[sec['id']] = dur
        total_duration += dur
        print(f"  -> {sec['id']}: {dur:.2f}s")
        
    print("=" * 50)
    print(f"TOTAL RAW AUDIO DURATION: {total_duration:.2f} seconds ({total_duration/60:.2f} minutes)")
    print("=" * 50)
    
    # Save metadata JSON for the video generator
    import json
    with open(OUTPUT_DIR / "timing.json", "w", encoding="utf-8") as f:
        json.dump({
            "durations": durations,
            "total_duration": total_duration,
            "sections": SECTIONS
        }, f, indent=2)

if __name__ == "__main__":
    asyncio.run(generate_audio())
