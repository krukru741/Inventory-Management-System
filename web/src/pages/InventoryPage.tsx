import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, PackagePlus, AlertTriangle, PackageX, Boxes, DollarSign } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

import { api } from '@/lib/api';

// -----------------------------------------------------------------------------
// Types — mirror the v_stock_summary view columns returned by GET /inventory
// -----------------------------------------------------------------------------
interface StockSummaryRow {
    product_id: string;
    sku: string;
    product_name: string;
    reorder_point: string;
    category_name: string | null;
    warehouse_id: string;
    warehouse_name: string;
    location_id: string;
    location_code: string;
    on_hand_qty: string;
    reserved_qty: string;
    available_qty: string;
    stock_value: string;
}

interface StockSummaryResponse {
    data: StockSummaryRow[];
    meta: { total: number; page: number; limit: number };
}

interface LowStockRow extends StockSummaryRow {
    alert_level: 'low_stock' | 'out_of_stock';
}

interface ProductOption {
    id: string;
    sku: string;
    name: string;
}

interface LocationOption {
    id: string;
    code: string;
    warehouse_name?: string;
}

// -----------------------------------------------------------------------------
// Data hooks
// -----------------------------------------------------------------------------
function useStockSummary(page: number, limit: number, search: string) {
    return useQuery<StockSummaryResponse>({
        queryKey: ['inventory', 'summary', page, limit, search],
        queryFn: async () => {
            const { data } = await api.get('/inventory', {
                params: { page, limit, search: search || undefined },
            });
            return data;
        },
        placeholderData: (prev) => prev,
    });
}

function useLowStockAlerts() {
    return useQuery<LowStockRow[]>({
        queryKey: ['inventory', 'low-stock'],
        queryFn: async () => {
            const { data } = await api.get('/inventory/low-stock');
            return data.data ?? data;
        },
    });
}

function useProductOptions() {
    return useQuery<ProductOption[]>({
        queryKey: ['products', 'options'],
        queryFn: async () => {
            const { data } = await api.get('/products', { params: { limit: 500 } });
            return (data.data ?? data).map((p: any) => ({ id: p.id, sku: p.sku, name: p.name }));
        },
        staleTime: 5 * 60 * 1000,
    });
}

function useLocationOptions() {
    return useQuery<LocationOption[]>({
        queryKey: ['locations', 'options'],
        queryFn: async () => {
            const { data } = await api.get('/warehouses/locations');
            return (data.data ?? data).map((l: any) => ({
                id: l.id,
                code: l.code,
                warehouse_name: l.warehouse?.name,
            }));
        },
        staleTime: 5 * 60 * 1000,
    });
}

interface AdjustStockPayload {
    productId: string;
    locationId: string;
    quantityChange: number;
    reason?: string;
    idempotencyKey: string;
}

function useAdjustStock() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: AdjustStockPayload) => {
            const { data } = await api.post('/inventory/adjust', payload);
            return data.data ?? data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
        },
    });
}

// -----------------------------------------------------------------------------
// Formatting helpers
// -----------------------------------------------------------------------------
const fmtQty = (v: string | number) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(v));

const fmtCurrency = (v: string | number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v));

