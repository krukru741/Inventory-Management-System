-- =============================================================================
-- Migration 016: Seed Data
-- Description : Minimal reference/bootstrap data needed to start the system.
--               Safe to run in development and staging. DO NOT run in
--               production without review — IDs are hardcoded for FK stability.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Default admin user  (password: ChangeMe123! — must be changed on first login)
-- pgcrypto crypt() generates a real bcrypt hash at migration runtime.
-- Requires: CREATE EXTENSION pgcrypto  (done by run_migrations.sh)
-- ---------------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'System Administrator',
    'admin@inventory.local',
    crypt('ChangeMe123!', gen_salt('bf', 12)),   -- real bcrypt hash, cost=12
    'admin'
)
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Root categories
-- ---------------------------------------------------------------------------
INSERT INTO categories (id, name, slug, parent_id, sort_order) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Electronics',    'electronics',    NULL, 1),
    ('10000000-0000-0000-0000-000000000002', 'Apparel',        'apparel',        NULL, 2),
    ('10000000-0000-0000-0000-000000000003', 'Food & Beverage','food-beverage',  NULL, 3),
    ('10000000-0000-0000-0000-000000000004', 'Office Supplies','office-supplies', NULL, 4),
    ('10000000-0000-0000-0000-000000000005', 'Raw Materials',  'raw-materials',  NULL, 5)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Default warehouse
-- ---------------------------------------------------------------------------
INSERT INTO warehouses (id, name, code, address_line1, city, country, manager_id) VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        'Main Warehouse',
        'WH01',
        '100 Warehouse Lane',
        'Metro City',
        'US',
        '00000000-0000-0000-0000-000000000001'
    )
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Default locations inside WH01
-- ---------------------------------------------------------------------------
INSERT INTO locations (id, warehouse_id, parent_id, code, name, location_type) VALUES
    -- Zone level
    ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', NULL,
     'WH01-A', 'Zone A', 'zone'),
    ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', NULL,
     'WH01-B', 'Zone B', 'zone'),
    -- Bins inside Zone A
    ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001', 'WH01-A-01', 'Zone A / Bin 01', 'bin'),
    ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001', 'WH01-A-02', 'Zone A / Bin 02', 'bin'),
    -- Bins inside Zone B
    ('30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000002', 'WH01-B-01', 'Zone B / Bin 01', 'bin')
ON CONFLICT (warehouse_id, code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Default alert rules
-- ---------------------------------------------------------------------------
INSERT INTO alert_rules (name, event_type, channels, recipient_roles) VALUES
    ('Global Low Stock Alert',   'low_stock',              ARRAY['in_app','email']::notification_channel[], ARRAY['admin','manager']::user_role[]),
    ('Out of Stock Alert',       'out_of_stock',           ARRAY['in_app','email','sms']::notification_channel[], ARRAY['admin','manager']::user_role[]),
    ('PO Approval Required',     'po_approval_required',   ARRAY['in_app','email']::notification_channel[], ARRAY['admin','manager']::user_role[]),
    ('PO Overdue',               'po_overdue',             ARRAY['in_app','email']::notification_channel[], ARRAY['admin','manager']::user_role[]),
    ('Expiry Warning (30 days)', 'expiry_approaching',     ARRAY['in_app']::notification_channel[],         ARRAY['manager','staff']::user_role[])
ON CONFLICT DO NOTHING;
