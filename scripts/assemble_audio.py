import subprocess
from pathlib import Path
import json

ASSETS_DIR = Path(__file__).resolve().parent / "video_assets"

SECTIONS = [
    "scene1_intro",
    "scene2_load",
    "scene3_reconcile",
    "scene4_inspect",
    "scene5_inquiry",
    "scene6_export_benchmark"
]

def assemble_master_audio():
    # Generate 0.3s silence MP3
    silence_file = ASSETS_DIR / "silence_03s.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
        "-t", "0.3", "-q:a", "9", "-acodec", "libmp3lame", str(silence_file)
    ], check=True, capture_output=True)

    # Build concat file list
    concat_list = ASSETS_DIR / "audio_concat.txt"
    with open(concat_list, "w", encoding="utf-8") as f:
        for i, s in enumerate(SECTIONS):
            f.write(f"file '{s}.mp3'\n")
            if i < len(SECTIONS) - 1:
                f.write("file 'silence_03s.mp3'\n")

    # Concatenate audio
    master_audio = ASSETS_DIR / "narration_master.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(concat_list), "-c", "copy", str(master_audio)
    ], check=True, capture_output=True)

    # Get total duration
    res = subprocess.run([
        "ffprobe", "-i", str(master_audio),
        "-show_entries", "format=duration",
        "-v", "quiet", "-of", "csv=p=0"
    ], capture_output=True, text=True, check=True)
    
    total_audio_sec = float(res.stdout.strip())
    print(f"Master audio assembled successfully: {master_audio}")
    print(f"Total Audio Duration: {total_audio_sec:.2f} seconds ({total_audio_sec/60:.2f} minutes)")
    return total_audio_sec

if __name__ == "__main__":
    assemble_master_audio()
