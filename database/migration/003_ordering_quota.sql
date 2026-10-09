-- WellOra M3/M6 ordering + OTW quota (assign at order, consume at dispatch).
-- Review only. DO NOT push to prod from agent. Owner applies manually.

-- 1. Reroute audit trigger.
ALTER TYPE kit_trigger ADD VALUE IF NOT EXISTS 'lab_reassigned';

-- 2. Atomic quota reservation. Returns true when a slot is consumed (or lab
--    is unlimited/inactive-check passed), false when the dispatch-day quota is
--    exhausted. Single-statement => safe under concurrent confirm requests.
CREATE OR REPLACE FUNCTION reserve_lab_quota(p_lab_id UUID, p_day DATE, p_n INT DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quota INT;
BEGIN
  SELECT daily_quota INTO v_quota FROM labs WHERE id = p_lab_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  IF v_quota IS NULL THEN
    RETURN true; -- unlimited lab, nothing to consume
  END IF;
  INSERT INTO lab_quota_usage (lab_id, quota_date, used_count)
  VALUES (p_lab_id, p_day, 0)
  ON CONFLICT (lab_id, quota_date) DO NOTHING;
  UPDATE lab_quota_usage
  SET used_count = used_count + p_n
  WHERE lab_id = p_lab_id AND quota_date = p_day
    AND used_count + p_n <= v_quota;
  RETURN FOUND;
END;
$$;
