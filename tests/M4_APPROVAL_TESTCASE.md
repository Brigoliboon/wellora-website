# M4 Approval Flow TESTCASE (push-to-trusted-device, replaces SMS OTP)

Flow: unknown device resolve -> approval pending + code shown ONLY on requesting
device -> trusted device approves by entering that code -> requesting device
rebinds (overwrite), kit activates. First activation for a number auto-trusts.

- [ ] A1: Resolve inactive kit from unknown device creates approval (pending, ~5-min expiry), returns code to requesting device only.
- [ ] A2: Trusted device pending-list shows request metadata WITHOUT the code.
- [ ] A3: Approve with correct code from trusted device -> approved; requesting device becomes trusted (overwrite); kit activates + event logged.
- [ ] A4: Approve with wrong code -> 401, approval stays pending, no rebind.
- [ ] A5: Blind approve without code rejected (no auto-bind on tap alone).
- [ ] A6: Expired approval cannot approve (410/expired); requesting device must re-request.
- [ ] A7: Deny from trusted device -> denied; requesting device stays untrusted.
- [ ] A8: Old device requires approval again after overwrite (mirrors M4-6).
- [ ] A9: First activation for new number auto-trusts, no approval needed.
- [ ] A10: Resolve already-activated kit -> tracking, creates NO approval row.
- [ ] A11: Pure login approval (kit_id null) -> approve issues session to requesting device.
