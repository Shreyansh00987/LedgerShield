import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

DB_PATH = DATA_DIR / "ledgershield.db"

# Model runtime settings
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("LEDGERSHIELD_MODEL", "gemma2:2b")
FALLBACK_MODE = os.getenv("LEDGERSHIELD_FALLBACK_MODE", "heuristic")

# Security and Privacy
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit for CSV
ALLOW_REMOTE_AI = False  # Strict local-first architecture
LOG_SENSITIVE_DATA = False
