# M7 Transport TESTCASE

- [ ] T1: Drop-off confirm on activated kit -> transporting + return_method dropoff + event.
- [ ] T2: Pickup-collected on activated kit -> transporting + return_method pickup + event.
- [ ] T3: Confirm on non-activated kit (not_activated/testing/results) -> 409, no event.
- [ ] T4: Retry confirm on transporting kit -> 200 same status, no duplicate event.
- [ ] T5: Lab arrival from transporting -> testing_in_progress + pins assigned_lab_id.
- [ ] T6: Lab arrival without lab_id and no assigned lab -> 400.
- [ ] T7: Lab arrival with mismatched lab_id -> 409.
- [ ] T8: Track returns kit + lab + report + ordered timeline.
- [ ] T9: Track unknown kit -> 404.
