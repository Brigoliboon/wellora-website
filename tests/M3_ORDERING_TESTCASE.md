# M3/M6 Ordering + OTW Quota TESTCASE

Assign at order (advisory), atomic consume at OTW (dispatch day), auto-reroute.

- [ ] O1: GET /catalog lists 3 kit types with pricing.
- [ ] O2: GET /labs returns nearest-first with remaining/is_available (null quota = unlimited).
- [ ] O3: POST /orders auto (qty 1) -> 201, allocates specific QR, lab assigned, payment initiated.
- [ ] O4: POST /orders bulk (>= bulk_min_qty) uses bulk_price in total.
- [ ] O5: POST /orders manual with unknown lab -> 400; without lab_id -> 400.
- [ ] O6: POST /orders manual to full lab -> 201 with quota_warning:true (advisory, not reject).
- [ ] O7: POST /orders exceeding inventory -> 409, no kits allocated.
- [ ] O8: GET /orders/:id returns order + lab + kits; unknown -> 404.
- [ ] Q1: Drop-off confirm on ordered kit -> transporting + dispatch.quota consumed.
- [ ] Q2: Retry confirm -> 200, dispatch null (no double-consume; usage unchanged).
- [ ] Q3: Confirm with assigned lab full -> rerouted:true to nearest available + lab_reassigned event.
- [ ] Q4: Confirm with no lab anywhere available -> exhausted (transporting kept).
- [ ] Q5: lab_quota_usage row per (lab, dispatch-day); unlimited lab creates no row.
