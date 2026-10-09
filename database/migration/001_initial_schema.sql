-- WellOra initial schema — M0..M11 backend-only
-- Review only. DO NOT push to prod from agent. Owner applies manually.
-- Assumes kits are pre-created at manufacturing time (M0).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$ BEGIN CREATE TYPE kit_status AS ENUM ('not_activated','activated','transporting','testing_in_progress','results_ready'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE assignment_mode AS ENUM ('auto','manual'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE delivery_method AS ENUM ('pickup','shipped'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('initiated','paid','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE return_method AS ENUM ('dropoff','pickup'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE kit_trigger AS ENUM ('manufactured','ordered','activated','dropoff_confirm','pickup_collected','lab_arrived','report_attached'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE actor_role AS ENUM ('system','patient','clinic','lab','admin','manufacturer'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Catalog
CREATE TABLE IF NOT EXISTS kit_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL CHECK (slug IN ('urinalysis','fecalysis','oral')),
  name TEXT NOT NULL,
  individual_price NUMERIC(10,2) NOT NULL CHECK (individual_price >= 0),
  bulk_price NUMERIC(10,2) NOT NULL CHECK (bulk_price >= 0),
  bulk_min_qty INT NOT NULL DEFAULT 10 CHECK (bulk_min_qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patients (M1 + single-device trust M5)
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile TEXT UNIQUE NOT NULL,
  trusted_device_fingerprint TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patients_mobile ON patients (mobile);

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'activation_rebind' CHECK (purpose IN ('register','login','activation_rebind')),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_mobile ON otp_codes (mobile);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  device_fingerprint TEXT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions (patient_id);

-- Partners
CREATE TABLE IF NOT EXISTS clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NULL,
  lat DOUBLE PRECISION NULL,
  lng DOUBLE PRECISION NULL,
  contact TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clinics_active ON clinics (is_active);

CREATE TABLE IF NOT EXISTS labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NULL,
  lat DOUBLE PRECISION NULL,
  lng DOUBLE PRECISION NULL,
  contact TEXT NULL,
  daily_quota INT NULL CHECK (daily_quota IS NULL OR daily_quota > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_labs_active ON labs (is_active);

CREATE TABLE IF NOT EXISTS lab_quota_usage (
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  quota_date DATE NOT NULL,
  used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  PRIMARY KEY (lab_id, quota_date)
);

-- Kits (M0 pre-manufactured, activated only on customer scan)
CREATE TABLE IF NOT EXISTS kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_payload TEXT UNIQUE NOT NULL,
  kit_type_id UUID NOT NULL REFERENCES kit_types(id),
  status kit_status NOT NULL DEFAULT 'not_activated',
  manufactured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  patient_id UUID NULL REFERENCES patients(id),
  order_id UUID NULL,
  assigned_lab_id UUID NULL REFERENCES labs(id),
  return_method return_method NULL,
  consent_given_at TIMESTAMPTZ NULL,
  consent_version TEXT NULL,
  basic_info JSONB NULL,
  activated_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kits_expiry_after_mfg CHECK (expires_at > manufactured_at)
);
CREATE INDEX IF NOT EXISTS idx_kits_qr ON kits (qr_payload);
CREATE INDEX IF NOT EXISTS idx_kits_status ON kits (status);
CREATE INDEX IF NOT EXISTS idx_kits_patient ON kits (patient_id);
CREATE INDEX IF NOT EXISTS idx_kits_lab ON kits (assigned_lab_id);

CREATE TABLE IF NOT EXISTS kit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  from_status kit_status NULL,
  to_status kit_status NOT NULL,
  trigger kit_trigger NOT NULL,
  actor_role actor_role NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kit_events_kit ON kit_events (kit_id, created_at);

-- Orders allocate specific pre-printed QRs
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  assigned_lab_id UUID NOT NULL REFERENCES labs(id),
  assignment_mode assignment_mode NOT NULL,
  delivery_method delivery_method NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  payment_status payment_status NOT NULL DEFAULT 'initiated',
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_orders_patient ON orders (patient_id);

CREATE TABLE IF NOT EXISTS order_kits (
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  kit_id UUID NOT NULL REFERENCES kits(id),
  PRIMARY KEY (order_id, kit_id),
  UNIQUE (kit_id)
);

-- Lab reporting (manual Results Ready trigger)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NOT NULL UNIQUE REFERENCES kits(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id),
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image','pdf')),
  uploaded_by TEXT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI (post Results Ready only)
CREATE TABLE IF NOT EXISTS ai_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  model_version TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  message TEXT NOT NULL,
  tool_call TEXT NULL CHECK (tool_call IS NULL OR tool_call = 'book_consultation'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_kit ON chat_messages (kit_id, created_at);

-- Ratings (one per completed kit)
CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NOT NULL UNIQUE REFERENCES kits(id) ON DELETE CASCADE,
  lab_id UUID NOT NULL REFERENCES labs(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ratings_lab ON ratings (lab_id);
