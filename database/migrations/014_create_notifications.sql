-- =============================================================================
-- Migration 014: Notifications & Alerts
-- Description : Configurable alert rules (low stock, PO overdue, etc.) and
--               the notification outbox for email/SMS/push/in-app delivery.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Alert Rules  (configured per product / warehouse / global)
-- ---------------------------------------------------------------------------
CREATE TABLE alert_rules (
    id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200)        NOT NULL,
    event_type      VARCHAR(100)        NOT NULL,   -- low_stock | out_of_stock | po_overdue | po_approval_required | ...
    -- Scope (all NULLs = global rule)
    product_id      UUID                REFERENCES products   (id) ON DELETE CASCADE,
    category_id     UUID                REFERENCES categories (id) ON DELETE CASCADE,
    warehouse_id    UUID                REFERENCES warehouses (id) ON DELETE CASCADE,
    -- Threshold (meaning depends on event_type)
    threshold       NUMERIC(14,4),                  -- e.g. reorder point override
    -- Delivery
    channels        notification_channel[] NOT NULL DEFAULT ARRAY['in_app']::notification_channel[],
    recipient_roles user_role[]         NOT NULL DEFAULT ARRAY['manager']::user_role[],
    recipient_ids   UUID[]              DEFAULT '{}', -- Specific user overrides
    is_active       BOOLEAN             NOT NULL DEFAULT TRUE,
    created_by      UUID                REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  alert_rules             IS 'Configurable rules that trigger notifications on inventory events.';
COMMENT ON COLUMN alert_rules.event_type  IS 'Standardised event key, e.g. low_stock, po_overdue.';
COMMENT ON COLUMN alert_rules.channels    IS 'Array of delivery channels: email | sms | push | in_app.';

CREATE INDEX idx_ar_event_type      ON alert_rules (event_type);
CREATE INDEX idx_ar_product_id      ON alert_rules (product_id)   WHERE product_id   IS NOT NULL;
CREATE INDEX idx_ar_warehouse_id    ON alert_rules (warehouse_id) WHERE warehouse_id IS NOT NULL;
CREATE INDEX idx_ar_is_active       ON alert_rules (is_active);

CREATE TRIGGER trg_alert_rules_updated_at
    BEFORE UPDATE ON alert_rules
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Notifications Outbox
-- ---------------------------------------------------------------------------
CREATE TABLE notifications (
    id              UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_rule_id   UUID                    REFERENCES alert_rules (id) ON DELETE SET NULL,
    recipient_id    UUID                    REFERENCES users       (id) ON DELETE CASCADE,
    channel         notification_channel    NOT NULL,
    status          notification_status     NOT NULL DEFAULT 'pending',
    -- Content
    subject         VARCHAR(300),
    body            TEXT                    NOT NULL,
    data            JSONB                   NOT NULL DEFAULT '{}', -- Structured payload for front-end
    -- Delivery tracking
    scheduled_at    TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
    sent_at         TIMESTAMPTZ,
    read_at         TIMESTAMPTZ,
    failed_reason   TEXT,
    retry_count     SMALLINT                NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW()
    -- Append-only — no updated_at needed; status transitions captured by sent_at / read_at
);

COMMENT ON TABLE  notifications         IS 'Outbound notification queue. One row per recipient per channel.';
COMMENT ON COLUMN notifications.data    IS 'Machine-readable payload for rendering rich in-app notifications.';

CREATE INDEX idx_notif_recipient_id     ON notifications (recipient_id);
CREATE INDEX idx_notif_status           ON notifications (status);
CREATE INDEX idx_notif_channel          ON notifications (channel);
CREATE INDEX idx_notif_scheduled_at     ON notifications (scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_notif_alert_rule_id    ON notifications (alert_rule_id) WHERE alert_rule_id IS NOT NULL;
