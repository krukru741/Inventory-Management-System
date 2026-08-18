-- =============================================================================
-- Migration 005: Suppliers
-- Description : Vendor/supplier master data including contacts, payment terms,
--               and lead time for procurement planning.
-- =============================================================================

CREATE TABLE suppliers (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(200)    NOT NULL,
    code                VARCHAR(30)     NOT NULL,           -- Internal supplier code
    contact_person      VARCHAR(150),
    email               VARCHAR(255),
    phone               VARCHAR(30),
    website             TEXT,
    address_line1       VARCHAR(255),
    address_line2       VARCHAR(255),
    city                VARCHAR(100),
    state               VARCHAR(100),
    postal_code         VARCHAR(20),
    country             VARCHAR(100),
    -- Procurement defaults
    lead_time_days      INTEGER         NOT NULL DEFAULT 0, -- Average delivery lead time
    payment_terms_days  INTEGER         NOT NULL DEFAULT 30,-- Net payment days
    currency            CHAR(3)         NOT NULL DEFAULT 'USD',
    min_order_value     NUMERIC(14,4)   NOT NULL DEFAULT 0,
    notes               TEXT,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT suppliers_code_unique UNIQUE (code)
);

COMMENT ON TABLE  suppliers                 IS 'Supplier/vendor master data.';
COMMENT ON COLUMN suppliers.lead_time_days  IS 'Expected days from PO to delivery.';
COMMENT ON COLUMN suppliers.currency        IS 'ISO-4217 3-letter currency code.';

-- Indexes
CREATE INDEX idx_suppliers_code         ON suppliers (code);
CREATE INDEX idx_suppliers_is_active    ON suppliers (is_active);
CREATE INDEX idx_suppliers_country      ON suppliers (country);

-- Auto-update trigger
CREATE TRIGGER trg_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
