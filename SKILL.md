---
name: inventory-system-builder
description: Use this skill when designing, planning, or building an inventory management system — covering product/stock tracking, purchasing, sales fulfillment, warehouse management, reporting, and integrations. Trigger on requests like "build an inventory system," "design a stock management app," "inventory database schema," or "warehouse tracking features."
---

# Inventory Management System — Build Guide

## Purpose
Provides a complete reference plan for scoping, designing, and building an inventory
management system, from requirements gathering through phased development.

## 1. Define Scope & Requirements
Before writing code, clarify:
- **Users**: retail, warehouse, manufacturing, e-commerce, or multi-branch
- **Scale**: single location vs. multi-warehouse; hundreds vs. millions of SKUs
- **Integrations**: POS, e-commerce, accounting, shipping carriers
- **Deployment**: web, desktop, mobile, or all three

## 2. Core Features

### Product/Item Management
- CRUD for products (SKU, name, description, category, unit of measure)
- Barcode/QR generation and scanning
- Product variants (size, color, etc.)
- Multiple images per product
- Bulk import/export (CSV/Excel)

### Stock Tracking
- Real-time stock levels per location/warehouse
- Stock in/out transaction logging
- Low-stock / out-of-stock alerts with configurable thresholds
- Reorder point automation
- Batch/lot and expiry date tracking
- Serial number tracking for high-value items

### Purchasing & Suppliers
- Supplier database (contacts, lead times, pricing)
- Purchase order creation, approval workflow, receiving
- Partial shipment handling
- Cost tracking (unit cost, landed cost)

### Sales/Order Fulfillment
- Sales order creation and picking lists
- Auto stock deduction on sale/shipment
- Backorder handling
- Returns and restocking (RMA)

### Warehouse/Location Management
- Multi-warehouse and bin/shelf-level tracking
- Stock transfers between locations
- Cycle counting / physical inventory reconciliation

### Reporting & Analytics
- Stock valuation (FIFO, LIFO, weighted average)
- Sales velocity / turnover rate
- Dead stock / slow-moving inventory reports
- Forecasting & demand planning
- Custom dashboards and KPIs

### User Management & Permissions
- Role-based access control (admin, manager, staff, viewer)
- Audit logs (who changed what, when)
- Multi-user concurrent access

### Integrations
- POS systems
- E-commerce platforms (Shopify, WooCommerce)
- Accounting software (QuickBooks, Xero)
- Shipping/logistics APIs
- Barcode scanner hardware

### Notifications
- Email/SMS/push alerts for low stock, PO approvals, overdue deliveries

### Mobile Support
- Mobile app or responsive web for warehouse-floor scanning

## 3. Database Schema (Core Tables)
```
Products (id, sku, name, category_id, unit, cost_price, sell_price, reorder_point, ...)
Categories (id, name, parent_id)
Warehouses (id, name, address)
Locations/Bins (id, warehouse_id, code)
Inventory (id, product_id, location_id, quantity, batch_no, expiry_date)
Suppliers (id, name, contact_info, lead_time)
PurchaseOrders (id, supplier_id, status, order_date, expected_date)
PurchaseOrderItems (id, po_id, product_id, quantity, unit_cost)
SalesOrders (id, customer_id, status, order_date)
SalesOrderItems (id, so_id, product_id, quantity, unit_price)
StockMovements (id, product_id, location_id, type[in/out/transfer/adjustment], quantity, reference_id, timestamp, user_id)
Users (id, name, email, role, password_hash)
AuditLogs (id, user_id, action, entity, entity_id, timestamp)
```
**Design principle**: never overwrite stock quantity directly — derive current stock
from the `StockMovements` ledger, or update a cached quantity field transactionally
alongside a movement record. This preserves a full audit trail and enables reconciliation.

## 4. Suggested Tech Stack
| Layer | Options |
|---|---|
| Frontend | React/Vue/Angular (web), Flutter/React Native (mobile) |
| Backend | Node.js (Express/NestJS), Django/FastAPI, Laravel, Spring Boot |
| Database | PostgreSQL/MySQL |
| Cache | Redis |
| Search | Elasticsearch/Algolia (large catalogs) |
| Auth | JWT + role-based middleware, or OAuth2 |
| Hosting | AWS/GCP/Azure, Docker + Kubernetes |
| Barcode | ZXing / QuaggaJS (scanning), bwip-js (generation) |

