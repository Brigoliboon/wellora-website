# WellOra — IMPLEMENTATION.md

> Source of truth for modules, architecture, scope, and progress.
> Scope agreed 2026-10-07: **Backend API only**. No frontend work until backend modules pass.

## 1. Scope

* This repo (`wellora_website`) implements the **WellOra Backend API** from `REQUIREMENTS.md` using **Next.js API Routes + Supabase Postgres**.
* Versioned API: `/api/v1/...` (maps to spec `/v1/...`).
* No UI / landing page / client design in this phase. `app/page.tsx`, `globals.css` left as-is.
* First build: **Auth + Activation**, with prerequisite that **kits already exist in DB after manufacturing**. Activation only flips status on scan, never creates kits.

## 2. Architecture

* **Framework:** Next.js 16.4 (App Router), React 19, TypeScript. Read `node_modules/next/dist/docs/` before coding (per AGENTS.md breaking-changes rule).
* **DB:** Supabase Postgres. Helpers per AGENTS.md map:
  * `lib/supabase/models.ts` — prod schema types (single reference)
  * `lib/supabase/tables/*.ts` — per-table helpers (patients, kits, orders, labs, clinics, etc.)
  * `lib/supabase/client.ts` / `server.ts` — Supabase clients (to be created)
* **API layer:** `app/api/v1/{resource}/route.ts` — thin handlers, logic in `lib/`.
* **Cross-cutting:**
  * Auth: mobile + OTP (provider abstracted), session/token + refresh, device fingerprint.
  * Security: role-scoped (patient / clinic / lab / admin). Clinics see handoff metadata only, never results. Consent stored + auditable. RA 10173 note.
  * Idempotency: QR actions (activation, report attach, status transitions) safe-retry via idempotency key / kit-status guard.
  * Audit: `kit_events` log for every auto transition (timestamp + trigger).
  * Perf: QR resolve indexed lookup, geo queries indexed.

## 3. Kit Status Model (spec §2 + manufacturing clarification)

Statuses: `not_activated → activated → transporting → testing_in_progress → results_ready`.
Only `results_ready` is manual (lab attaches report). Rest automatic.

**User clarification (2026-10-07):** kits are pre-created at manufacturing time, not at purchase/order time.

* `M0 Manufacturing` seeds `kits`: `qr_payload (unique)`, `kit_type`, `manufactured_at`, `expires_at`, `status='not_activated'`, no patient yet.
* Order (§4.3) **allocates/reserves** N pre-existing kits (individual or bulk), assigns lab, sets delivery method. It does NOT manufacture QRs.
* Activation (§4.4) on customer scan only flips `not_activated → activated` + binds patient + consent. If already `activated`, return next-action → tracking.

Return paths converge on same statuses (drop-off via clinic confirm, pickup via collection event).

## 4. Modules

| ID | Name (spec ref) | Key endpoints (draft) | Depends |
|----|-----------------|-----------------------|---------|
| M0 | Kit Inventory / Manufacturing | `POST /v1/kits/manufacture` (bulk seed, admin/manufacturer), `GET /v1/kits/:id` internal | — (first) |
| M1 | Auth & Patient Identity (§4.1) | `POST /v1/auth/register`, `POST /v1/auth/otp/request`, `POST /v1/auth/otp/verify`, `POST /v1/auth/refresh` | — |
| M2 | Clinics (§4.2) | `GET /v1/clinics`, `GET /v1/clinics/nearest?lat&lng` | — |
| M3 | Catalog & Ordering (§4.3) | `GET /v1/catalog`, `POST /v1/orders` (qty, lab mode auto/manual, delivery pickup/shipped, payment init) | M0, M6 |
| M4 | QR Resolve & Activation (§4.4 + §4.5) | `POST /v1/kits/resolve` (qr→kit + status check), `POST /v1/kits/:id/activate` (expiry→device→OTP→consent→activated) | M0, M1 |
| M5 | Device Trust (§4.5, part of M4) | single `trusted_device` per patient, rebind only via OTP success during activation | M1, M4 |
| M6 | Lab Assignment & Quota (§4.6) | logic inside order create: auto nearest-under-quota / manual quota-validated; `labs` quota optional daily reset | M3 |
| M7 | Transport Tracking (§4.7) | `POST /v1/kits/:id/dropoff-confirm` (clinic), `POST /v1/kits/:id/pickup-collected`, `POST /v1/kits/:id/lab-arrived`, `GET /v1/kits/:id/track` | M4 |
| M8 | Lab Reporting (§4.8) | `POST /v1/kits/:id/report` (image/soft-copy upload) → `results_ready` | M7 |
| M9 | AI Summary & Chat (§4.9) | `POST /v1/kits/:id/summary`, `POST /v1/chat` + `book_consultation` handoff trigger | M8 |
| M10 | Ratings (§4.10) | `POST /v1/kits/:id/rating`, `GET /v1/labs/:id/ratings` | M8 |
| M11 | Admin / Monitoring (§4.11) | `GET /v1/admin/kit-stats`, `/clinic-sales`, `/lab-volume`, `/ratings` (read-only) | all |

