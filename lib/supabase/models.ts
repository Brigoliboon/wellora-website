// WellOra prod schema type reference — mirrors database/migration/001_initial_schema.sql
// Keep in sync with SQL. Helpers live in lib/supabase/tables/.

export type KitStatus =
  | 'not_activated'
  | 'activated'
  | 'transporting'
  | 'testing_in_progress'
  | 'results_ready';

export type AssignmentMode = 'auto' | 'manual';
export type DeliveryMethod = 'pickup' | 'shipped';
export type PaymentStatus = 'initiated' | 'paid' | 'failed';
export type ReturnMethod = 'dropoff' | 'pickup';
export type KitTrigger =
  | 'manufactured'
  | 'ordered'
  | 'activated'
  | 'dropoff_confirm'
  | 'pickup_collected'
  | 'lab_arrived'
  | 'lab_reassigned'
  | 'report_attached';
export type ActorRole =
  | 'system'
  | 'patient'
  | 'clinic'
  | 'lab'
  | 'admin'
  | 'manufacturer';

export interface KitType {
  id: string;
  slug: 'urinalysis' | 'fecalysis' | 'oral';
  name: string;
  individual_price: number;
  bulk_price: number;
  bulk_min_qty: number;
  created_at: string;
}

export interface Patient {
  id: string;
  mobile: string;
  trusted_device_fingerprint: string | null;
  push_token: string | null;
  created_at: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'denied' | 'expired';

export interface ActivationApproval {
  id: string;
  kit_id: string | null;
  patient_id: string;
  requesting_device_fingerprint: string;
  requesting_push_token: string | null;
  code_hash: string;
  consent_version: string | null;
  basic_info: Record<string, unknown> | null;
  status: ApprovalStatus;
  expires_at: string;
  resolved_at: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  patient_id: string;
  refresh_token_hash: string;
  device_fingerprint: string | null;
  expires_at: string;
  created_at: string;
}

export interface Clinic {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  location: string | null; // opaque EWKB via PostgREST; use rpc geojson for maps
  contact: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Lab {
  id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  contact: string | null;
  daily_quota: number | null;
  location: string | null; // opaque EWKB via PostgREST; use rpc geojson for maps
  is_active: boolean;
  created_at: string;
}

export interface LabQuotaUsage {
  lab_id: string;
  quota_date: string;
  used_count: number;
}

export interface Kit {
  id: string;
  qr_payload: string;
  kit_type_id: string;
  status: KitStatus;
  manufactured_at: string;
  expires_at: string;
  patient_id: string | null;
  order_id: string | null;
  assigned_lab_id: string | null;
  return_method: ReturnMethod | null;
  handoff_clinic_id: string | null;
  handoff_at: string | null;
  consent_given_at: string | null;
  consent_version: string | null;
  basic_info: Record<string, unknown> | null;
  activated_at: string | null;
  created_at: string;
}

export interface KitEvent {
  id: string;
  kit_id: string;
  from_status: KitStatus | null;
  to_status: KitStatus;
  trigger: KitTrigger;
  actor_role: ActorRole;
  created_at: string;
}

export interface Order {
  id: string;
  patient_id: string;
  assigned_lab_id: string;
  assignment_mode: AssignmentMode;
  delivery_method: DeliveryMethod;
  delivery_fee: number;
  payment_status: PaymentStatus;
  total_amount: number;
  created_at: string;
}

export interface OrderKit {
  order_id: string;
  kit_id: string;
}

export interface Report {
  id: string;
  kit_id: string;
  lab_id: string;
  file_url: string;
  file_type: 'image' | 'pdf';
  uploaded_by: string | null;
  uploaded_at: string;
}

export interface AiSummary {
  id: string;
  kit_id: string;
  summary_text: string;
  model_version: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  patient_id: string;
  kit_id: string;
  role: 'user' | 'assistant';
  message: string;
  tool_call: 'book_consultation' | null;
  created_at: string;
}

export interface Rating {
  id: string;
  kit_id: string;
  lab_id: string;
  patient_id: string;
  score: number;
  comment: string | null;
  created_at: string;
}

// Mapbox-ready point. NOTE: raw `location` column arrives via PostgREST as an
// opaque EWKB hex string -- use `geojson` (from nearby_* rpc) for rendering.
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat], straight into mapboxgl
}

// Activation resolve next-action (spec §4.4 structured result, not HTTP redirect)
export type KitNextAction =
  | { action: 'tracking'; kit_id: string; status: KitStatus }
  | { action: 'expired'; kit_id: string }
  | { action: 'need_otp'; kit_id: string; mobile: string }
  | { action: 'need_consent'; kit_id: string }
  | { action: 'activated'; kit_id: string };
