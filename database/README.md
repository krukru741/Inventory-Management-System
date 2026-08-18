# Database — Schema Migrations

PostgreSQL migration suite for the Inventory Management System.
All migrations must be applied **in numeric order** and in a **single transaction per file**.

## Requirements

| Requirement | Version |
|---|---|
| PostgreSQL | ≥ 14 |
| Extensions | `pg_trgm`, `pgcrypto` (auto-enabled by the runner) |

## File Map

| File | Purpose |
|---|---|
| [`001_create_enums.sql`](migrations/001_create_enums.sql) | All `ENUM` types (roles, statuses, movement types, …) |
| [`002_create_helper_functions.sql`](migrations/002_create_helper_functions.sql) | `set_updated_at()` trigger function |
| [`003_create_users.sql`](migrations/003_create_users.sql) | Users & RBAC |
| [`004_create_categories.sql`](migrations/004_create_categories.sql) | Hierarchical product categories |
| [`005_create_suppliers.sql`](migrations/005_create_suppliers.sql) | Supplier/vendor master |
| [`006_create_products.sql`](migrations/006_create_products.sql) | Products, images, variants, product–supplier links |
| [`007_create_warehouses_locations.sql`](migrations/007_create_warehouses_locations.sql) | Warehouses & bin-level locations |
| [`008_create_inventory.sql`](migrations/008_create_inventory.sql) | Cached stock levels, serial numbers |
| [`009_create_customers.sql`](migrations/009_create_customers.sql) | Customer master |
| [`010_create_purchase_orders.sql`](migrations/010_create_purchase_orders.sql) | POs, PO items, goods receipts |
| [`011_create_sales_orders.sql`](migrations/011_create_sales_orders.sql) | SOs, SO items, shipments, RMA/returns |
| [`012_create_stock_movements.sql`](migrations/012_create_stock_movements.sql) | **Ledger** (source of truth), transfers, cycle counts |
| [`013_create_audit_logs.sql`](migrations/013_create_audit_logs.sql) | Immutable audit trail |
| [`014_create_notifications.sql`](migrations/014_create_notifications.sql) | Alert rules & notification outbox |
| [`015_create_views.sql`](migrations/015_create_views.sql) | Read-only helper views |
| [`016_seed_data.sql`](migrations/016_seed_data.sql) | Bootstrap seed (dev/staging only) |

## Running Migrations

### Using the shell script (Linux / macOS / WSL)

```bash
# Set credentials
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=inventory_db
export DB_USER=postgres
export DB_PASSWORD=yourpassword

chmod +x database/run_migrations.sh
./database/run_migrations.sh
```

### Using psql manually (Windows / any OS)

```powershell
# Run each file in order
Get-ChildItem database\migrations\*.sql | Sort-Object Name | ForEach-Object {
    Write-Host "Applying $($_.Name)..."
    psql -h localhost -U postgres -d inventory_db -f $_.FullName
}
```

### Using a migration tool (recommended for production)

Tools like **Flyway**, **Liquibase**, or **golang-migrate** can manage migration state. Rename files to match the tool's convention:
- **Flyway**: `V001__create_enums.sql`
- **golang-migrate**: `000001_create_enums.up.sql`

## Key Design Decisions

> [!IMPORTANT]
> **Ledger-based stock tracking**: The `stock_movements` table is the **authoritative source of truth**. The `inventory` table is a **performance cache** only. Every stock change must insert a `stock_movements` row AND update `inventory.quantity` in the **same database transaction**.

> [!NOTE]
> **Idempotency keys** on `stock_movements` allow the application layer to safely retry API calls without double-counting stock.

> [!NOTE]
> **Audit logs** and `stock_movements` are **append-only** — never `UPDATE` or `DELETE` rows from these tables.

> [!TIP]
> The `v_stock_summary`, `v_low_stock_alerts`, and `v_open_purchase_orders` views cover the most common dashboard queries without writing raw SQL in application code.

## Entity Relationship Overview

```
categories (tree)
    └── products ──────────── product_variants
                │              product_images
                │              product_suppliers ── suppliers
                │
                ├── inventory (cached stock per location)
                │       └── serial_numbers
                │
                ├── purchase_order_items ── purchase_orders ── goods_receipts
                │                                   └── goods_receipt_items
                │
                ├── sales_order_items ──── sales_orders ── shipments
                │                                └── returns ── return_items
                │
                └── stock_movements (ledger — links to PO, SO, return, transfer)
                        └── stock_transfers ── stock_transfer_items
                                cycle_counts ── cycle_count_items

users ── audit_logs
      ── notifications ── alert_rules
```
