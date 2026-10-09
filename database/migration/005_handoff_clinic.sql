-- WellOra M11: clinic handoff attribution for sales-volume reporting.
-- Review only. DO NOT push to prod from agent. Owner applies manually.

ALTER TABLE kits ADD COLUMN IF NOT EXISTS handoff_clinic_id UUID NULL REFERENCES clinics(id);
ALTER TABLE kits ADD COLUMN IF NOT EXISTS handoff_at TIMESTAMPTZ NULL;
CREATE INDEX IF NOT EXISTS idx_kits_handoff_clinic ON kits (handoff_clinic_id);
