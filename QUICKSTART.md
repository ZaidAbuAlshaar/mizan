# ميزان MIZAN — تشغيل المشروع · Quickstart

> سكافولد كامل يعمل **اليوم** ببيانات تجريبية موسومة (UI-13: لا mock كحقيقي). يتحوّل تلقائياً إلى بيانات GEE الحقيقية فور توفّرها. المتطلبات: **Python 3.11+** و**Node 20+**.

```
geo/        ← P1–P7 على Google Earth Engine + مولّد بيانات تجريبية (stdlib، بلا GEE)
backend/    ← FastAPI (11 endpoint، §12) — يقرأ data/ الحقيقية أو data/demo/
frontend/   ← Next.js 14 + Tailwind + MapLibre + Recharts — RTL، الشاشات الخمس
data/       ← AOI الأزرق، مواقع التحقّق الستة، و data/demo/ المولَّدة
```

## 1) بيانات تجريبية (موجودة ومُولَّدة مسبقاً)
```bash
python geo/run_pipeline.py --demo      # يعيد توليد data/demo/* (بلا إنترنت/GEE)
```

## 2) الـ Backend
```bash
cd backend
python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --port 8000      # http://localhost:8000/docs
```

## 3) الـ Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local                # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                                      # http://localhost:3000
```

**الشاشات:** `/` الخريطة الوطنية · `/queue` طابور التفتيش + بانل الدليل · `/basin/azraq` منحنى GRACE + التنبّؤ + آلة الزمن · `/impact` عدّاد الأثر + التحقّق · `/methodology` المنهجية.

## 4) أوفلاين / Plan B
الواجهة تعمل **بدون backend**: إن تعذّر الوصول للـ API تسقط تلقائياً إلى الحزمة المضمّنة `frontend/public/demo/*.json`. أي نشر مستقل على Vercel يعمل وحده. لتحديث الحزمة بعد تغيير البيانات:
```bash
for e in meta "fields" "basins" "alerts?limit=50" "impact/summary" "validation/summary" "basins/azraq/forecast"; do
  curl -s "http://localhost:8000/$e" -o "frontend/public/demo/$(echo $e | sed 's#[/?].*##').json"; done
```

## 5) بيانات حقيقية (داخل الحدث، بعد `earthengine authenticate`)
```bash
python geo/run_pipeline.py --h4 --project YOUR_GCP_PROJECT     # بوابة H4: تغطية MOD16
python geo/gee_pipeline.py --project YOUR_GCP_PROJECT --out data/fields.geojson  # P1–P5
python geo/p6_grace_forecast.py --project YOUR_GCP_PROJECT     # P6: GRACE + التنبّؤ
python geo/p7_validation.py --fields data/fields.geojson      # P7: التحقّق
```
الـ backend يلتقط `data/fields.geojson` (وأخواتها) تلقائياً ويتجاوز `data/demo/`.

## ملاحظات
- كل رقم يتتبّع لـ `plan.md` الملحق أ / `docs/VERIFICATION.md`. الـ `precision@20` يبقى `null` حتى تُدخَل نتائج التفتيش (لا رقم مُختلَق).
- مسار الإنتاج (PostgreSQL+PostGIS، §12): يُفعَّل بـ `DATABASE_URL` لاحقاً دون تغيير الـ API.
- ⚠️ قواعد العمل المسبق للحدث غير مؤكَّدة بعد — `docs/VERIFICATION.md §0`.
