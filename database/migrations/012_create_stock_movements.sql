-- =============================================================================
-- Migration 012: Stock Movements (Ledger)
-- Description : Immutable ledger of every stock change. This is the single
--               source of truth for inventory history and reconciliation.
--               Cached quantities in the `inventory` table must always be
--               updated atomically in the same transaction as a new movement.
--
--               Rule: NEVER update inventory.quantity directly. Always insert
--               a stock_movements row and update inventory within one TX.
-- =============================================================================

CREATE TABLE stock_movements (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID            NOT NULL REFERENCES products  (id) ON DELETE RESTRICT,
    variant_id      UUID            REFERENCES product_variants   (id) ON DELETE RESTRICT,
    location_id     UUID            NOT NULL REFERENCES locations  (id) ON DELETE RESTRICT,
    movement_type   movement_type   NOT NULL,
    quantity        NUMERIC(14,4)   NOT NULL,   -- Always POSITIVE; direction encoded in movement_type
    -- Resulting balance after this movement (snapshot for easy ledger display)
    balance_after   NUMERIC(14,4)   NOT NULL,
    -- Unit cost at time of movement (for valuation)
    unit_cost       NUMERIC(14,4)   NOT NULL DEFAULT 0,
    -- Batch / lot / serial
    batch_number    VARCHAR(100),
    lot_number      VARCHAR(100),
    serial_number   VARCHAR(150),
    expiry_date     DATE,
    -- Reference links (at most one will be set)
    po_id           UUID            REFERENCES purchase_orders (id) ON DELETE SET NULL,
    so_id           UUID            REFERENCES sales_orders    (id) ON DELETE SET NULL,
    return_id       UUID            REFERENCES returns         (id) ON DELETE SET NULL,
    transfer_id     UUID,           -- FK to stock_transfers added below
    -- Idempotency / deduplication
    idempotency_key VARCHAR(100),
    -- Context
    reason          TEXT,           -- Free-text reason for adjustments
    performed_by    UUID            REFERENCES users (id) ON DELETE SET NULL,
    performed_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT sm_quantity_pos              CHECK (quantity > 0),
    CONSTRAINT sm_idempotency_key_unique    UNIQUE (idempotency_key) -- NULL allowed, duplicates prevented when set
);

COMMENT ON TABLE  stock_movements                 IS 'Immutable ledger of all stock changes. Never delete rows.';
COMMENT ON COLUMN stock_movements.quantity        IS 'Always positive. Movement direction is encoded in movement_type.';
COMMENT ON COLUMN stock_movements.balance_after   IS 'Snapshot of location stock after this movement — denormalised for fast ledger display.';
COMMENT ON COLUMN stock_movements.idempotency_key IS 'Caller-supplied key to ensure safe API retries without double-counting.';

-- Indexes for common query patterns
CREATE INDEX idx_sm_product_id      ON stock_movements (product_id);
CREATE INDEX idx_sm_location_id     ON stock_movements (location_id);
CREATE INDEX idx_sm_variant_id      ON stock_movements (variant_id);
CREATE INDEX idx_sm_movement_type   ON stock_movements (movement_type);
CREATE INDEX idx_sm_performed_at    ON stock_movements (performed_at DESC);
CREATE INDEX idx_sm_po_id           ON stock_movements (po_id)       WHERE po_id       IS NOT NULL;
CREATE INDEX idx_sm_so_id           ON stock_movements (so_id)       WHERE so_id       IS NOT NULL;
CREATE INDEX idx_sm_return_id       ON stock_movements (return_id)   WHERE return_id   IS NOT NULL;
CREATE INDEX idx_sm_transfer_id     ON stock_movements (transfer_id) WHERE transfer_id IS NOT NULL;
-- Composite: "movement history for a product at a location"
CREATE INDEX idx_sm_product_loc_time ON stock_movements (product_id, location_id, performed_at DESC);

-- NOTE: stock_movements is append-only — no UPDATE trigger needed.

-- ---------------------------------------------------------------------------
-- Stock Transfers (movement between warehouses / locations)
-- ---------------------------------------------------------------------------
CREATE TABLE stock_transfers (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_number     VARCHAR(50)     NOT NULL,
    from_location_id    UUID            NOT NULL REFERENCES locations (id) ON DELETE RESTRICT,
    to_location_id      UUID            NOT NULL REFERENCES locations (id) ON DELETE RESTRICT,
    status              transfer_status NOT NULL DEFAULT 'draft',
    transfer_date       DATE            NOT NULL DEFAULT CURRENT_DATE,
    expected_date       DATE,
    completed_date      DATE,
    created_by          UUID            REFERENCES users (id) ON DELETE SET NULL,
    approved_by         UUID            REFERENCES users (id) ON DELETE SET NULL,
    notes               TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT stock_transfers_number_unique    UNIQUE (transfer_number),
    CONSTRAINT stock_transfers_diff_locations   CHECK  (from_location_id <> to_location_id)
);

