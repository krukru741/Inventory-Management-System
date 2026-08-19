import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Package,
    DollarSign,
    AlertTriangle,
    Truck,
    ShoppingCart,
    Users,
} from "lucide-react";

interface DashboardMetrics {
    totalProductsCount: number;
    totalInventoryValue: number;
    lowStockAlertsCount: number;
    openPurchaseOrdersCount: number;
    openSalesOrdersCount: number;
    activeCustomersCount: number;
}

interface TurnoverRow {
    product_id: string;
    sku: string;
    product_name: string;
    total_outbound: number | string; // raw SQL numeric may come back as string
}

async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
    const { data } = await api.get("/reports/dashboard");
    return data.data ?? data; // unwrap { data, meta } envelope, fall back if not wrapped
}

async function fetchTurnover(): Promise<TurnoverRow[]> {
    const { data } = await api.get("/reports/turnover");
    return data.data ?? data;
}

interface ValuationRow {
    warehouse_id: string;
    warehouse_name: string;
    total_qty: number | string;
    total_value: number | string;
}

interface DeadStockRow {
    product_id: string;
    sku: string;
    product_name: string;
    last_movement_date: string | null;
    current_stock: number | string;
    stock_value: number | string;
}

async function fetchStockValuation(): Promise<ValuationRow[]> {
    const { data } = await api.get("/reports/stock-valuation");
    return data.data ?? data;
}

async function fetchDeadStock(): Promise<DeadStockRow[]> {
    const { data } = await api.get("/reports/dead-stock");
    return data.data ?? data;
}

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

const currencyPrecise = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
});

