-- =============================================================================
-- Migration 011: Sales Orders & Fulfillment
-- Description : Sales order header, line items, shipments, and picking lists.
--               Backorder handling is encoded in the so_status enum.
-- =============================================================================

CREATE TABLE sales_orders (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    so_number       VARCHAR(50) NOT NULL,                   -- e.g. SO-2026-00001
    customer_id     UUID        NOT NULL REFERENCES customers  (id) ON DELETE RESTRICT,
    warehouse_id    UUID        NOT NULL REFERENCES warehouses (id) ON DELETE RESTRICT,
    status          so_status   NOT NULL DEFAULT 'draft',
    order_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
    requested_date  DATE,                                   -- Customer's requested ship/delivery date
    shipped_date    DATE,
    delivered_date  DATE,
    -- Shipping address (snapshot at order time)
    ship_to_name    VARCHAR(200),
    ship_to_line1   VARCHAR(255),
    ship_to_line2   VARCHAR(255),
    ship_to_city    VARCHAR(100),
    ship_to_state   VARCHAR(100),
    ship_to_postal  VARCHAR(20),
    ship_to_country VARCHAR(100),
    -- Financials
    subtotal        NUMERIC(14,4) NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(14,4) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(14,4) NOT NULL DEFAULT 0,
    shipping_cost   NUMERIC(14,4) NOT NULL DEFAULT 0,
    total_amount    NUMERIC(14,4) NOT NULL DEFAULT 0,
    currency        CHAR(3)     NOT NULL DEFAULT 'USD',
    -- References
    customer_po_ref VARCHAR(100),                           -- Customer's own PO number
    created_by      UUID        REFERENCES users (id) ON DELETE SET NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sales_orders_so_number_unique UNIQUE (so_number),
    CONSTRAINT sales_orders_total_nneg       CHECK  (total_amount    >= 0),
    CONSTRAINT sales_orders_discount_nneg    CHECK  (discount_amount >= 0)
);

COMMENT ON TABLE  sales_orders                  IS 'Sales order headers.';
COMMENT ON COLUMN sales_orders.customer_po_ref  IS 'Reference to customer''s own purchase order number.';

CREATE INDEX idx_so_customer_id     ON sales_orders (customer_id);
CREATE INDEX idx_so_warehouse_id    ON sales_orders (warehouse_id);
CREATE INDEX idx_so_status          ON sales_orders (status);
CREATE INDEX idx_so_order_date      ON sales_orders (order_date);

CREATE TRIGGER trg_sales_orders_updated_at
    BEFORE UPDATE ON sales_orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Sales Order Line Items
-- ---------------------------------------------------------------------------
CREATE TABLE sales_order_items (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    so_id           UUID            NOT NULL REFERENCES sales_orders     (id) ON DELETE CASCADE,
    product_id      UUID            NOT NULL REFERENCES products          (id) ON DELETE RESTRICT,
    variant_id      UUID            REFERENCES product_variants          (id) ON DELETE RESTRICT,
    description     VARCHAR(300),
    ordered_qty     NUMERIC(14,4)   NOT NULL,
    shipped_qty     NUMERIC(14,4)   NOT NULL DEFAULT 0,
    unit_price      NUMERIC(14,4)   NOT NULL DEFAULT 0,
    discount_pct    NUMERIC(5,4)    NOT NULL DEFAULT 0,    -- 0.10 = 10%
    tax_rate        NUMERIC(5,4)    NOT NULL DEFAULT 0,
    line_total      NUMERIC(14,4)   NOT NULL DEFAULT 0,
    notes           TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT soi_ordered_qty_pos  CHECK (ordered_qty  > 0),
    CONSTRAINT soi_shipped_lte_ord  CHECK (shipped_qty  <= ordered_qty),
    CONSTRAINT soi_unit_price_nneg  CHECK (unit_price   >= 0),
    CONSTRAINT soi_discount_range   CHECK (discount_pct BETWEEN 0 AND 1)
);

COMMENT ON TABLE sales_order_items IS 'Line items for a sales order.';

CREATE INDEX idx_soi_so_id          ON sales_order_items (so_id);
CREATE INDEX idx_soi_product_id     ON sales_order_items (product_id);

