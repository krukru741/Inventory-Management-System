-- =============================================================================
-- Migration 010: Purchase Orders
-- Description : Full purchase order lifecycle — header, line items, and
--               receipt records. Partial shipment is supported via received_qty.
-- =============================================================================

CREATE TABLE purchase_orders (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number           VARCHAR(50) NOT NULL,               -- e.g. PO-2026-00001
    supplier_id         UUID        NOT NULL REFERENCES suppliers (id) ON DELETE RESTRICT,
    warehouse_id        UUID        NOT NULL REFERENCES warehouses (id) ON DELETE RESTRICT,
    status              po_status   NOT NULL DEFAULT 'draft',
    order_date          DATE        NOT NULL DEFAULT CURRENT_DATE,
    expected_date       DATE,
    received_date       DATE,
    -- Financials (denormalised totals, recomputed on line change)
    subtotal            NUMERIC(14,4) NOT NULL DEFAULT 0,
    tax_amount          NUMERIC(14,4) NOT NULL DEFAULT 0,
    shipping_cost       NUMERIC(14,4) NOT NULL DEFAULT 0,
    total_amount        NUMERIC(14,4) NOT NULL DEFAULT 0,
    currency            CHAR(3)     NOT NULL DEFAULT 'USD',
    -- Approval workflow
    created_by          UUID        REFERENCES users (id) ON DELETE SET NULL,
    approved_by         UUID        REFERENCES users (id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    -- Notes
    supplier_reference  VARCHAR(100),                       -- Supplier's PO / quote number
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT purchase_orders_po_number_unique UNIQUE (po_number),
    CONSTRAINT purchase_orders_total_nneg       CHECK  (total_amount >= 0)
);

COMMENT ON TABLE  purchase_orders                    IS 'Purchase order headers.';
COMMENT ON COLUMN purchase_orders.po_number          IS 'Human-readable sequential PO number.';
COMMENT ON COLUMN purchase_orders.supplier_reference IS 'Vendor quote / reference number for cross-referencing.';

CREATE INDEX idx_po_supplier_id     ON purchase_orders (supplier_id);
CREATE INDEX idx_po_warehouse_id    ON purchase_orders (warehouse_id);
CREATE INDEX idx_po_status          ON purchase_orders (status);
CREATE INDEX idx_po_order_date      ON purchase_orders (order_date);
CREATE INDEX idx_po_expected_date   ON purchase_orders (expected_date);

CREATE TRIGGER trg_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Purchase Order Line Items
-- ---------------------------------------------------------------------------
CREATE TABLE purchase_order_items (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id           UUID            NOT NULL REFERENCES purchase_orders (id) ON DELETE CASCADE,
    product_id      UUID            NOT NULL REFERENCES products  (id) ON DELETE RESTRICT,
    variant_id      UUID            REFERENCES product_variants (id) ON DELETE RESTRICT,
    description     VARCHAR(300),   -- Optional override for display on PO document
    ordered_qty     NUMERIC(14,4)   NOT NULL,
    received_qty    NUMERIC(14,4)   NOT NULL DEFAULT 0,  -- Total received across all receipts
    unit_cost       NUMERIC(14,4)   NOT NULL DEFAULT 0,
    tax_rate        NUMERIC(5,4)    NOT NULL DEFAULT 0,
    line_total      NUMERIC(14,4)   NOT NULL DEFAULT 0,  -- ordered_qty * unit_cost (pre-tax)
    notes           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT poi_ordered_qty_pos  CHECK (ordered_qty  > 0),
    CONSTRAINT poi_received_lte_ord CHECK (received_qty <= ordered_qty),
    CONSTRAINT poi_unit_cost_nneg   CHECK (unit_cost    >= 0)
);

COMMENT ON TABLE  purchase_order_items              IS 'Line items for a purchase order.';
COMMENT ON COLUMN purchase_order_items.received_qty IS 'Cumulative received; supports partial deliveries.';

CREATE INDEX idx_poi_po_id          ON purchase_order_items (po_id);
CREATE INDEX idx_poi_product_id     ON purchase_order_items (product_id);

CREATE TRIGGER trg_purchase_order_items_updated_at
    BEFORE UPDATE ON purchase_order_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Goods Receipts  (one per delivery, many per PO for partial shipments)
-- ---------------------------------------------------------------------------
CREATE TABLE goods_receipts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id           UUID        NOT NULL REFERENCES purchase_orders (id) ON DELETE RESTRICT,
    receipt_number  VARCHAR(50) NOT NULL,
    received_by     UUID        REFERENCES users (id) ON DELETE SET NULL,
    receipt_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT goods_receipts_number_unique UNIQUE (receipt_number)
);

COMMENT ON TABLE goods_receipts IS 'Header for a goods receipt event (one per physical delivery).';

CREATE INDEX idx_gr_po_id       ON goods_receipts (po_id);
CREATE INDEX idx_gr_receipt_date ON goods_receipts (receipt_date);

-- ---------------------------------------------------------------------------
-- Goods Receipt Items
-- ---------------------------------------------------------------------------
CREATE TABLE goods_receipt_items (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id      UUID            NOT NULL REFERENCES goods_receipts      (id) ON DELETE CASCADE,
    poi_id          UUID            NOT NULL REFERENCES purchase_order_items (id) ON DELETE RESTRICT,
    location_id     UUID            NOT NULL REFERENCES locations            (id) ON DELETE RESTRICT,
    received_qty    NUMERIC(14,4)   NOT NULL,
    batch_number    VARCHAR(100),
    lot_number      VARCHAR(100),
    expiry_date     DATE,
    unit_cost       NUMERIC(14,4)   NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT gri_received_qty_pos CHECK (received_qty > 0)
);

COMMENT ON TABLE goods_receipt_items IS 'Line-level receipt details; drives stock movement generation.';

CREATE INDEX idx_gri_receipt_id ON goods_receipt_items (receipt_id);
CREATE INDEX idx_gri_poi_id     ON goods_receipt_items (poi_id);
CREATE INDEX idx_gri_location_id ON goods_receipt_items (location_id);
