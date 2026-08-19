import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Truck } from 'lucide-react';
import { api } from '@/lib/api';

import { Button } from '@/components/ui/button';
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

const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

interface Props {
    soId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        draft: 'bg-[#F5EFE3] text-[#8B6355] border-[#D9CBB0]',
        confirmed: 'bg-[#DFF0E8] text-[#3D6B50] border-[#A4CDB8]',
        partially_shipped: 'bg-[#FFF4DC] text-[#B8863B] border-[#E9C97B]',
        shipped: 'bg-[#3D2621] text-white border-[#3D2621]',
        cancelled: 'bg-red-100 text-red-700 border-red-300',
    };
    return (
        <Badge variant="outline" className={`capitalize ${map[status] ?? ''}`}>
            {status.replace(/_/g, ' ')}
        </Badge>
    );
}

export default function ShipOrderModal({ soId, open, onOpenChange }: Props) {
    const queryClient = useQueryClient();

    const [carrier, setCarrier] = useState('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [shipNotes, setShipNotes] = useState('');
    const [shipQtys, setShipQtys] = useState<Record<string, number>>({});
    const [locationIds, setLocationIds] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    const { data: so, isLoading } = useQuery({
        queryKey: ['sales-orders', soId],
        queryFn: async () => {
            const { data } = await api.get(`/sales-orders/${soId}`);
            return data.data ?? data;
        },
        enabled: open && !!soId,
    });

    const { data: locations } = useQuery({
        queryKey: ['warehouse-locations', so?.warehouseId],
        queryFn: async () => {
            const { data } = await api.get(`/warehouses/${so.warehouseId}/locations`);
            return data.data ?? data;
        },
        enabled: open && !!so?.warehouseId,
    });

    // Fetch stock levels so we can show available qty per location
    const { data: stockData } = useQuery({
        queryKey: ['inventory', 'for-so', so?.warehouseId],
        queryFn: async () => {
            const { data } = await api.get('/inventory', { params: { limit: 500 } });
            return (data.data ?? data) as any[];
        },
        enabled: open && !!so?.warehouseId,
    });

    // Build lookup: productId+locationId → available_qty
    const stockMap = new Map<string, number>();
    (stockData ?? []).forEach((row: any) => {
        stockMap.set(`${row.product_id}__${row.location_id}`, Number(row.available_qty ?? 0));
    });

    const confirmMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.patch(`/sales-orders/${soId}/confirm`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
        },
        onError: (err: any) => setError(err?.response?.data?.message ?? 'Failed to confirm order.'),
    });

    const shipMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post(`/sales-orders/${soId}/ship`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            onOpenChange(false);
        },
        onError: (err: any) => setError(err?.response?.data?.message ?? 'Failed to ship order.'),
    });

    const handleShip = () => {
        setError(null);
        const shippableItems = (so?.items ?? []).filter((i: any) => Number(i.orderedQty) > Number(i.shippedQty));

        const shipItems = shippableItems
            .filter((i: any) => Number(shipQtys[i.id] ?? 0) > 0)
            .map((i: any) => ({
                soiId: i.id,
                locationId: locationIds[i.id],
                shippedQty: Number(shipQtys[i.id]),
            }));

        if (shipItems.length === 0) {
            setError('Enter a quantity to ship for at least one item.');
            return;
        }
        if (shipItems.some((i: any) => !i.locationId)) {
            setError('Please select a warehouse location for each item being shipped.');
            return;
        }

        shipMutation.mutate({ carrier, trackingNumber, notes: shipNotes, items: shipItems });
    };

    const canConfirm = so?.status === 'draft';
    const canShip = so?.status === 'confirmed' || so?.status === 'partially_shipped';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#FBF8F2] border-[#E4DAC6]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#3D2621]">
                        Sales Order Details
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-12 text-center text-[#A08A72]">Loading order details…</div>
                ) : so ? (
                    <div className="space-y-6 mt-2">
                        {/* Header Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#F5EFE3] rounded-lg border border-[#E4DAC6]">
                            <div>
                                <p className="text-xs text-[#A08A72] uppercase tracking-wide">SO Number</p>
                                <p className="font-semibold text-[#3D2621]">{so.soNumber}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#A08A72] uppercase tracking-wide">Customer</p>
                                <p className="font-medium text-[#3D2621]">{so.customer?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[#A08A72] uppercase tracking-wide">Status</p>
                                <StatusBadge status={so.status} />
                            </div>
                            <div>
                                <p className="text-xs text-[#A08A72] uppercase tracking-wide">Total</p>
                                <p className="font-semibold text-[#3D2621]">{currencyFormat.format(Number(so.totalAmount))}</p>
                            </div>
                        </div>

                        {/* Line Items Table */}
                        <div>
                            <h3 className="font-semibold text-[#5C4033] mb-3">Line Items</h3>
                            <div className="rounded-md border border-[#E4DAC6] overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#F0E7D3]">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-[#5C4033] font-semibold">Product</th>
                                            <th className="px-4 py-2 text-right text-[#5C4033] font-semibold">Ordered</th>
                                            <th className="px-4 py-2 text-right text-[#5C4033] font-semibold">Shipped</th>
                                            <th className="px-4 py-2 text-right text-[#5C4033] font-semibold">Remaining</th>
                                            {canShip && <th className="px-4 py-2 text-right text-[#5C4033] font-semibold">Ship Qty</th>}
                                            {canShip && <th className="px-4 py-2 text-left text-[#5C4033] font-semibold">Location (Avail. Stock)</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(so.items ?? []).map((item: any) => {
                                            const remaining = Number(item.orderedQty) - Number(item.shippedQty);
                                            return (
                                                <tr key={item.id} className="border-t border-[#EFE7D6]">
                                                    <td className="px-4 py-3 text-[#3D2621] font-medium">
                                                        {item.product?.name ?? item.productId}
                                                        {item.product?.sku && (
                                                            <span className="ml-1 text-[#A08A72] font-normal text-xs">({item.product.sku})</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-[#5C4033]">{Number(item.orderedQty)}</td>
                                                    <td className="px-4 py-3 text-right text-[#5C4033]">{Number(item.shippedQty)}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-[#3D2621]">
                                                        {remaining > 0 ? remaining : (
                                                            <span className="text-[#3D6B50]">✓ Done</span>
                                                        )}
                                                    </td>
                                                    {canShip && (
                                                        <td className="px-4 py-3 text-right">
                                                            {remaining > 0 ? (
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    max={remaining}
                                                                    className="w-20 border-[#D9CBB0] text-right ml-auto"
                                                                    value={shipQtys[item.id] ?? ''}
                                                                    onChange={e => setShipQtys(prev => ({
                                                                        ...prev,
                                                                        [item.id]: Number(e.target.value),
                                                                    }))}
                                                                />
                                                            ) : '—'}
                                                        </td>
                                                    )}
                                                    {canShip && (
                                                        <td className="px-4 py-3">
                                                            {remaining > 0 ? (
                                                                <div className="space-y-1">
                                                                    <select
                                                                        className={`flex h-9 w-full min-w-[140px] rounded-md border px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8863B] ${
                                                                            locationIds[item.id] &&
                                                                            stockMap.get(`${item.productId}__${locationIds[item.id]}`) === 0
                                                                                ? 'border-red-400 bg-red-50'
                                                                                : 'border-[#D9CBB0] bg-white'
                                                                        }`}
                                                                        value={locationIds[item.id] ?? ''}
                                                                        onChange={e => setLocationIds(prev => ({
                                                                            ...prev,
                                                                            [item.id]: e.target.value,
                                                                        }))}
                                                                    >
                                                                        <option value="" disabled>Select bin...</option>
                                                                        {(locations || []).map((l: any) => {
                                                                            const avail = stockMap.get(`${item.productId}__${l.id}`);
                                                                            const hasStock = avail !== undefined && avail > 0;
                                                                            return (
                                                                                <option
                                                                                    key={l.id}
                                                                                    value={l.id}
                                                                                    style={{ color: hasStock ? '#3D2621' : '#A08A72' }}
                                                                                >
                                                                                    {l.code}{avail !== undefined ? ` — ${avail} avail` : ''}
                                                                                </option>
                                                                            );
                                                                        })}
                                                                    </select>
                                                                    {locationIds[item.id] &&
                                                                        stockMap.get(`${item.productId}__${locationIds[item.id]}`) === 0 && (
                                                                        <p className="text-xs text-red-600">⚠ No stock at this location</p>
                                                                    )}
                                                                    {locationIds[item.id] &&
                                                                        (stockMap.get(`${item.productId}__${locationIds[item.id]}`) ?? -1) > 0 &&
                                                                        Number(shipQtys[item.id] ?? 0) > (stockMap.get(`${item.productId}__${locationIds[item.id]}`) ?? 0) && (
                                                                        <p className="text-xs text-red-600">⚠ Only {stockMap.get(`${item.productId}__${locationIds[item.id]}`)} available</p>
                                                                    )}
                                                                </div>
                                                            ) : '—'}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Shipping Details (only when shipping) */}
                        {canShip && (
                            <div className="space-y-4 pt-4 border-t border-[#E4DAC6]">
                                <h3 className="font-semibold text-[#5C4033]">Shipment Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[#8B6355]">Carrier (Optional)</Label>
                                        <Input placeholder="e.g. LBC, J&T, DHL" value={carrier}
                                            onChange={e => setCarrier(e.target.value)} className="border-[#D9CBB0]" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[#8B6355]">Tracking Number (Optional)</Label>
                                        <Input placeholder="Tracking no." value={trackingNumber}
                                            onChange={e => setTrackingNumber(e.target.value)} className="border-[#D9CBB0]" />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label className="text-[#8B6355]">Notes (Optional)</Label>
                                        <Input placeholder="Packing notes..." value={shipNotes}
                                            onChange={e => setShipNotes(e.target.value)} className="border-[#D9CBB0]" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>
                        )}
                    </div>
                ) : (
                    <div className="py-12 text-center text-[#A08A72]">Order not found.</div>
                )}

                <DialogFooter className="gap-2 mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#D9CBB0] text-[#5C4033]">
                        Close
                    </Button>

                    {canConfirm && (
                        <Button
                            onClick={() => confirmMutation.mutate()}
                            disabled={confirmMutation.isPending}
                            className="bg-[#B8863B] text-white hover:bg-[#A07028]"
                        >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {confirmMutation.isPending ? 'Confirming...' : 'Confirm Order'}
                        </Button>
                    )}

                    {canShip && (
                        <Button
                            onClick={handleShip}
                            disabled={shipMutation.isPending}
                            className="bg-[#3D6B50] text-white hover:bg-[#2F5440]"
                        >
                            <Truck className="mr-2 h-4 w-4" />
                            {shipMutation.isPending ? 'Shipping...' : 'Mark as Shipped'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
