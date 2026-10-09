# M11 Admin TESTCASE (read-only reporting)

Requires 005_handoff_clinic applied for clinic attribution.

- [ ] D1: GET /admin/kit-stats returns total + by_status + funnel (purchased/activated/in_progress/completed sums to total).
- [ ] D2: GET /admin/clinic-sales returns per-clinic dropoffs; new drop-off with clinic_id increments it.
- [ ] D3: GET /admin/lab-volume returns per-lab assigned/testing/completed matching kit rows.
- [ ] D4: GET /admin/ratings returns per-lab count + avg matching ratings rows.
- [ ] D5: All four are GET-only (no mutations possible through them).
