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
} from "recharts";
import {
    Package,
    DollarSign,
    AlertTriangle,
    Truck,
    ShoppingCart,
} from "lucide-react";

interface DashboardMetrics {
    totalProductsCount: number;
    totalInventoryValue: number;
    lowStockAlertsCount: number;
    openPurchaseOrdersCount: number;
    openSalesOrdersCount: number;
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

const currency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});

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

    const topMovers = (Array.isArray(turnover) ? turnover : [])
        .map((row) => ({
            name: row.sku,
            fullName: row.product_name,
            units: Number(row.total_outbound) || 0,
        }))
        .filter((row) => row.units > 0)
        .slice(0, 8);

    return (
        <div className="space-y-6">
            <h1 className="text-base font-medium text-gray-800">Dashboard</h1>

            {metricsError && (
                <p className="text-sm text-status-red-text">
                    Couldn't load dashboard metrics. Try refreshing.
                </p>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
            </div>

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
        </div>
    );
}