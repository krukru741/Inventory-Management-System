-- =============================================================================
-- Migration 015: Useful Views
-- Description : Pre-built views for the most common application queries.
--               These are read-only; no data is stored here.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- v_stock_summary
-- On-hand, reserved, and available stock per product per location.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_stock_summary AS
SELECT
    p.id                                                    AS product_id,
    p.sku,
    p.name                                                  AS product_name,
    p.reorder_point,
    c.name                                                  AS category_name,
    w.id                                                    AS warehouse_id,
    w.name                                                  AS warehouse_name,
    l.id                                                    AS location_id,
    l.code                                                  AS location_code,
    COALESCE(SUM(i.quantity),      0)                       AS on_hand_qty,
    COALESCE(SUM(i.reserved_qty),  0)                       AS reserved_qty,
    COALESCE(SUM(i.quantity) - SUM(i.reserved_qty), 0)     AS available_qty,
    COALESCE(SUM(i.quantity * i.unit_cost), 0)              AS stock_value
FROM products p
LEFT JOIN categories        c ON c.id = p.category_id
LEFT JOIN inventory         i ON i.product_id = p.id
LEFT JOIN locations         l ON l.id = i.location_id
LEFT JOIN warehouses        w ON w.id = l.warehouse_id
WHERE p.is_active = TRUE
GROUP BY p.id, p.sku, p.name, p.reorder_point,
         c.name, w.id, w.name, l.id, l.code;

COMMENT ON VIEW v_stock_summary IS 'Aggregated on-hand, reserved, and available stock per product per location.';

-- ---------------------------------------------------------------------------
-- v_low_stock_alerts
-- Products at or below their reorder point (per location).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_low_stock_alerts AS
SELECT
    s.*,
    CASE
        WHEN s.on_hand_qty = 0 THEN 'out_of_stock'
        ELSE 'low_stock'
    END AS alert_level
FROM v_stock_summary s
WHERE s.on_hand_qty <= s.reorder_point;

COMMENT ON VIEW v_low_stock_alerts IS 'Products at or below reorder point, flagged as low_stock or out_of_stock.';

-- ---------------------------------------------------------------------------
-- v_open_purchase_orders
-- All non-cancelled, non-fully-received POs with receipt progress.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_open_purchase_orders AS
SELECT
    po.id,
    po.po_number,
    s.name                                              AS supplier_name,
    w.name                                              AS warehouse_name,
    po.status,
    po.order_date,
    po.expected_date,
    po.total_amount,
    po.currency,
    COUNT(poi.id)                                       AS line_count,
    SUM(poi.ordered_qty)                                AS total_ordered_qty,
    SUM(poi.received_qty)                               AS total_received_qty,
    ROUND(
        100.0 * SUM(poi.received_qty) / NULLIF(SUM(poi.ordered_qty), 0),
        2
    )                                                   AS receipt_pct
FROM purchase_orders    po
JOIN suppliers          s   ON s.id = po.supplier_id
JOIN warehouses         w   ON w.id = po.warehouse_id
JOIN purchase_order_items poi ON poi.po_id = po.id
WHERE po.status NOT IN ('received', 'cancelled')
GROUP BY po.id, po.po_number, s.name, w.name,
         po.status, po.order_date, po.expected_date,
         po.total_amount, po.currency;

COMMENT ON VIEW v_open_purchase_orders IS 'Open purchase orders with receipt percentage progress.';

-- ---------------------------------------------------------------------------
-- v_open_sales_orders
-- Active sales orders with shipment progress.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_open_sales_orders AS
SELECT
    so.id,
    so.so_number,
    cu.name                                             AS customer_name,
    w.name                                              AS warehouse_name,
    so.status,
    so.order_date,
    so.requested_date,
    so.total_amount,
    so.currency,
    COUNT(soi.id)                                       AS line_count,
    SUM(soi.ordered_qty)                                AS total_ordered_qty,
    SUM(soi.shipped_qty)                                AS total_shipped_qty,
    ROUND(
        100.0 * SUM(soi.shipped_qty) / NULLIF(SUM(soi.ordered_qty), 0),
        2
    )                                                   AS shipment_pct
FROM sales_orders       so
JOIN customers          cu  ON cu.id = so.customer_id
JOIN warehouses         w   ON w.id  = so.warehouse_id
JOIN sales_order_items  soi ON soi.so_id = so.id
WHERE so.status NOT IN ('delivered', 'cancelled')
GROUP BY so.id, so.so_number, cu.name, w.name,
         so.status, so.order_date, so.requested_date,
         so.total_amount, so.currency;

COMMENT ON VIEW v_open_sales_orders IS 'Active sales orders with percentage of units shipped.';

-- ---------------------------------------------------------------------------
-- v_stock_movement_history
-- Human-readable ledger view joining movements to product/location/user.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_stock_movement_history AS
SELECT
    sm.id,
    sm.performed_at,
    p.sku,
    p.name                  AS product_name,
    w.name                  AS warehouse_name,
    l.code                  AS location_code,
    sm.movement_type,
    sm.quantity,
    sm.balance_after,
    sm.unit_cost,
    sm.batch_number,
    sm.serial_number,
    sm.reason,
    u.name                  AS performed_by,
    sm.po_id,
    sm.so_id,
    sm.return_id,
    sm.transfer_id
FROM stock_movements    sm
JOIN products           p ON p.id = sm.product_id
JOIN locations          l ON l.id = sm.location_id
JOIN warehouses         w ON w.id = l.warehouse_id
LEFT JOIN users         u ON u.id = sm.performed_by;

COMMENT ON VIEW v_stock_movement_history IS 'Readable stock movement ledger with product/location/user names resolved.';
