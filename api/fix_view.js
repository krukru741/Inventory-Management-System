const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://postgres:205412@127.0.0.1:5432/inventory_db?schema=public' });

async function main() {
  await pool.query(`
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
        COALESCE(SUM(i.quantity) - SUM(i.reserved_qty), 0)      AS available_qty,
        COALESCE(SUM(i.quantity * COALESCE(NULLIF(i.unit_cost, 0), p.cost_price, 0)), 0) AS stock_value
    FROM products p
    LEFT JOIN categories        c ON c.id = p.category_id
    LEFT JOIN inventory         i ON i.product_id = p.id
    LEFT JOIN locations         l ON l.id = i.location_id
    LEFT JOIN warehouses        w ON w.id = l.warehouse_id
    WHERE p.is_active = TRUE
    GROUP BY p.id, p.sku, p.name, p.reorder_point,
             c.name, w.id, w.name, l.id, l.code;
  `);
  console.log("View updated!");
  process.exit(0);
}
main();
