-- =============================================================================
-- Migration 002: Helper Functions & Triggers
-- Description : Shared utility function for auto-updating `updated_at`
--               timestamps, applied to all mutable tables.
-- =============================================================================

-- Function: set_updated_at
-- Automatically sets updated_at = NOW() on any UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
