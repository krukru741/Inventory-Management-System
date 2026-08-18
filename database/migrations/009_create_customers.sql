-- =============================================================================
-- Migration 009: Customers
-- Description : Customer master data for sales order management and CRM.
-- =============================================================================

CREATE TABLE customers (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200)    NOT NULL,
    code            VARCHAR(30)     NOT NULL,
    contact_person  VARCHAR(150),
    email           VARCHAR(255),
    phone           VARCHAR(30),
    address_line1   VARCHAR(255),
    address_line2   VARCHAR(255),
    city            VARCHAR(100),
    state           VARCHAR(100),
    postal_code     VARCHAR(20),
    country         VARCHAR(100),
    credit_limit    NUMERIC(14,4)   NOT NULL DEFAULT 0,
    payment_terms   INTEGER         NOT NULL DEFAULT 30, -- Net days
    currency        CHAR(3)         NOT NULL DEFAULT 'USD',
    notes           TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT customers_code_unique UNIQUE (code)
);

COMMENT ON TABLE customers IS 'Customer master data for sales orders and invoicing.';

CREATE INDEX idx_customers_code         ON customers (code);
CREATE INDEX idx_customers_email        ON customers (email);
CREATE INDEX idx_customers_is_active    ON customers (is_active);

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