CREATE TRIGGER trg_sales_order_items_updated_at
    BEFORE UPDATE ON sales_order_items
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Shipments (one per dispatch event)
-- ---------------------------------------------------------------------------
CREATE TABLE shipments (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    so_id           UUID        NOT NULL REFERENCES sales_orders (id) ON DELETE RESTRICT,
    shipment_number VARCHAR(50) NOT NULL,
    carrier         VARCHAR(100),
    tracking_number VARCHAR(150),
    shipped_date    DATE,
    estimated_date  DATE,
    delivered_date  DATE,
    notes           TEXT,
    created_by      UUID        REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT shipments_number_unique UNIQUE (shipment_number)
);

CREATE INDEX idx_shipments_so_id    ON shipments (so_id);
CREATE INDEX idx_shipments_tracking ON shipments (tracking_number);

CREATE TRIGGER trg_shipments_updated_at
    BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Shipment Items
-- ---------------------------------------------------------------------------
CREATE TABLE shipment_items (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id     UUID            NOT NULL REFERENCES shipments         (id) ON DELETE CASCADE,
    soi_id          UUID            NOT NULL REFERENCES sales_order_items (id) ON DELETE RESTRICT,
    location_id     UUID            NOT NULL REFERENCES locations         (id) ON DELETE RESTRICT,
    shipped_qty     NUMERIC(14,4)   NOT NULL,
    batch_number    VARCHAR(100),
    serial_number   VARCHAR(150),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT si_shipped_qty_pos CHECK (shipped_qty > 0)
);

CREATE INDEX idx_si_shipment_id ON shipment_items (shipment_id);
CREATE INDEX idx_si_soi_id      ON shipment_items (soi_id);

-- ---------------------------------------------------------------------------
-- Returns / RMA (Return Merchandise Authorizations)
-- ---------------------------------------------------------------------------
CREATE TABLE returns (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    rma_number      VARCHAR(50) NOT NULL,
    so_id           UUID        REFERENCES sales_orders (id) ON DELETE SET NULL,
    customer_id     UUID        NOT NULL REFERENCES customers  (id) ON DELETE RESTRICT,
    status          rma_status  NOT NULL DEFAULT 'requested',
    reason          TEXT,
    received_date   DATE,
    processed_by    UUID        REFERENCES users (id) ON DELETE SET NULL,
    refund_amount   NUMERIC(14,4) NOT NULL DEFAULT 0,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT returns_rma_number_unique UNIQUE (rma_number),
    CONSTRAINT returns_refund_nneg       CHECK  (refund_amount >= 0)
);

COMMENT ON TABLE returns IS 'Return Merchandise Authorization (RMA) headers.';

CREATE INDEX idx_returns_so_id          ON returns (so_id);
CREATE INDEX idx_returns_customer_id    ON returns (customer_id);
CREATE INDEX idx_returns_status         ON returns (status);

CREATE TRIGGER trg_returns_updated_at
    BEFORE UPDATE ON returns
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Return Items
-- ---------------------------------------------------------------------------
CREATE TABLE return_items (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id       UUID            NOT NULL REFERENCES returns   (id) ON DELETE CASCADE,
    product_id      UUID            NOT NULL REFERENCES products  (id) ON DELETE RESTRICT,
    variant_id      UUID            REFERENCES product_variants   (id) ON DELETE RESTRICT,
    quantity        NUMERIC(14,4)   NOT NULL,
    restock_qty     NUMERIC(14,4)   NOT NULL DEFAULT 0, -- Qty actually put back in stock
    location_id     UUID            REFERENCES locations          (id) ON DELETE SET NULL,
    reason          TEXT,
    condition       VARCHAR(50)     NOT NULL DEFAULT 'resalable', -- resalable | damaged | disposed
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT ri_qty_pos       CHECK (quantity    > 0),
    CONSTRAINT ri_restock_lte   CHECK (restock_qty <= quantity)
);

CREATE INDEX idx_ri_return_id   ON return_items (return_id);
CREATE INDEX idx_ri_product_id  ON return_items (product_id);

-- Backfill the FK on serial_numbers that referenced sales_orders
ALTER TABLE serial_numbers
    ADD CONSTRAINT fk_serial_numbers_so_id
    FOREIGN KEY (so_id) REFERENCES sales_orders (id) ON DELETE SET NULL;
