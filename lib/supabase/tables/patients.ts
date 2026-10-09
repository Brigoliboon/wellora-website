import type { SupabaseClient } from '@supabase/supabase-js';
import type { Patient } from '../models';

export async function find_patient_by_mobile(
  supabase: SupabaseClient,
  mobile: string,
): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('mobile', mobile)
    .single();
  if (error) return null;
  return data as Patient;
}

export async function find_or_create_patient(
  supabase: SupabaseClient,
  mobile: string,
): Promise<{ patient: Patient; created: boolean }> {
  const existing = await find_patient_by_mobile(supabase, mobile);
  if (existing) return { patient: existing, created: false };
  const { data, error } = await supabase
    .from('patients')
    .insert({ mobile })
    .select()
    .single();
  if (error) throw new Error(`patient create failed: ${error.message}`);
  return { patient: data as Patient, created: true };
}

export async function set_trusted_device(
  supabase: SupabaseClient,
  patient_id: string,
  fingerprint: string,
): Promise<void> {
  const { error } = await supabase
    .from('patients')
    .update({ trusted_device_fingerprint: fingerprint })
    .eq('id', patient_id);
  if (error) throw new Error(`device bind failed: ${error.message}`);
}
