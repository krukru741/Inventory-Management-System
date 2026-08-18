-- =============================================================================
-- Migration 008: Inventory (Cached Stock Levels)
-- Description : Per-product-per-location cached quantity. This table is a
--               performance cache — the authoritative source of truth is the
--               stock_movements ledger. Quantities are updated transactionally
--               alongside every stock movement record.
--
--               Supports batch/lot, expiry, and serial-number tracking.
-- =============================================================================

CREATE TABLE inventory (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID            NOT NULL REFERENCES products  (id) ON DELETE RESTRICT,
    variant_id      UUID            REFERENCES product_variants (id) ON DELETE RESTRICT,
    location_id     UUID            NOT NULL REFERENCES locations (id) ON DELETE RESTRICT,
    -- Quantity
    quantity        NUMERIC(14,4)   NOT NULL DEFAULT 0,
    reserved_qty    NUMERIC(14,4)   NOT NULL DEFAULT 0, -- Qty allocated to open sales orders
    -- Batch / lot tracking (NULL when track_batch = FALSE on product)
    batch_number    VARCHAR(100),
    lot_number      VARCHAR(100),
    expiry_date     DATE,
    manufacture_date DATE,
    -- Cost at time of receipt (for FIFO/LIFO layers)
    unit_cost       NUMERIC(14,4)   NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Unique stock layer per product + location + batch
    CONSTRAINT inventory_unique_layer UNIQUE (product_id, location_id, batch_number, lot_number),
    CONSTRAINT inventory_qty_nneg     CHECK  (quantity     >= 0),
    CONSTRAINT inventory_reserved_nneg CHECK (reserved_qty >= 0),
    CONSTRAINT inventory_reserved_lte_qty CHECK (reserved_qty <= quantity)
);

COMMENT ON TABLE  inventory              IS 'Cached on-hand stock by product, location, and batch layer.';
COMMENT ON COLUMN inventory.quantity     IS 'On-hand units. Updated atomically with every stock movement.';
COMMENT ON COLUMN inventory.reserved_qty IS 'Allocated to confirmed sales orders but not yet shipped.';
COMMENT ON COLUMN inventory.unit_cost    IS 'Cost per unit for this batch layer (used by FIFO/LIFO valuation).';

-- Indexes
CREATE INDEX idx_inventory_product_id   ON inventory (product_id);
CREATE INDEX idx_inventory_location_id  ON inventory (location_id);
CREATE INDEX idx_inventory_variant_id   ON inventory (variant_id);
CREATE INDEX idx_inventory_batch        ON inventory (batch_number) WHERE batch_number IS NOT NULL;
CREATE INDEX idx_inventory_expiry       ON inventory (expiry_date)  WHERE expiry_date  IS NOT NULL;
-- Composite for the common "available stock by product" query
CREATE INDEX idx_inventory_product_loc  ON inventory (product_id, location_id);

-- Auto-update trigger
CREATE TRIGGER trg_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Serial Numbers
-- Tracks individual units (one row per physical item) for high-value products.
-- ---------------------------------------------------------------------------
CREATE TABLE serial_numbers (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID            NOT NULL REFERENCES products  (id) ON DELETE RESTRICT,
    variant_id      UUID            REFERENCES product_variants (id) ON DELETE SET NULL,
    serial_number   VARCHAR(150)    NOT NULL,
    location_id     UUID            REFERENCES locations (id) ON DELETE SET NULL,
    status          VARCHAR(30)     NOT NULL DEFAULT 'in_stock',
        -- in_stock | sold | returned | defective | scrapped
    sold_at         TIMESTAMPTZ,
    so_id           UUID,           -- FK to sales_orders added in migration 010
    notes           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT serial_numbers_unique UNIQUE (product_id, serial_number)
);

COMMENT ON TABLE  serial_numbers IS 'Unit-level serial number registry for individually tracked items.';

CREATE INDEX idx_serial_numbers_product_id     ON serial_numbers (product_id);
CREATE INDEX idx_serial_numbers_serial_number  ON serial_numbers (serial_number);
CREATE INDEX idx_serial_numbers_location_id    ON serial_numbers (location_id);
CREATE INDEX idx_serial_numbers_status         ON serial_numbers (status);

CREATE TRIGGER trg_serial_numbers_updated_at
    BEFORE UPDATE ON serial_numbers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