function formatDate(value: string | null) {
    if (!value) return "Never";
    return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

function KpiCard({
    label,
    value,
    icon: Icon,
    tone = "default",
}: {
    label: string;
    value: string;
    icon: React.ElementType;
    tone?: "default" | "warning";
}) {
    return (
        <Card>
            <CardContent className="flex items-center justify-between p-4">
                <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-medium text-gray-800">{value}</p>
                </div>
                <div
                    className={`flex h-9 w-9 items-center justify-center rounded-md ${tone === "warning"
                        ? "bg-status-amber-bg text-status-amber-text"
                        : "bg-clay-brown/10 text-clay-brown"
                        }`}
                >
                    <Icon size={18} />
                </div>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const {
        data: metrics,
        isLoading: metricsLoading,
        isError: metricsError,
    } = useQuery({
        queryKey: ["dashboard-metrics"],
        queryFn: fetchDashboardMetrics,
    });

    const {
        data: turnover,
        isLoading: turnoverLoading,
        isError: turnoverError,
    } = useQuery({
        queryKey: ["turnover"],
        queryFn: fetchTurnover,
    });

    const {
        data: valuation,
        isLoading: valuationLoading,
        isError: valuationError,
    } = useQuery({
        queryKey: ["stock-valuation"],
        queryFn: fetchStockValuation,
    });

    const {
        data: deadStock,
        isLoading: deadStockLoading,
        isError: deadStockError,
    } = useQuery({
        queryKey: ["dead-stock"],
        queryFn: fetchDeadStock,
    });

    const topMovers = (Array.isArray(turnover) ? turnover : [])
        .map((row) => ({
            name: row.sku,
            fullName: row.product_name,
            units: Number(row.total_outbound) || 0,
        }))
        .filter((row) => row.units > 0)
        .slice(0, 8);

    const valuationData = (Array.isArray(valuation) ? valuation : [])
        .map((row) => ({
            name: row.warehouse_name,
            value: Number(row.total_value) || 0,
        }))
        .filter((row) => row.value > 0);

    const deadStockRows = Array.isArray(deadStock) ? deadStock : [];

    const COLORS = ['#6B352A', '#A08A72', '#C4B49F', '#E4DAC6', '#F5EFE3'];

    return (
        <div className="space-y-6">
            <h1 className="text-base font-medium text-gray-800">Dashboard</h1>

            {metricsError && (
                <p className="text-sm text-status-red-text">
                    Couldn't load dashboard metrics. Try refreshing.
                </p>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <KpiCard
                    label="Total SKUs"
                    value={metricsLoading ? "…" : String(metrics?.totalProductsCount ?? 0)}
                    icon={Package}
                />
                <KpiCard
                    label="Inventory value"
                    value={
                        metricsLoading
                            ? "…"
                            : currency.format(metrics?.totalInventoryValue ?? 0)
                    }
                    icon={DollarSign}
                />
                <KpiCard
                    label="Low stock alerts"
                    value={metricsLoading ? "…" : String(metrics?.lowStockAlertsCount ?? 0)}
                    icon={AlertTriangle}
                    tone="warning"
                />
                <KpiCard
                    label="Open purchase orders"
                    value={
                        metricsLoading ? "…" : String(metrics?.openPurchaseOrdersCount ?? 0)
                    }
                    icon={Truck}
                />
                <KpiCard
                    label="Open sales orders"
                    value={metricsLoading ? "…" : String(metrics?.openSalesOrdersCount ?? 0)}
                    icon={ShoppingCart}
                />
                <KpiCard
                    label="Active customers"
                    value={metricsLoading ? "…" : String(metrics?.activeCustomersCount ?? 0)}
                    icon={Users}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-800">
                            Top movers
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Products with the most outbound stock movement
                        </p>
                    </CardHeader>
                    <CardContent>
                        {turnoverLoading && (
                            <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
                        )}
                        {turnoverError && (
                            <p className="py-8 text-center text-sm text-status-red-text">
                                Couldn't load turnover data.
                            </p>
                        )}
                        {!turnoverLoading && !turnoverError && topMovers.length === 0 && (
                            <p className="py-8 text-center text-sm text-gray-400">
                                No outbound stock movement recorded yet.
                            </p>
                        )}
                        {topMovers.length > 0 && (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={topMovers} margin={{ left: 0, right: 12 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                    <Tooltip
                                        formatter={(value: number, _key, entry) => [
                                            `${value} units`,
                                            entry?.payload?.fullName ?? "",
                                        ]}
                                    />
                                    <Bar dataKey="units" fill="#6B352A" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-800">
                            Stock valuation by warehouse
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Share of total inventory value per warehouse
                        </p>
                    </CardHeader>
                    <CardContent>
                        {valuationLoading && (
                            <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
                        )}
                        {valuationError && (
                            <p className="py-8 text-center text-sm text-status-red-text">
                                Couldn't load stock valuation.
                            </p>
                        )}
                        {!valuationLoading && !valuationError && valuationData.length === 0 && (
                            <p className="py-8 text-center text-sm text-gray-400">
                                No valued stock on hand yet.
                            </p>
                        )}
                        {valuationData.length > 0 && (
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={valuationData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={95}
                                        paddingAngle={2}
                                    >
                                        {valuationData.map((_entry, index) => (
                                            <Cell
                                                key={`slice-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => currencyPrecise.format(value)}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        wrapperStyle={{ fontSize: 12 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-800">
                        Dead stock
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Products with no outbound movement in a while — candidates to discount or write off
                    </p>
                </CardHeader>
                <CardContent>
                    {deadStockLoading && (
                        <p className="py-8 text-center text-sm text-gray-400">Loading…</p>
                    )}
                    {deadStockError && (
                        <p className="py-8 text-center text-sm text-status-red-text">
                            Couldn't load dead stock data.
                        </p>
                    )}
                    {!deadStockLoading && !deadStockError && deadStockRows.length === 0 && (
                        <p className="py-8 text-center text-sm text-gray-400">
                            No dead stock right now — everything's moving.
                        </p>
                    )}
                    {deadStockRows.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Last movement</TableHead>
                                    <TableHead className="text-right">On hand</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {deadStockRows.map((row) => (
                                    <TableRow key={row.product_id}>
                                        <TableCell className="font-medium text-gray-800">
                                            {row.sku}
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {row.product_name}
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {formatDate(row.last_movement_date)}
                                        </TableCell>
                                        <TableCell className="text-right text-gray-800">
                                            {Number(row.current_stock).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-gray-800">
                                            {currencyPrecise.format(Number(row.stock_value))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}