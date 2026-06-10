"""MIZAN pipeline runner.

    python geo/run_pipeline.py --demo          # generate labeled demo data (no GEE)
    python geo/run_pipeline.py --h4            # gate H4: MOD16 coverage check (GEE)
    python geo/run_pipeline.py --full          # P1–P5 export (GEE auth required)
    python geo/run_pipeline.py --grace         # P6 TWS + forecast (GEE auth required)
    python geo/run_pipeline.py --validate F    # P7 on a fields GeoJSON (local)
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", action="store_true")
    ap.add_argument("--h4", action="store_true")
    ap.add_argument("--full", action="store_true")
    ap.add_argument("--grace", action="store_true")
    ap.add_argument("--validate", metavar="FIELDS_GEOJSON")
    ap.add_argument("--project", default=None)
    args = ap.parse_args()

    if args.demo:
        import demo_generator
        demo_generator.main()
        return
    if args.validate:
        import p7_validation as p7
        root = HERE.parent
        res = p7.run(
            json.load(open(args.validate, encoding="utf-8")),
            json.load(open(root / "data" / "validation_sites.geojson", encoding="utf-8")),
        )
        print(json.dumps(res, ensure_ascii=False, indent=2))
        return
    if args.h4 or args.full:
        cmd = [sys.executable, str(HERE / "gee_pipeline.py")]
        if args.h4:
            cmd.append("--h4")
        if args.project:
            cmd += ["--project", args.project]
        raise SystemExit(subprocess.call(cmd))
    if args.grace:
        cmd = [sys.executable, str(HERE / "p6_grace_forecast.py")]
        if args.project:
            cmd += ["--project", args.project]
        raise SystemExit(subprocess.call(cmd))
    ap.print_help()


if __name__ == "__main__":
    main()
