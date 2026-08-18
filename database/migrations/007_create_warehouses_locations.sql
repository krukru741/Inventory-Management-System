-- =============================================================================
-- Migration 007: Warehouses & Locations (Bins/Shelves)
-- Description : Multi-warehouse support with zone → aisle → rack → bin
--               granularity for precise stock placement.
-- =============================================================================

CREATE TABLE warehouses (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200)    NOT NULL,
    code            VARCHAR(20)     NOT NULL,   -- Short ID used in location codes
    address_line1   VARCHAR(255),
    address_line2   VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(100),
    postal_code     VARCHAR(20),
    country         VARCHAR(100),
    phone           VARCHAR(30),
    email           VARCHAR(255),
    manager_id      UUID            REFERENCES users (id) ON DELETE SET NULL,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT warehouses_code_unique UNIQUE (code)
);

COMMENT ON TABLE  warehouses        IS 'Physical warehouse / fulfilment-centre locations.';
COMMENT ON COLUMN warehouses.code   IS 'Short alphanumeric code, e.g. WH01. Used in bin codes.';

CREATE INDEX idx_warehouses_code        ON warehouses (code);
CREATE INDEX idx_warehouses_is_active   ON warehouses (is_active);

CREATE TRIGGER trg_warehouses_updated_at
    BEFORE UPDATE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Locations (Zones / Aisles / Racks / Bins)
-- ---------------------------------------------------------------------------
-- Each row represents one physical storage slot. Hierarchy is encoded in
-- the code field (e.g. WH01-A-03-R2-B5) and optionally in parent_id.
CREATE TABLE locations (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id    UUID            NOT NULL REFERENCES warehouses (id) ON DELETE RESTRICT,
    parent_id       UUID            REFERENCES locations (id) ON DELETE SET NULL,
    code            VARCHAR(60)     NOT NULL,   -- Full path code, unique per warehouse
    name            VARCHAR(200),
    location_type   VARCHAR(30)     NOT NULL DEFAULT 'bin', -- zone | aisle | rack | bin | floor
    capacity        NUMERIC(14,4),              -- Max units this location holds (NULL = unlimited)
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT locations_code_warehouse_unique UNIQUE (warehouse_id, code)
);

COMMENT ON TABLE  locations               IS 'Granular storage locations within a warehouse (zone/aisle/rack/bin).';
COMMENT ON COLUMN locations.code          IS 'Human-readable path, unique within the warehouse.';
COMMENT ON COLUMN locations.location_type IS 'Level in the physical hierarchy: zone > aisle > rack > bin.';
COMMENT ON COLUMN locations.capacity      IS 'Optional max quantity; NULL means no cap.';

CREATE INDEX idx_locations_warehouse_id ON locations (warehouse_id);
CREATE INDEX idx_locations_parent_id    ON locations (parent_id);
CREATE INDEX idx_locations_code         ON locations (warehouse_id, code);
CREATE INDEX idx_locations_is_active    ON locations (is_active);

CREATE TRIGGER trg_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
