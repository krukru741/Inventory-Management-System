-- =============================================================================
-- Migration 013: Audit Logs
-- Description : Immutable audit trail recording every data mutation performed
--               by any user. Written by application-layer logic (or optionally
--               by triggers) — never deleted or modified.
-- =============================================================================

CREATE TABLE audit_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES users (id) ON DELETE SET NULL,
    action      VARCHAR(50) NOT NULL,  -- CREATE | UPDATE | DELETE | LOGIN | LOGOUT | APPROVE | ...
    entity      VARCHAR(100) NOT NULL, -- Table / resource name, e.g. 'products', 'purchase_orders'
    entity_id   UUID,                  -- PK of the affected record
    -- Snapshot of changes
    old_data    JSONB,                 -- Row state before change (NULL for CREATE)
    new_data    JSONB,                 -- Row state after change  (NULL for DELETE)
    -- Request context
    ip_address  INET,
    user_agent  TEXT,
    request_id  VARCHAR(100),          -- Correlation ID from HTTP request headers
    notes       TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- No updated_at — this table is append-only
);

COMMENT ON TABLE  audit_logs            IS 'Immutable audit trail. Never update or delete rows.';
COMMENT ON COLUMN audit_logs.action     IS 'Verb describing the operation. Standardise across the app.';
COMMENT ON COLUMN audit_logs.old_data   IS 'Full row JSONB before the change (NULL for INSERT).';
COMMENT ON COLUMN audit_logs.new_data   IS 'Full row JSONB after the change (NULL for DELETE).';
COMMENT ON COLUMN audit_logs.entity     IS 'Name of the database table/resource being mutated.';

-- Indexes for common audit query patterns
CREATE INDEX idx_al_user_id     ON audit_logs (user_id);
CREATE INDEX idx_al_entity      ON audit_logs (entity, entity_id);
CREATE INDEX idx_al_occurred_at ON audit_logs (occurred_at DESC);
CREATE INDEX idx_al_action      ON audit_logs (action);
-- JSONB indexes for data-level queries
CREATE INDEX idx_al_new_data    ON audit_logs USING gin (new_data  jsonb_path_ops);
CREATE INDEX idx_al_old_data    ON audit_logs USING gin (old_data  jsonb_path_ops);
