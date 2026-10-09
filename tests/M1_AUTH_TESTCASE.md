# M1 Auth TESTCASE (device-trust, no SMS OTP)

- [ ] M1-1: Register with mobile creates patient; duplicate mobile returns existing (idempotent).
- [ ] M1-2: Device login on known device (or first touch auto-trust) returns session immediately.
- [ ] M1-3: Device login on unknown device returns pending + approval + code (no session yet).
- [ ] M1-4: After trusted-device approval, device login returns active session.
- [ ] M1-5: Refresh with valid token rotates (new token, extended expiry); wrong token rejected.
- [ ] M1-6: Expired session refresh rejected.
- [ ] M1-7: Health-data endpoints reject unauthenticated access.
