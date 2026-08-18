-- =============================================================================
-- Migration 006: Products
-- Description : Product master catalog with SKUs, variants, pricing, barcode,
--               reorder thresholds, and valuation method.
-- =============================================================================

CREATE TABLE products (
    id                  UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    sku                 VARCHAR(100)        NOT NULL,
    name                VARCHAR(300)        NOT NULL,
    description         TEXT,
    category_id         UUID                REFERENCES categories (id) ON DELETE SET NULL,
    unit_of_measure     VARCHAR(30)         NOT NULL DEFAULT 'each',   -- each, kg, L, m, box …
    barcode             VARCHAR(100),                                   -- EAN-13, UPC-A, QR, etc.
    barcode_type        VARCHAR(20),                                    -- EAN13 | UPC | QR | CODE128
    -- Pricing
    cost_price          NUMERIC(14,4)       NOT NULL DEFAULT 0,
    sell_price          NUMERIC(14,4)       NOT NULL DEFAULT 0,
    tax_rate            NUMERIC(5,4)        NOT NULL DEFAULT 0,         -- e.g. 0.0800 = 8 %
    currency            CHAR(3)             NOT NULL DEFAULT 'USD',
    -- Stock thresholds
    reorder_point       NUMERIC(14,4)       NOT NULL DEFAULT 0,         -- alert when stock ≤ this
    reorder_quantity    NUMERIC(14,4)       NOT NULL DEFAULT 0,         -- suggested PO qty
    min_stock_level     NUMERIC(14,4)       NOT NULL DEFAULT 0,
    max_stock_level     NUMERIC(14,4),
    -- Valuation
    valuation_method    valuation_method    NOT NULL DEFAULT 'weighted_average',
    -- Physical attributes (for shipping)
    weight_kg           NUMERIC(10,4),
    length_cm           NUMERIC(10,4),
    width_cm            NUMERIC(10,4),
    height_cm           NUMERIC(10,4),
    -- Tracking flags
    track_serial        BOOLEAN             NOT NULL DEFAULT FALSE,     -- serial-number-level tracking
    track_batch         BOOLEAN             NOT NULL DEFAULT FALSE,     -- batch / lot tracking
    track_expiry        BOOLEAN             NOT NULL DEFAULT FALSE,     -- expiry date tracking
    has_variants        BOOLEAN             NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE,
    -- Metadata
    notes               TEXT,
    created_by          UUID                REFERENCES users (id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),

    CONSTRAINT products_sku_unique      UNIQUE (sku),
    CONSTRAINT products_barcode_unique  UNIQUE (barcode),
    CONSTRAINT products_cost_price_nneg CHECK  (cost_price  >= 0),
    CONSTRAINT products_sell_price_nneg CHECK  (sell_price  >= 0),
    CONSTRAINT products_tax_rate_range  CHECK  (tax_rate BETWEEN 0 AND 1)
);

COMMENT ON TABLE  products                  IS 'Product master catalog.';
COMMENT ON COLUMN products.sku              IS 'Stock-keeping unit — unique business identifier.';
COMMENT ON COLUMN products.reorder_point    IS 'Alert threshold: when on-hand stock falls to or below this value.';
COMMENT ON COLUMN products.track_serial     IS 'If TRUE, every unit carries a unique serial number.';
COMMENT ON COLUMN products.valuation_method IS 'FIFO / LIFO / Weighted Average for cost-of-goods calculations.';

-- Performance indexes
CREATE INDEX idx_products_sku           ON products (sku);
CREATE INDEX idx_products_barcode       ON products (barcode);
CREATE INDEX idx_products_category_id   ON products (category_id);
CREATE INDEX idx_products_is_active     ON products (is_active);
CREATE INDEX idx_products_name_trgm     ON products USING gin (name gin_trgm_ops); -- fuzzy search (requires pg_trgm)

-- Auto-update trigger
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Product Images
-- ---------------------------------------------------------------------------
CREATE TABLE product_images (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID        NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    url         TEXT        NOT NULL,
    alt_text    VARCHAR(255),
    sort_order  INTEGER     NOT NULL DEFAULT 0,
    is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE product_images IS 'Product image gallery; is_primary=TRUE is the thumbnail.';

CREATE INDEX idx_product_images_product_id  ON product_images (product_id);
CREATE INDEX idx_product_images_is_primary  ON product_images (product_id, is_primary);

-- ---------------------------------------------------------------------------
-- Product Variants (size, color, material, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE product_variants (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID            NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    sku             VARCHAR(100)    NOT NULL,
    barcode         VARCHAR(100),
    attributes      JSONB           NOT NULL DEFAULT '{}', -- {"color":"red","size":"L"}
    cost_price      NUMERIC(14,4),                         -- overrides parent if set
    sell_price      NUMERIC(14,4),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT product_variants_sku_unique UNIQUE (sku)
);

COMMENT ON TABLE  product_variants            IS 'Variant SKUs for products with multiple options (color, size …).';
COMMENT ON COLUMN product_variants.attributes IS 'Arbitrary key-value pairs stored as JSONB.';

CREATE INDEX idx_product_variants_product_id ON product_variants (product_id);
CREATE INDEX idx_product_variants_sku        ON product_variants (sku);
CREATE INDEX idx_product_variants_attributes ON product_variants USING gin (attributes);

CREATE TRIGGER trg_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Product–Supplier Links (which suppliers stock each product)
-- ---------------------------------------------------------------------------
CREATE TABLE product_suppliers (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID            NOT NULL REFERENCES products  (id) ON DELETE CASCADE,
    supplier_id         UUID            NOT NULL REFERENCES suppliers (id) ON DELETE CASCADE,
    supplier_sku        VARCHAR(100),   -- Supplier's own part number
    unit_cost           NUMERIC(14,4)   NOT NULL DEFAULT 0,
    min_order_qty       NUMERIC(14,4)   NOT NULL DEFAULT 1,
    lead_time_days      INTEGER         NOT NULL DEFAULT 0,
    is_preferred        BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT product_suppliers_unique UNIQUE (product_id, supplier_id)
);

COMMENT ON TABLE product_suppliers IS 'Links products to their suppliers with pricing and lead-time overrides.';

CREATE INDEX idx_product_suppliers_product_id  ON product_suppliers (product_id);
CREATE INDEX idx_product_suppliers_supplier_id ON product_suppliers (supplier_id);

CREATE TRIGGER trg_product_suppliers_updated_at
    BEFORE UPDATE ON product_suppliers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
