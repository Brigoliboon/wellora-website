# M0 Kit Inventory TESTCASE

- [ ] M0-1: Manufacture seeds kits with unique qr_payload, status not_activated, expiry > manufactured_at.
- [ ] M0-2: Duplicate qr_payload rejected (unique constraint).
- [ ] M0-3: Manufacture logs kit_events manufactured with from_status null.
- [ ] M0-4: Kits have no patient_id / order_id at manufacture time.
- [ ] M0-5: Expired kits cannot be ordered or activated (guard).
- [ ] M0-6: Bulk manufacture (e.g. 100 kits) succeeds idempotently on retry with same payloads.
