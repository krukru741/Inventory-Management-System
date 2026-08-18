-- =============================================================================
-- Migration 001: Create ENUM Types
-- Description : Defines all domain-specific enumeration types used across
--               the inventory management system schema.
-- =============================================================================

-- User roles
CREATE TYPE user_role AS ENUM (
    'admin',
    'manager',
    'staff',
    'viewer'
);

-- Purchase order lifecycle
CREATE TYPE po_status AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'ordered',
    'partially_received',
    'received',
    'cancelled'
);

-- Sales order lifecycle
CREATE TYPE so_status AS ENUM (
    'draft',
    'confirmed',
    'picking',
    'partially_shipped',
    'shipped',
    'delivered',
    'cancelled',
    'backordered'
);

-- Stock movement direction / reason
CREATE TYPE movement_type AS ENUM (
    'receipt',          -- Goods received from supplier (PO)
    'sale',             -- Stock reduced by a sales order shipment
    'transfer_out',     -- Stock leaving a location in a transfer
    'transfer_in',      -- Stock arriving at a location in a transfer
    'adjustment_in',    -- Manual positive adjustment (cycle count, correction)
    'adjustment_out',   -- Manual negative adjustment
    'return_in',        -- Customer return restocked
    'return_out',       -- Return to supplier
    'assembly_in',      -- Finished goods from a kit/assembly
    'assembly_out'      -- Components consumed by a kit/assembly
);

-- Stock transfer status
CREATE TYPE transfer_status AS ENUM (
    'draft',
    'in_transit',
    'completed',
    'cancelled'
);

-- Return merchandise authorization status
CREATE TYPE rma_status AS ENUM (
    'requested',
    'approved',
    'received',
    'restocked',
    'refunded',
    'rejected'
);

-- Notification channel
CREATE TYPE notification_channel AS ENUM (
    'email',
    'sms',
    'push',
    'in_app'
);

-- Notification status
CREATE TYPE notification_status AS ENUM (
    'pending',
    'sent',
    'failed',
    'read'
);

-- Stock valuation method per product
CREATE TYPE valuation_method AS ENUM (
    'fifo',
    'lifo',
    'weighted_average'
);
