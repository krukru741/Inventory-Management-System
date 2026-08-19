import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';

interface Props {
    product: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ProductHistoryModal({ product, open, onOpenChange }: Props) {
    const { data: movements, isLoading, isError } = useQuery({
        queryKey: ['products', product?.id, 'movements'],
        queryFn: async () => {
            if (!product?.id) return [];
            const { data } = await api.get(`/products/${product.id}/movements`);
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
        enabled: open && !!product?.id,
    });

    const getMovementIcon = (type: string, qty: number) => {
        if (type === 'adjustment') return <RefreshCcw className="w-4 h-4 text-[#B8863B]" />;
        if (qty > 0) return <ArrowDownRight className="w-4 h-4 text-green-600" />;
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
    };

    const getMovementTypeBadge = (type: string) => {
        switch (type) {
            case 'po_receive':
                return <Badge className="bg-[#DFF0E8] text-[#3D6B50]">Received (PO)</Badge>;
            case 'so_ship':
                return <Badge className="bg-[#F3D9D6] text-[#8C2E27]">Shipped (SO)</Badge>;
            case 'adjustment':
                return <Badge className="bg-[#F5E4B8] text-[#7A5A1E]">Adjustment</Badge>;
            default:
                return <Badge variant="secondary" className="uppercase">{type.replace('_', ' ')}</Badge>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#FBF8F2] border-[#E4DAC6]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#3D2621]">
                        Stock History: {product?.sku}
                    </DialogTitle>
                    <p className="text-sm text-[#8B6355]">{product?.name}</p>
                </DialogHeader>

                <div className="mt-4">
                    {isLoading ? (
                        <p className="text-sm text-[#8B6355] text-center py-8">Loading history...</p>
                    ) : isError ? (
                        <p className="text-sm text-red-600 bg-red-50 p-4 rounded text-center">Failed to load stock movements.</p>
                    ) : !movements || movements.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-[#D9CBB0] rounded-lg">
                            <p className="text-[#8B6355] text-sm">No stock movements recorded for this product yet.</p>
                        </div>
                    ) : (
                        <div className="border border-[#E4DAC6] rounded-lg bg-white overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#F5EEDC] text-[#5C4033] font-semibold text-xs tracking-wider border-b border-[#E4DAC6]">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Location</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3 text-right">Quantity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F0E6D2]">
                                    {movements.map((m: any) => (
                                        <tr key={m.id} className="hover:bg-[#FBF8F2] transition-colors">
                                            <td className="px-4 py-3 text-[#5C4033] whitespace-nowrap">
                                                {format(new Date(m.createdAt), 'MMM d, yyyy HH:mm')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-[#3D2621] font-medium">{m.location?.warehouse?.name || '-'}</div>
                                                <div className="text-xs text-[#8B6355]">{m.location?.code || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1 items-start">
                                                    {getMovementTypeBadge(m.movementType)}
                                                    {m.referenceId && (
                                                        <span className="text-[10px] text-[#8B6355] uppercase tracking-wide">
                                                            Ref: {m.referenceId.slice(0, 8)}...
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className={`font-medium ${m.quantity > 0 ? 'text-green-600' : m.quantity < 0 ? 'text-red-600' : 'text-[#8B6355]'}`}>
                                                        {m.quantity > 0 ? '+' : ''}{m.quantity}
                                                    </span>
                                                    {getMovementIcon(m.movementType, m.quantity)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
