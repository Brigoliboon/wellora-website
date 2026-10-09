-- WellOra M2 geo: PostGIS points for Mapbox-ready queries.
-- Review only. DO NOT push to prod from agent. Owner applies manually.
-- Clients keep sending lat/lng; triggers sync location. geojson output drops
-- straight into Mapbox GL (coordinates are [lng, lat]).

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Point columns (geography = meter-based distance, WGS84).
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS location geography(Point, 4326);
ALTER TABLE labs ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- 2. Backfill existing rows.
UPDATE clinics
SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
WHERE lat IS NOT NULL AND lng IS NOT NULL AND location IS NULL;
UPDATE labs
SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
WHERE lat IS NOT NULL AND lng IS NOT NULL AND location IS NULL;

-- 3. Spatial indexes.
CREATE INDEX IF NOT EXISTS idx_clinics_location ON clinics USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_labs_location ON labs USING GIST (location);

-- 4. Keep location in sync with lat/lng writes.
CREATE OR REPLACE FUNCTION sync_location()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  ELSE
    NEW.location := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinics_location ON clinics;
CREATE TRIGGER trg_clinics_location
BEFORE INSERT OR UPDATE OF lat, lng ON clinics
FOR EACH ROW EXECUTE FUNCTION sync_location();

DROP TRIGGER IF EXISTS trg_labs_location ON labs;
CREATE TRIGGER trg_labs_location
BEFORE INSERT OR UPDATE OF lat, lng ON labs
FOR EACH ROW EXECUTE FUNCTION sync_location();

-- 5. Nearest lookups. Null-location rows sort last (no coords yet).
CREATE OR REPLACE FUNCTION nearby_labs(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_limit INT DEFAULT 20)
RETURNS TABLE (
  id UUID, name TEXT, address TEXT,
  lat DOUBLE PRECISION, lng DOUBLE PRECISION,
  daily_quota INT, is_active BOOLEAN,
  distance_m DOUBLE PRECISION, geojson JSON
)
LANGUAGE sql
STABLE
AS $$
  SELECT l.id, l.name, l.address, l.lat, l.lng,
    l.daily_quota, l.is_active,
    ST_Distance(
      l.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_m,
    ST_AsGeoJSON(l.location)::json AS geojson
  FROM labs l
  WHERE l.is_active = true
  ORDER BY ST_Distance(
    l.location,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  ) ASC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION nearby_clinics(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_limit INT DEFAULT 20)
RETURNS TABLE (
  id UUID, name TEXT, address TEXT,
  lat DOUBLE PRECISION, lng DOUBLE PRECISION,
  distance_m DOUBLE PRECISION, geojson JSON
)
LANGUAGE sql
STABLE
AS $$
  SELECT c.id, c.name, c.address, c.lat, c.lng,
    ST_Distance(
      c.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_m,
    ST_AsGeoJSON(c.location)::json AS geojson
  FROM clinics c
  WHERE c.is_active = true
  ORDER BY ST_Distance(
    c.location,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  ) ASC
  LIMIT p_limit;
$$;
