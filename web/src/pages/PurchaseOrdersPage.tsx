import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api';
import ReceiveGoodsModal from '@/components/ReceiveGoodsModal';
import CreatePurchaseOrderModal from '@/components/CreatePurchaseOrderModal';

interface PO {
    id: string;
    po_number: string; // from mapping or direct
    poNumber: string; // Prisma uses camelCase for the JS object
    supplier: { name: string };
    warehouse: { name: string };
    status: 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
    orderDate: string;
    totalAmount: string | number;
}

const fetchPurchaseOrders = async (): Promise<PO[]> => {
    const { data } = await api.get('/purchase-orders');
    return data.data ?? data;
};

const currencyFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

function getStatusBadge(status: string) {
    switch (status) {
        case 'draft':
            return <Badge variant="outline" className="border-[#D9CBB0] text-[#5C4033] bg-[#FBF8F2]">Draft</Badge>;
        case 'approved':
            return <Badge className="bg-[#E4DAC6] text-[#6B4A3E] hover:bg-[#D9CBB0]">Approved</Badge>;
        case 'partially_received':
            return <Badge className="bg-[#B8863B] text-white hover:bg-[#A07028]">Partially Received</Badge>;
        case 'received':
            return <Badge className="bg-[#3D2621] text-[#FBF8F2] hover:bg-[#2B1B17]">Received</Badge>;
        default:
            return <Badge variant="secondary" className="capitalize">{status.replace('_', ' ')}</Badge>;
    }
}

export default function PurchaseOrdersPage() {
    const [search, setSearch] = useState('');
    const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data: pos, isLoading, isError } = useQuery({
        queryKey: ['purchase-orders'],
        queryFn: fetchPurchaseOrders,
    });

    const filteredPOs = (pos || []).filter(
        (po) =>
            po.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
            po.supplier?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#3D2621]">Purchase Orders</h1>
                    <p className="text-sm text-[#A08A72]">Manage procurement and receive inventory.</p>
                </div>
                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-[#6B352A] text-[#FBF8F2] hover:bg-[#5A2C22]"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create PO
                </Button>
            </div>

            <Card className="p-4 bg-[#FBF8F2] border-[#E4DAC6]">
                <div className="relative max-w-sm mb-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A08A72]" />
                    <Input
                        placeholder="Search POs..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border-[#D9CBB0] bg-white pl-9 focus-visible:ring-[#B8863B]"
                    />
                </div>

                <div className="overflow-hidden rounded-md border border-[#E4DAC6]">
                    <Table>
                        <TableHeader className="bg-[#F0E7D3]">
                            <TableRow className="border-[#E4DAC6] hover:bg-transparent">
                                <TableHead className="font-semibold text-[#5C4033]">PO Number</TableHead>
                                <TableHead className="font-semibold text-[#5C4033]">Supplier</TableHead>
                                <TableHead className="font-semibold text-[#5C4033]">Warehouse</TableHead>
                                <TableHead className="font-semibold text-[#5C4033]">Date</TableHead>
                                <TableHead className="font-semibold text-[#5C4033]">Status</TableHead>
                                <TableHead className="font-semibold text-[#5C4033] text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-[#A08A72]">
                                        Loading purchase orders...
                                    </TableCell>
                                </TableRow>
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-[#8C2E27]">
                                        Couldn't load purchase orders.
                                    </TableCell>
                                </TableRow>
                            ) : filteredPOs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-[#A08A72]">
                                        No purchase orders found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPOs.map((po) => (
                                    <TableRow
                                        key={po.id}
                                        className="cursor-pointer border-[#EFE7D6] hover:bg-[#F5EFE3]"
                                        onClick={() => setSelectedPoId(po.id)}
                                    >
                                        <TableCell className="font-medium text-[#3D2621]">
                                            <div className="flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-[#A08A72]" />
                                                {po.poNumber}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[#5C4033]">{po.supplier?.name}</TableCell>
                                        <TableCell className="text-[#5C4033]">{po.warehouse?.name}</TableCell>
                                        <TableCell className="text-[#5C4033]">
                                            {new Date(po.orderDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(po.status)}</TableCell>
                                        <TableCell className="text-right font-medium text-[#3D2621]">
                                            {currencyFormat.format(Number(po.totalAmount))}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {selectedPoId && (
                <ReceiveGoodsModal
                    poId={selectedPoId}
                    open={!!selectedPoId}
                    onOpenChange={(open) => !open && setSelectedPoId(null)}
                />
            )}

            <CreatePurchaseOrderModal 
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />
        </div>
    );
}
