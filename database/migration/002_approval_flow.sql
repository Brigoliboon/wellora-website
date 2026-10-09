-- WellOra approval flow (push-to-trusted-device, replaces SMS OTP)
-- Review only. DO NOT push to prod from agent. Owner applies manually.
-- Design: unknown device requests activation -> backend mints code + pending row
-- -> code shown ONLY on requesting device; trusted device approves by entering
-- that code (proves physical presence, no blind-approve). First activation for
-- a number auto-trusts (bootstrap, documented risk in IMPLEMENTATION.md).
-- Push dispatch (FCM) happens app-side on approval creation; see
-- future lib/notify/send_approval_push.ts stub. Demo uses polling.

-- 1. Push token for the trusted device (FCM registration token, nullable until app registers)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS push_token TEXT NULL;

-- 2. Pending approvals (activation + device-login). Status as TEXT+CHECK to avoid enum migration.
CREATE TABLE IF NOT EXISTS activation_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NULL REFERENCES kits(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  requesting_device_fingerprint TEXT NOT NULL,
  requesting_push_token TEXT NULL,
  code_hash TEXT NOT NULL,
  consent_version TEXT NULL,
  basic_info JSONB NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied','expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT approvals_expiry_future CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS idx_approvals_pending ON activation_approvals (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_approvals_patient ON activation_approvals (patient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_approvals_kit ON activation_approvals (kit_id);

-- 3. Custom OTP fully removed (approval flow is the only device-proof).
--    Drop table + dependent types. Nothing else changes: kits, kit_events,
--    sessions, labs, clinics, orders, reports untouched.
DROP TABLE IF EXISTS otp_codes;
