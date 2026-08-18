-- =============================================================================
-- Migration 004: Categories
-- Description : Self-referencing hierarchical category tree for products.
--               Supports unlimited nesting depth via parent_id.
-- =============================================================================

CREATE TABLE categories (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150)    NOT NULL,
    slug        VARCHAR(160)    NOT NULL,
    parent_id   UUID            REFERENCES categories (id) ON DELETE SET NULL,
    description TEXT,
    sort_order  INTEGER         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT categories_slug_unique UNIQUE (slug)
);

COMMENT ON TABLE  categories            IS 'Hierarchical product categories (self-referencing tree).';
COMMENT ON COLUMN categories.parent_id  IS 'NULL for top-level categories.';
COMMENT ON COLUMN categories.slug       IS 'URL-safe identifier, unique across all categories.';

-- Indexes
CREATE INDEX idx_categories_parent_id   ON categories (parent_id);
CREATE INDEX idx_categories_slug        ON categories (slug);
CREATE INDEX idx_categories_sort_order  ON categories (sort_order);

-- Auto-update trigger
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