COMMENT ON TABLE stock_transfers IS 'Stock transfer orders between locations or warehouses.';

CREATE INDEX idx_transfers_from     ON stock_transfers (from_location_id);
CREATE INDEX idx_transfers_to       ON stock_transfers (to_location_id);
CREATE INDEX idx_transfers_status   ON stock_transfers (status);

CREATE TRIGGER trg_stock_transfers_updated_at
    BEFORE UPDATE ON stock_transfers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Stock Transfer Items
-- ---------------------------------------------------------------------------
CREATE TABLE stock_transfer_items (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id     UUID            NOT NULL REFERENCES stock_transfers  (id) ON DELETE CASCADE,
    product_id      UUID            NOT NULL REFERENCES products         (id) ON DELETE RESTRICT,
    variant_id      UUID            REFERENCES product_variants          (id) ON DELETE RESTRICT,
    requested_qty   NUMERIC(14,4)   NOT NULL,
    sent_qty        NUMERIC(14,4)   NOT NULL DEFAULT 0,
    received_qty    NUMERIC(14,4)   NOT NULL DEFAULT 0,
    batch_number    VARCHAR(100),
    serial_number   VARCHAR(150),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT sti_requested_qty_pos CHECK (requested_qty > 0)
);

CREATE INDEX idx_sti_transfer_id    ON stock_transfer_items (transfer_id);
CREATE INDEX idx_sti_product_id     ON stock_transfer_items (product_id);

CREATE TRIGGER trg_stock_transfer_items_updated_at
    BEFORE UPDATE ON stock_transfer_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Backfill the transfer_id FK on stock_movements
ALTER TABLE stock_movements
    ADD CONSTRAINT fk_sm_transfer_id
    FOREIGN KEY (transfer_id) REFERENCES stock_transfers (id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Cycle Counts (Physical Inventory)
-- ---------------------------------------------------------------------------
CREATE TABLE cycle_counts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    count_number    VARCHAR(50) NOT NULL,
    warehouse_id    UUID        NOT NULL REFERENCES warehouses (id) ON DELETE RESTRICT,
    status          VARCHAR(30) NOT NULL DEFAULT 'planned', -- planned | in_progress | completed | cancelled
    scheduled_date  DATE,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_by      UUID        REFERENCES users (id) ON DELETE SET NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT cycle_counts_number_unique UNIQUE (count_number)
);

CREATE INDEX idx_cc_warehouse_id    ON cycle_counts (warehouse_id);
CREATE INDEX idx_cc_status          ON cycle_counts (status);

CREATE TRIGGER trg_cycle_counts_updated_at
    BEFORE UPDATE ON cycle_counts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Cycle Count Items (per-product count result)
-- ---------------------------------------------------------------------------
CREATE TABLE cycle_count_items (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    count_id        UUID            NOT NULL REFERENCES cycle_counts (id) ON DELETE CASCADE,
    product_id      UUID            NOT NULL REFERENCES products     (id) ON DELETE RESTRICT,
    variant_id      UUID            REFERENCES product_variants      (id) ON DELETE RESTRICT,
    location_id     UUID            NOT NULL REFERENCES locations    (id) ON DELETE RESTRICT,
    system_qty      NUMERIC(14,4)   NOT NULL,    -- Quantity per system before count
    counted_qty     NUMERIC(14,4),               -- NULL until counted
    discrepancy     NUMERIC(14,4)                -- counted_qty - system_qty (auto-computed ideally)
        GENERATED ALWAYS AS (counted_qty - system_qty) STORED,
    batch_number    VARCHAR(100),
    counted_by      UUID            REFERENCES users (id) ON DELETE SET NULL,
    counted_at      TIMESTAMPTZ,
    adjustment_posted BOOLEAN       NOT NULL DEFAULT FALSE, -- TRUE once discrepancy converted to stock_movement
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN cycle_count_items.discrepancy IS 'Computed column: counted_qty - system_qty. Negative = shrinkage.';

CREATE INDEX idx_cci_count_id       ON cycle_count_items (count_id);
CREATE INDEX idx_cci_product_id     ON cycle_count_items (product_id);
CREATE INDEX idx_cci_location_id    ON cycle_count_items (location_id);