Build order per user: **M0 → M1+M4/M5 → M3+M6 → M7 → M8 → M2, M10, M11 → M9**.

## 5. UI/UX, Branding, Design System

* **Deferred.** No frontend in this phase per user (`do not work on the frontend first`).
* When frontend starts: inspect `app/globals.css`, propose palette + fonts, keep consistent with landing page, follow AGENTS.md anti-generic-card rules (visual hierarchy, negative space, no static card grids / `max-w-*` centering / tables).

## 6. Naming & Locations (AGENTS.md)

* Functions `snake_case`, components `PascalCase` (no components in backend phase).
* `lib/supabase/models.ts`, `lib/supabase/tables/`, `database/migration/*.sql` for approved SQL (never push to prod), `tests/{FEATURE}_TESTCASE.md` per feature.

## 7. Open Questions (from REQUIREMENTS §6, carried)

1. Quota reservation timing (order-time consume vs arrival-time consume).
2. Who triggers pickup-collected event.
3. What triggers lab-arrived (explicit signal vs auto).
4. Rejected/unusable sample state — needed but undefined.
5. Fee rules (delivery/pickup flat vs distance).
6. **New (manufacturing):** does order allocate specific pre-printed QRs, or generic inventory count? Assume specific QR allocation for now.

## 8. Progress

* [x] Planning answers collected (backend-only, Next+Supabase, auth+activation first)
* [x] Supabase wiring (client/server/proxy.ts, .env.local, tests/SUPABASE_TESTCASE.md)
* [x] M0 checkpoint + testcase — DONE 2026-10-07 (manufacture route live-verified: 2 kits, idempotent retry, expiry guard, audit events)
* [x] M1 checkpoint + testcase — DONE 2026-10-07, REWORKED same day to device-trust (no OTP)
* [x] M4/M5 checkpoint + testcase — DONE 2026-10-07 via custom OTP (deleted same day), REBUILT as approval flow (pending live-verify)
* [x] Approval-flow pivot — AGREED 2026-10-07 (push-to-trusted-device replaces SMS OTP; first-device auto-trust; FCM later, polling demo now)
* [x] 002 migration applied in Supabase (owner) + approval endpoints LIVE-VERIFIED 2026-10-07 (A1–A11 + device login/refresh; natural-expiry 410 proven)
* [x] M7+M8 checkpoint + testcase — DONE 2026-10-07 (T1–T9, R1–R6 live-verified: dropoff/pickup paths, lab arrival + mismatch guard, report 201, dup idempotent, tracking timeline)
* [x] M3/M6 checkpoint + testcase — DONE 2026-10-07 (O1–O8, Q1–Q5 live-verified: advisory assign, bulk pricing, atomic OTW consume, reroute + audit, exhausted path, no double-consume)
* [x] M2 geo infra — DONE 2026-10-07 (004 PostGIS live: location cols + sync triggers + nearby_* rpc; labs helper on DB nearest, Mapbox geojson verified both directions)
* [x] M2 clinics endpoint — DONE 2026-10-07 (C1–C3 live: plain list + rpc nearest with Mapbox geojson)
* [x] M10 ratings — DONE 2026-10-07 (G1–G6 live: owner-only 201, dup/non-ready 409s, 403, aggregate + distribution)
* [x] M11 admin — DONE 2026-10-07 (D1–D5 live: funnel sums to total, clinic attribution 0→1 on drop-off, lab volume, ratings aggregate; 005 applied)
* [ ] M9 AI summary + chatbot (needs provider key from owner)

## 9. Approval-Flow Amendment (deviation from REQUIREMENTS §4.4/§4.5)

* SMS OTP replaced by trusted-device approval: unknown device -> `activation_approvals` pending row + code shown only on requesting device -> trusted device approves by entering that code -> requesting device overwrites trust.
* Bootstrap rule (user-confirmed): first activation for a number auto-trusts. Risk accepted for competition: whoever activates first with a number owns it; attacker needs physical kit QR + number. Revisit before production launch.
* No blind-approve: approval requires the code. Demo pushes via polling `GET /approvals/pending`; FCM (`firebase-admin`, free/unlimited) plugs in later as send-call inside approval creation, no endpoint changes.
* `otp_codes` table + custom OTP routes/helper/testcase DELETED 2026-10-07 (user-confirmed). 002 drops the table.
* Endpoints (approval flow): `POST /kits/resolve` (need_approval + code on requester only), `POST /kits/:id/activate` (known-device only; unknown -> 401 approval_required), `POST /auth/device` (active session or pending approval), `GET /approvals/pending` (metadata, no codes), `POST /approvals/:id/approve` (code required, no blind-approve), `POST /approvals/:id/deny`, `GET /approvals/:id` (requester poll, hash stripped). `POST /auth/register|refresh` unchanged.
