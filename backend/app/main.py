"""MIZAN API — FastAPI (constitution §12).

    uvicorn app.main:app --reload --port 8000      (from backend/)

Endpoints (docs at /docs):
  GET  /health
  GET  /meta
  GET  /fields?basin=&min_score=&status=
  GET  /fields/{id}
  PATCH /fields/{id}/status        {"status": "new|inspected|confirmed|cleared"}
  GET  /alerts?limit=20
  GET  /basins
  GET  /basins/{id}/health
  GET  /basins/{id}/forecast
  GET  /impact/summary
  GET  /validation/summary
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .store import VALID_STATUS, store

app = FastAPI(
    title="MIZAN API — ميزان",
    description="Weighing Jordan's stolen water from space. "
    "Inspection-prioritization decision support (human-in-the-loop).",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hackathon demo; restrict for production
    allow_methods=["*"],
    allow_headers=["*"],
)


class StatusBody(BaseModel):
    status: str


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/meta")
def meta():
    return {
        "demo": store.demo,
        "demo_label_ar": "بيانات تجريبية — demo data" if store.demo else None,
        "demo_label_en": "demo data" if store.demo else None,
        "fields_count": len(store.fields["features"]),
        "grace_phrase_ar": store.tws.get("region_phrase_ar"),
        "grace_phrase_en": store.tws.get("region_phrase_en"),
    }


@app.get("/fields")
def fields(basin: str | None = None, min_score: float | None = None,
           status: str | None = None):
    return store.get_fields(basin, min_score, status)


@app.get("/fields/{fid}")
def field(fid: str):
    f = store.get_field(fid)
    if f is None:
        raise HTTPException(404, "field not found")
    return f


@app.patch("/fields/{fid}/status")
def patch_status(fid: str, body: StatusBody):
    try:
        f = store.set_status(fid, body.status)
    except ValueError as e:
        raise HTTPException(422, str(e))
    if f is None:
        raise HTTPException(404, "field not found")
    return {"id": fid, "status": f["properties"]["status"], "ok": True}


@app.get("/alerts")
def alerts(limit: int = 20):
    return {"demo": store.demo, "alerts": store.alerts(limit)}


@app.get("/basins")
def basins():
    return store.basin_list()


@app.get("/basins/{bid}/health")
def basin_health(bid: str):
    h = store.basin_health(bid)
    if h is None:
        raise HTTPException(404, "basin not found")
    return h


@app.get("/basins/{bid}/forecast")
def basin_forecast(bid: str):
    return store.basin_forecast(bid)


@app.get("/impact/summary")
def impact():
    return store.impact()


@app.get("/validation/summary")
def validation():
    return store.validation()