## 5. Development Phases
1. **MVP (4-6 wks)** — Product CRUD, single-warehouse stock tracking, manual stock in/out, basic roles, low-stock alerts
2. **Operations (4-6 wks)** — Purchase orders, suppliers, sales orders, barcode scanning, multi-location support
3. **Intelligence (3-4 wks)** — Reporting dashboards, stock valuation, forecasting, audit logs
4. **Integrations & Scale (ongoing)** — POS/e-commerce/accounting integrations, mobile app, public API, performance tuning

## 6. Critical Technical Considerations
- **Concurrency**: use DB transactions/row-locking to prevent overselling on simultaneous orders
- **Data integrity**: stock should never go negative unless backorders are explicitly allowed
- **Idempotency**: stock movement APIs should handle retries safely (idempotency keys)
- **Audit trail**: every stock change traceable to a user, timestamp, and reason
- **Scalability**: index SKU/product_id/location_id; use read replicas for reporting
- **Backup & DR**: automated backups, point-in-time recovery

## 7. Advanced / Nice-to-Have Features
- AI-based demand forecasting
- Barcode/RFID automated counting
- Multi-currency and multi-tax support
- Kitting/bundling (assemble multiple SKUs into one sellable unit)
- Vendor-managed inventory (VMI)
- Dropshipping support

## 8. UI/UX Plan

### Design Principles
- **Speed over decoration** — big touch targets, minimal clicks for scan-and-confirm actions
- **Error prevention over error messages** — disable invalid actions rather than showing errors after the fact
- **Progressive disclosure** — simple views by default (staff), detail/edit views one click deeper (managers/admins)
- **Consistency** — same layout patterns across every entity list (Products, Orders, Suppliers)

### Information Architecture
```
Dashboard (home)
├── Inventory
│   ├── Products (list, detail, add/edit)
│   ├── Stock Levels (by location)
│   └── Stock Movements (ledger/history)
├── Purchasing
│   ├── Purchase Orders (list, detail, create)
│   └── Suppliers
├── Sales
│   ├── Sales Orders
│   └── Returns/RMA
├── Warehouse
│   ├── Locations/Bins
│   ├── Transfers
│   └── Cycle Counts
├── Reports
│   ├── Stock Valuation
│   ├── Turnover / Dead Stock
│   └── Custom Dashboards
├── Settings
│   ├── Users & Roles
│   ├── Integrations
│   └── Alerts/Notifications
└── Notifications (global)
```

### Key Screens
- **Dashboard**: KPI cards (SKUs, low-stock count, pending POs, today's orders), stock trend chart, top sellers, alerts feed
- **Product List**: search/filter bar, table/grid toggle, status badges (In Stock/Low/Out), bulk action bar on selection
- **Product Detail**: image gallery, barcode w/ print button, tabbed fields (General, Pricing, Stock by Location, Suppliers, History), movement log
- **Stock In/Out (Scan Flow)**: full-screen scanner, product card on scan with quantity stepper and reason dropdown, big Confirm button, auto-returns to scan view for batch entry
- **Purchase Order Creation**: 3-step flow (select supplier → add line items → review & submit), visible status pill (Draft → Pending → Ordered → Received)
- **Reports/Dashboards**: sticky filter bar, chart/table toggle, consistent export button placement

### Navigation Pattern
- **Desktop**: collapsible left sidebar, top bar with search + notifications + user menu
- **Mobile/tablet**: bottom tab bar (Dashboard, Scan, Orders, More) with Scan as the prominent center action
- Global search (Cmd/Ctrl+K) to jump to any product/order by SKU or ID

### Visual & Interaction Details
- Status color coding (green/amber/red) paired with icon/label, never color alone
- Empty states with clear CTAs; skeleton loaders instead of spinners
- Confirmation modals only for destructive/irreversible actions; everything else undo-able via toast
- Toast notifications bottom-right, auto-dismiss

### Role-Based UI Differences
| Role | Sees |
|---|---|
| Staff | Scan flow, stock lookup, simplified order view |
| Manager | Full inventory, purchasing, reports |
| Admin | + Users, integrations, system settings |
| Viewer | Read-only dashboards/reports |

### Accessibility & Responsiveness
- WCAG 2.1 AA: 4.5:1 contrast minimum, keyboard-navigable tables/forms, ARIA labels on icon-only buttons
- Touch targets ≥44px on mobile (scan/confirm buttons especially)
- Responsive breakpoints: mobile (scan-first), tablet (hybrid), desktop (full data density)

### Recommended Tools
- **Design**: Figma (component library + auto-layout)
- **Component base**: shadcn/ui or Tailwind UI
- **Icons**: Lucide or Heroicons
- **Charts**: Recharts or Chart.js