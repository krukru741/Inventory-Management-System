-- =============================================================================
-- Migration 017: Fix Schema Gaps (post-review patches)
-- Description : Addresses four issues identified in the initial schema review:
--
--   1. inventory_unique_layer is broken for non-batched products
--      PostgreSQL treats NULL != NULL in UNIQUE constraints, so two rows with
--      the same product+location and no batch would NOT conflict.
--      Fix: replace the table constraint with two partial unique indexes.
--
--   2. movement_type enum is missing cycle_count_adjustment.
--      Count discrepancies posted via cycle counts need a distinct movement
--      type so they are distinguishable from ad-hoc adjustments in the ledger.
--
--   3. cycle_count_items has no FK back to the stock_movements row it generated.
--      The adjustment_posted flag tells you *whether* a movement was created but
--      not *which* one. Add stock_movement_id to close the traceability gap.
--
--   4. No trigger enforcing inventory cache consistency.
--      Application code is the only guard preventing inventory.quantity from
--      diverging from the stock_movements ledger. Add a AFTER INSERT trigger
--      on stock_movements as a safety net that upserts inventory automatically.
-- =============================================================================

-- =============================================================================
-- FIX 1: Repair inventory_unique_layer for NULL batch values
-- =============================================================================

-- Drop the broken constraint (NULLs are distinct; it never blocked duplicates
-- for non-batched products).
ALTER TABLE inventory
    DROP CONSTRAINT inventory_unique_layer;

-- Partial index A: products with NO batch tracking (the common case).
-- Enforces one row per product + variant + location when both batch and lot are NULL.
CREATE UNIQUE INDEX inventory_unique_no_batch
    ON inventory (product_id, variant_id, location_id)
    WHERE batch_number IS NULL AND lot_number IS NULL;

-- Partial index B: products WITH batch or lot tracking.
-- Enforces one row per unique batch layer within a location.
CREATE UNIQUE INDEX inventory_unique_with_batch
    ON inventory (product_id, variant_id, location_id, batch_number, lot_number)
    WHERE batch_number IS NOT NULL OR lot_number IS NOT NULL;

COMMENT ON INDEX inventory_unique_no_batch  IS 'Prevents duplicate non-batched inventory rows per product+variant+location.';
COMMENT ON INDEX inventory_unique_with_batch IS 'Prevents duplicate batched inventory layers per product+variant+location+batch.';

-- =============================================================================
-- FIX 2: Add cycle_count_adjustment to the movement_type enum
-- =============================================================================

-- ADD VALUE is transactional in PG 12+ but cannot be rolled back mid-transaction
-- in older versions; safe to run standalone.
ALTER TYPE movement_type ADD VALUE IF NOT EXISTS 'cycle_count_adjustment'
    AFTER 'assembly_out';

COMMENT ON TYPE movement_type IS
    'Direction of a stock movement. All quantities are stored as positive values.
     Positive-direction types : receipt, transfer_in, adjustment_in, return_in,
                                 assembly_in, cycle_count_adjustment (when counted > system).
     Negative-direction types : sale, transfer_out, adjustment_out, return_out,
                                 assembly_out, cycle_count_adjustment (when counted < system).
     For cycle_count_adjustment the signed direction is derived from
     cycle_count_items.discrepancy (counted_qty - system_qty).';

-- =============================================================================
-- FIX 3: Add stock_movement_id to cycle_count_items
-- =============================================================================

ALTER TABLE cycle_count_items
    ADD COLUMN IF NOT EXISTS stock_movement_id UUID
        REFERENCES stock_movements (id) ON DELETE SET NULL;

COMMENT ON COLUMN cycle_count_items.stock_movement_id IS
    'FK to the stock_movements row that posted the discrepancy adjustment.
     NULL until adjustment_posted = TRUE. Enables full traceability from
     a count line to its resulting ledger entry.';

-- Index so we can efficiently look up "which count item generated movement X"
CREATE INDEX IF NOT EXISTS idx_cci_stock_movement_id
    ON cycle_count_items (stock_movement_id)
    WHERE stock_movement_id IS NOT NULL;

-- =============================================================================
-- FIX 4: Inventory sync safety-net trigger
-- =============================================================================
-- This trigger fires AFTER every INSERT on stock_movements and upserts the
-- matching inventory row so that inventory.quantity always equals balance_after
-- from the most recent movement for that product+location+batch layer.
--
-- Design notes:
--  • Uses balance_after as the authoritative post-movement quantity, so the
--    trigger is idempotent: replaying the same movement row produces the same
--    inventory state.
--  • unit_cost is only updated on inbound movements (receipt, transfer_in,
--    adjustment_in, return_in, assembly_in, cycle_count_adjustment) to avoid
--    overwriting cost layers on outbound movements.
--  • NULL-safe matching on batch_number, lot_number, and variant_id so the
--    query works for both batched and non-batched inventory rows (FIX 1).
--  • The trigger is a safety net — application code should still update
--    inventory in the same transaction. The trigger protects against bugs
--    or future code paths that forget to do so.
-- =============================================================================

CREATE OR REPLACE FUNCTION sync_inventory_on_movement()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
DECLARE
    v_existing_id   UUID;
    v_is_inbound    BOOLEAN;
BEGIN
    -- Determine whether this movement type adds stock (TRUE) or removes it (FALSE).
    -- cycle_count_adjustment direction is determined by the sign of discrepancy on
    -- the cycle_count_items row, but since balance_after is already the correct
    -- final value we do not need to branch on it here.
    v_is_inbound := NEW.movement_type IN (
        'receipt',
        'transfer_in',
        'adjustment_in',
        'return_in',
        'assembly_in',
        'cycle_count_adjustment'
    );

    -- NULL-safe lookup of the matching inventory layer.
    SELECT id INTO v_existing_id
    FROM   inventory
    WHERE  product_id   = NEW.product_id
      AND  location_id  = NEW.location_id
      AND  (variant_id      IS NOT DISTINCT FROM NEW.variant_id)
      AND  (batch_number    IS NOT DISTINCT FROM NEW.batch_number)
      AND  (lot_number      IS NOT DISTINCT FROM NEW.lot_number);

    IF v_existing_id IS NOT NULL THEN
        -- Row exists: update quantity (and cost if inbound).
        UPDATE inventory SET
            quantity   = NEW.balance_after,
            unit_cost  = CASE
                             WHEN v_is_inbound AND NEW.unit_cost > 0 THEN NEW.unit_cost
                             ELSE unit_cost   -- preserve existing cost on outbound movements
                         END,
            updated_at = NOW()
        WHERE id = v_existing_id;
    ELSE
        -- First movement for this product+location+batch: create the inventory row.
        INSERT INTO inventory (
            product_id,
            variant_id,
            location_id,
            batch_number,
            lot_number,
            expiry_date,
            quantity,
            unit_cost
        ) VALUES (
            NEW.product_id,
            NEW.variant_id,
            NEW.location_id,
            NEW.batch_number,
            NEW.lot_number,
            NEW.expiry_date,
            NEW.balance_after,
            NEW.unit_cost
        );
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION sync_inventory_on_movement() IS
    'Safety-net trigger: keeps inventory.quantity in sync with stock_movements.balance_after.
     Fires AFTER INSERT on stock_movements. Application code should still update inventory
     in the same transaction; this trigger guards against omissions.';

-- Attach the trigger to stock_movements (append-only, so INSERT only).
CREATE TRIGGER trg_sync_inventory_on_movement
    AFTER INSERT ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION sync_inventory_on_movement();
