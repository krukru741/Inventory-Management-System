import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface ReceiveGoodsModalProps {
    poId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ReceiveGoodsModal({ poId, open, onOpenChange }: ReceiveGoodsModalProps) {
    const queryClient = useQueryClient();
    const [receiveState, setReceiveState] = useState<Record<string, { receivedQty: number; locationId: string }>>({});

    const { data: po, isLoading, isError } = useQuery({
        queryKey: ['purchase-order', poId],
        queryFn: async () => {
            const { data } = await api.get(`/purchase-orders/${poId}`);
            return data.data ?? data;
        },
        enabled: open && !!poId,
    });

    const approveMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.patch(`/purchase-orders/${poId}/approve`);
            return data.data ?? data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-order', poId] });
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
        },
    });

    const receiveMutation = useMutation({
        mutationFn: async (payload: { items: any[]; notes?: string }) => {
            const { data } = await api.post(`/purchase-orders/${poId}/receive`, payload);
            return data.data ?? data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-order', poId] });
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
            queryClient.invalidateQueries({ queryKey: ['stock-summary'] });
            onOpenChange(false);
        },
    });

    // Auto-fill locationId with warehouse default if possible, or leave blank for user to pick
    // For simplicity, we just use the PO's warehouseId as the locationId for now.
    // In a real app, you'd fetch locations for this warehouse and let the user select.
    useEffect(() => {
        if (po?.items) {
            const defaultState: Record<string, { receivedQty: number; locationId: string }> = {};
            po.items.forEach((item: any) => {
                const remaining = Number(item.orderedQty) - Number(item.receivedQty);
                if (remaining > 0) {
                    defaultState[item.id] = {
                        receivedQty: remaining,
                        locationId: po.warehouseId, // default to warehouse ID as fallback
                    };
                }
            });
            setReceiveState(defaultState);
        }
    }, [po]);

    if (!open) return null;

    const handleReceiveChange = (itemId: string, field: 'receivedQty' | 'locationId', value: any) => {
        setReceiveState(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value,
            }
        }));
    };

    const handleSubmitReceive = () => {
        const itemsToReceive = Object.entries(receiveState)
            .filter(([_, state]) => state.receivedQty > 0)
            .map(([poiId, state]) => ({
                poiId,
                locationId: state.locationId,
                receivedQty: Number(state.receivedQty),
            }));

        if (itemsToReceive.length === 0) return;

        receiveMutation.mutate({ items: itemsToReceive, notes: 'Received via Dashboard UI' });
    };

    const isDraft = po?.status === 'draft' || po?.status === 'pending_approval';
    const canReceive = po?.status === 'approved' || po?.status === 'ordered' || po?.status === 'partially_received';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl bg-[#FBF8F2] border-[#E4DAC6]">
                <DialogHeader>
                    <DialogTitle className="text-[#3D2621]">
                        Purchase Order: {po?.poNumber}
                    </DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="py-8 text-center text-[#A08A72]">Loading PO details...</div>
                ) : isError || !po ? (
                    <div className="py-8 text-center text-[#8C2E27]">Failed to load PO details.</div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex gap-4 items-center">
                            <Badge variant="outline" className="border-[#D9CBB0] text-[#5C4033] bg-white">
                                Status: {po.status.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm text-[#A08A72]">
                                Supplier ID: {po.supplierId}
                            </span>
                        </div>

                        <div className="overflow-hidden rounded-md border border-[#E4DAC6]">
                            <Table>
                                <TableHeader className="bg-[#F0E7D3]">
                                    <TableRow className="border-[#E4DAC6] hover:bg-transparent">
                                        <TableHead className="font-semibold text-[#5C4033]">Item</TableHead>
                                        <TableHead className="font-semibold text-[#5C4033] text-right">Ordered</TableHead>
                                        <TableHead className="font-semibold text-[#5C4033] text-right">Received</TableHead>
                                        {canReceive && (
                                            <TableHead className="font-semibold text-[#5C4033] text-right">Receive Now</TableHead>
                                        )}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {po.items?.map((item: any) => {
                                        const remaining = Number(item.orderedQty) - Number(item.receivedQty);
                                        return (
                                            <TableRow key={item.id} className="border-[#EFE7D6] hover:bg-[#F5EFE3]">
                                                <TableCell className="text-[#3D2621]">
                                                    <div className="font-medium">Product {item.productId.split('-')[0]}</div>
                                                    <div className="text-xs text-[#A08A72]">{item.description}</div>
                                                </TableCell>
                                                <TableCell className="text-right text-[#5C4033]">{Number(item.orderedQty)}</TableCell>
                                                <TableCell className="text-right text-[#5C4033]">{Number(item.receivedQty)}</TableCell>
                                                {canReceive && (
                                                    <TableCell className="text-right">
                                                        {remaining > 0 ? (
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max={remaining}
                                                                value={receiveState[item.id]?.receivedQty ?? ''}
                                                                onChange={(e) => handleReceiveChange(item.id, 'receivedQty', e.target.value)}
                                                                className="w-24 ml-auto border-[#D9CBB0] focus-visible:ring-[#B8863B]"
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-[#A08A72]">Complete</span>
                                                        )}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-4 gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#D9CBB0] text-[#5C4033]">
                        Close
                    </Button>
                    
                    {isDraft && (
                        <Button 
                            onClick={() => approveMutation.mutate()}
                            disabled={approveMutation.isPending}
                            className="bg-[#6B352A] text-white hover:bg-[#5A2C22]"
                        >
                            {approveMutation.isPending ? 'Approving...' : 'Approve Order'}
                        </Button>
                    )}

                    {canReceive && (
                        <Button
                            onClick={handleSubmitReceive}
                            disabled={receiveMutation.isPending || Object.values(receiveState).every(s => !s.receivedQty || s.receivedQty <= 0)}
                            className="bg-[#6B4A3E] text-[#F7F2E7] hover:bg-[#5A3D33]"
                        >
                            {receiveMutation.isPending ? 'Receiving...' : 'Receive Selected Items'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
