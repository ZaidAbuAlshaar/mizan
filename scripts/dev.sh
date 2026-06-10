#!/usr/bin/env bash
# MIZAN — start backend (8000) + frontend (3000) for local dev.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

[ -d "$ROOT/data/demo" ] || python3 "$ROOT/geo/run_pipeline.py" --demo

if [ ! -d "$ROOT/backend/.venv" ]; then
  python3 -m venv "$ROOT/backend/.venv"
  "$ROOT/backend/.venv/bin/pip" install -q -r "$ROOT/backend/requirements.txt"
fi

"$ROOT/backend/.venv/bin/uvicorn" --app-dir "$ROOT/backend" app.main:app --port 8000 &
BACK=$!
trap 'kill $BACK 2>/dev/null || true' EXIT

cd "$ROOT/frontend"
[ -d node_modules ] || npm install
[ -f .env.local ] || cp .env.local.example .env.local
npm run dev