// -----------------------------------------------------------------------------
// Stat card
// -----------------------------------------------------------------------------
function StatCard({
    icon: Icon,
    label,
    value,
    tone = 'default',
}: {
    icon: typeof Boxes;
    label: string;
    value: string;
    tone?: 'default' | 'warn' | 'danger';
}) {
    const toneClasses = {
        default: 'bg-[#6B4A3E] text-[#F7F2E7]',
        warn: 'bg-[#B8863B] text-[#F7F2E7]',
        danger: 'bg-[#9A3B34] text-[#F7F2E7]',
    }[tone];

    return (
        <Card className="border-[#E4DAC6] bg-[#FBF8F2] shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${toneClasses}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#8B6355]">{label}</p>
                    <p className="text-xl font-semibold text-[#3D2621]">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

// -----------------------------------------------------------------------------
// Adjust Stock dialog
// -----------------------------------------------------------------------------
function AdjustStockDialog({
    open,
    onOpenChange,
    defaultProductId,
    defaultLocationId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultProductId?: string;
    defaultLocationId?: string;
}) {
    const { data: products } = useProductOptions();
    const { data: locations } = useLocationOptions();
    const adjustStock = useAdjustStock();

    const [productId, setProductId] = useState(defaultProductId ?? '');
    const [locationId, setLocationId] = useState(defaultLocationId ?? '');
    const [quantityChange, setQuantityChange] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState<string | null>(null);

    const reset = () => {
        setProductId(defaultProductId ?? '');
        setLocationId(defaultLocationId ?? '');
        setQuantityChange('');
        setReason('');
        setError(null);
    };

    const handleSubmit = async () => {
        setError(null);
        const parsed = Number(quantityChange);

        if (!productId || !locationId) {
            setError('Choose a product and a location.');
            return;
        }
        if (!parsed || Number.isNaN(parsed)) {
            setError('Enter a non-zero quantity. Use a negative number to remove stock.');
            return;
        }

        try {
            await adjustStock.mutateAsync({
                productId,
                locationId,
                quantityChange: parsed,
                reason: reason || undefined,
                idempotencyKey: uuidv4(),
            });
            reset();
            onOpenChange(false);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Could not adjust stock. Try again.');
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) reset();
                onOpenChange(next);
            }}
        >
            <DialogContent className="border-[#E4DAC6] bg-[#FBF8F2] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-[#3D2621]">Adjust stock</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="product" className="text-[#5C4033]">
                            Product
                        </Label>
                        <select
                            id="product"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            className="w-full rounded-md border border-[#D9CBB0] bg-white px-3 py-2 text-sm text-[#3D2621] focus:outline-none focus:ring-2 focus:ring-[#B8863B]"
                        >
                            <option value="">Select a product…</option>
                            {products?.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.sku} — {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="location" className="text-[#5C4033]">
                            Location
                        </Label>
                        <select
                            id="location"
                            value={locationId}
                            onChange={(e) => setLocationId(e.target.value)}
                            className="w-full rounded-md border border-[#D9CBB0] bg-white px-3 py-2 text-sm text-[#3D2621] focus:outline-none focus:ring-2 focus:ring-[#B8863B]"
                        >
                            <option value="">Select a location…</option>
                            {locations?.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.code}
                                    {l.warehouse_name ? ` — ${l.warehouse_name}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="qty" className="text-[#5C4033]">
                            Quantity change
                        </Label>
                        <Input
                            id="qty"
                            type="number"
                            step="0.01"
                            placeholder="e.g. 25 to add, -10 to remove"
                            value={quantityChange}
                            onChange={(e) => setQuantityChange(e.target.value)}
                            className="border-[#D9CBB0] focus-visible:ring-[#B8863B]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="reason" className="text-[#5C4033]">
                            Reason <span className="text-[#A08A72]">(optional)</span>
                        </Label>
                        <Input
                            id="reason"
                            placeholder="e.g. Cycle count correction"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="border-[#D9CBB0] focus-visible:ring-[#B8863B]"
                        />
                    </div>

                    {error && (
                        <p className="rounded-md bg-[#F3D9D6] px-3 py-2 text-sm text-[#8C2E27]">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-[#D9CBB0] text-[#5C4033]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={adjustStock.isPending}
                        className="bg-[#6B4A3E] text-[#F7F2E7] hover:bg-[#5A3D33]"
                    >
                        {adjustStock.isPending ? 'Saving…' : 'Save adjustment'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// -----------------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------------
export default function InventoryPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [rowContext, setRowContext] = useState<{ productId?: string; locationId?: string }>({});
    const limit = 20;

    const { data: summary, isLoading, isFetching } = useStockSummary(page, limit, search);
    const { data: lowStock } = useLowStockAlerts();

    const stats = useMemo(() => {
        const rows = summary?.data ?? [];
        const totalSkus = new Set(rows.map((r) => r.product_id)).size;
        const totalValue = rows.reduce((sum, r) => sum + Number(r.stock_value), 0);
        const lowCount = lowStock?.filter((r) => r.alert_level === 'low_stock').length ?? 0;
        const outCount = lowStock?.filter((r) => r.alert_level === 'out_of_stock').length ?? 0;
        return { totalSkus, totalValue, lowCount, outCount };
    }, [summary, lowStock]);

    const totalPages = summary?.meta?.total ? Math.max(1, Math.ceil(summary.meta.total / limit)) : 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-[#3D2621]">Inventory</h1>
                    <p className="text-sm text-[#8B6355]">On-hand stock across every warehouse and bin.</p>
                </div>
                <Button
                    onClick={() => {
                        setRowContext({});
                        setDialogOpen(true);
                    }}
                    className="gap-2 bg-[#6B4A3E] text-[#F7F2E7] hover:bg-[#5A3D33]"
                >
                    <PackagePlus className="h-4 w-4" />
                    Adjust stock
                </Button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={Boxes} label="Tracked SKUs" value={fmtQty(stats.totalSkus)} />
                <StatCard
                    icon={AlertTriangle}
                    label="Low stock"
                    value={fmtQty(stats.lowCount)}
                    tone={stats.lowCount > 0 ? 'warn' : 'default'}
                />
                <StatCard
                    icon={PackageX}
                    label="Out of stock"
                    value={fmtQty(stats.outCount)}
                    tone={stats.outCount > 0 ? 'danger' : 'default'}
                />
                <StatCard icon={DollarSign} label="Stock value" value={fmtCurrency(stats.totalValue)} />
            </div>

            {/* Low stock strip */}
            {lowStock && lowStock.length > 0 && (
                <Card className="border-[#E9C97B] bg-[#FBF2DC]">
                    <CardContent className="flex flex-wrap items-center gap-2 p-3">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-[#B8863B]" />
                        <span className="text-sm font-medium text-[#6B4A3E]">
                            {lowStock.length} product{lowStock.length === 1 ? '' : 's'} need attention:
                        </span>
                        {lowStock.slice(0, 6).map((r) => (
                            <Badge
                                key={`${r.product_id}-${r.location_id}`}
                                variant="outline"
                                className={
                                    r.alert_level === 'out_of_stock'
                                        ? 'border-[#C9776F] bg-[#F3D9D6] text-[#8C2E27]'
                                        : 'border-[#D9B15F] bg-[#F5E4B8] text-[#7A5A1E]'
                                }
                            >
                                {r.sku}
                            </Badge>
                        ))}
                        {lowStock.length > 6 && (
                            <span className="text-xs text-[#8B6355]">+{lowStock.length - 6} more</span>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A08A72]" />
                <Input
                    placeholder="Search by SKU or product name…"
                    value={search}
                    onChange={(e) => {
                        setPage(1);
                        setSearch(e.target.value);
                    }}
                    className="border-[#D9CBB0] bg-[#FBF8F2] pl-9 focus-visible:ring-[#B8863B]"
                />
            </div>

            {/* Stock table */}
            <Card className="overflow-hidden border-[#E4DAC6] bg-[#FBF8F2]">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#E4DAC6] bg-[#F0E7D3] text-left text-xs uppercase tracking-wide text-[#8B6355]">
                                <th className="px-4 py-3 font-medium">SKU</th>
                                <th className="px-4 py-3 font-medium">Product</th>
                                <th className="px-4 py-3 font-medium">Location</th>
                                <th className="px-4 py-3 text-right font-medium">On hand</th>
                                <th className="px-4 py-3 text-right font-medium">Reserved</th>
                                <th className="px-4 py-3 text-right font-medium">Available</th>
                                <th className="px-4 py-3 text-right font-medium">Value</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-10 text-center text-[#A08A72]">
                                        Loading stock levels…
                                    </td>
                                </tr>
                            ) : summary?.data?.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-10 text-center text-[#A08A72]">
                                        No products match that search yet.
                                    </td>
                                </tr>
                            ) : (
                                summary?.data?.map((row) => {
                                    const isLow = Number(row.on_hand_qty) <= Number(row.reorder_point);
                                    const isOut = Number(row.on_hand_qty) === 0;
                                    return (
                                        <tr
                                            key={`${row.product_id}-${row.location_id}`}
                                            className="border-b border-[#EFE7D6] last:border-0 hover:bg-[#F5EFE3]"
                                        >
                                            <td className="px-4 py-3 font-medium text-[#3D2621]">{row.sku}</td>
                                            <td className="px-4 py-3 text-[#5C4033]">{row.product_name}</td>
                                            <td className="px-4 py-3 text-[#5C4033]">
                                                {row.warehouse_name} · {row.location_code}
                                            </td>
                                            <td className="px-4 py-3 text-right text-[#3D2621]">
                                                {fmtQty(row.on_hand_qty)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-[#8B6355]">
                                                {fmtQty(row.reserved_qty)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-[#3D2621]">
                                                {fmtQty(row.available_qty)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-[#5C4033]">
                                                {fmtCurrency(row.stock_value)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isOut ? (
                                                        <Badge className="border-[#C9776F] bg-[#F3D9D6] text-[#8C2E27]">
                                                            Out
                                                        </Badge>
                                                    ) : isLow ? (
                                                        <Badge className="border-[#D9B15F] bg-[#F5E4B8] text-[#7A5A1E]">
                                                            Low
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="border-[#A9C4A0] bg-[#E2EEDD] text-[#3F6B37]">
                                                            OK
                                                        </Badge>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setRowContext({
                                                                productId: row.product_id,
                                                                locationId: row.location_id,
                                                            });
                                                            setDialogOpen(true);
                                                        }}
                                                        className="text-[#6B4A3E] hover:bg-[#EADFC7] hover:text-[#3D2621]"
                                                    >
                                                        Adjust
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-[#E4DAC6] px-4 py-3 text-sm text-[#8B6355]">
                    <span>
                        Page {page} of {totalPages}
                        {isFetching && ' · refreshing…'}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="border-[#D9CBB0] text-[#5C4033]"
                        >
                            Previous
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="border-[#D9CBB0] text-[#5C4033]"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </Card>

            <AdjustStockDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                defaultProductId={rowContext.productId}
                defaultLocationId={rowContext.locationId}
            />
        </div>
    );
}