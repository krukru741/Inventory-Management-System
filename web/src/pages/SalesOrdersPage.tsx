import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, ShoppingBag } from 'lucide-react';

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
import CreateSalesOrderModal from '@/components/CreateSalesOrderModal';
import ShipOrderModal from '@/components/ShipOrderModal';

interface SalesOrder {
    id: string;
    soNumber: string;
    customer: { name: string } | null;
    warehouse: { name: string } | null;
    status: 'draft' | 'confirmed' | 'partially_shipped' | 'shipped' | 'cancelled';
    orderDate: string;
    totalAmount: string | number;
    items: any[];
}

const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function getStatusBadge(status: string) {
    switch (status) {
        case 'draft':
            return <Badge variant="outline" className="border-[#D9CBB0] text-[#5C4033] bg-[#FBF8F2]">Draft</Badge>;
        case 'confirmed':
            return <Badge className="bg-[#DFF0E8] text-[#3D6B50] border border-[#A4CDB8] hover:bg-[#cce8d8]">Confirmed</Badge>;
        case 'partially_shipped':
            return <Badge className="bg-[#FFF4DC] text-[#B8863B] border border-[#E9C97B] hover:bg-[#ffefc0]">Partially Shipped</Badge>;
        case 'shipped':
            return <Badge className="bg-[#3D2621] text-[#FBF8F2] hover:bg-[#2B1B17]">Shipped</Badge>;
        case 'cancelled':
            return <Badge className="bg-red-100 text-red-700 border border-red-300 hover:bg-red-100">Cancelled</Badge>;
        default:
            return <Badge variant="secondary" className="capitalize">{status.replace(/_/g, ' ')}</Badge>;
    }
}

export default function SalesOrdersPage() {
    const [search, setSearch] = useState('');
    const [selectedSoId, setSelectedSoId] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data: orders, isLoading, isError } = useQuery<SalesOrder[]>({
        queryKey: ['sales-orders'],
        queryFn: async () => {
            const { data } = await api.get('/sales-orders');
            return data.data ?? data;
        },
    });

    const filtered = (orders ?? []).filter(so =>
        so.soNumber?.toLowerCase().includes(search.toLowerCase()) ||
        so.customer?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#3D2621]">Sales Orders</h1>
                    <p className="text-sm text-[#A08A72]">Create and manage customer orders, confirm and ship.</p>
                </div>
                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-[#3D6B50] text-white hover:bg-[#2F5440]"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Create SO
                </Button>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['draft', 'confirmed', 'partially_shipped', 'shipped'] as const).map(status => {
                    const count = (orders ?? []).filter(o => o.status === status).length;
                    return (
                        <Card key={status} className="p-4 bg-[#FBF8F2] border-[#E4DAC6]">
                            <p className="text-xs text-[#A08A72] uppercase tracking-wide mb-1">{status.replace(/_/g, ' ')}</p>
                            <p className="text-2xl font-bold text-[#3D2621]">{count}</p>
                        </Card>
                    );
                })}
            </div>

            {/* Table */}
            <Card className="p-4 bg-[#FBF8F2] border-[#E4DAC6]">
                <div className="relative max-w-sm mb-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A08A72]" />
                    <Input
                        placeholder="Search by SO number or customer..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="border-[#D9CBB0] bg-white pl-9 focus-visible:ring-[#3D6B50]"
                    />
                </div>

                <div className="overflow-hidden rounded-md border border-[#E4DAC6]">
                    <Table>
                        <TableHeader className="bg-[#F0E7D3]">
                            <TableRow className="border-[#E4DAC6] hover:bg-transparent">
                                <TableHead className="font-semibold text-[#5C4033]">SO Number</TableHead>
                                <TableHead className="font-semibold text-[#5C4033]">Customer</TableHead>
                                <TableHead className="font-semibold text-[#5C4033]">Warehouse</TableHead>
                                <TableHead className="font-semibold text-[#5C4033]">Date</TableHead>
                                <TableHead className="font-semibold text-[#5C4033]">Items</TableHead>
                                <TableHead className="font-semibold text-[#5C4033]">Status</TableHead>
                                <TableHead className="font-semibold text-[#5C4033] text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-[#A08A72]">
                                        Loading sales orders…
                                    </TableCell>
                                </TableRow>
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-[#8C2E27]">
                                        Couldn't load sales orders.
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-[#A08A72]">
                                            <ShoppingBag className="h-10 w-10 opacity-30" />
                                            <p className="font-medium">No sales orders yet.</p>
                                            <Button
                                                size="sm"
                                                onClick={() => setIsCreateOpen(true)}
                                                className="bg-[#3D6B50] text-white hover:bg-[#2F5440]"
                                            >
                                                <Plus className="mr-1 h-4 w-4" /> Create your first SO
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map(so => (
                                    <TableRow
                                        key={so.id}
                                        className="cursor-pointer border-[#EFE7D6] hover:bg-[#F5EFE3]"
                                        onClick={() => setSelectedSoId(so.id)}
                                    >
                                        <TableCell className="font-medium text-[#3D2621]">
                                            <div className="flex items-center gap-2">
                                                <ShoppingBag className="h-4 w-4 text-[#A08A72]" />
                                                {so.soNumber}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[#5C4033]">{so.customer?.name ?? '—'}</TableCell>
                                        <TableCell className="text-[#5C4033]">{so.warehouse?.name ?? '—'}</TableCell>
                                        <TableCell className="text-[#5C4033]">
                                            {so.orderDate ? new Date(so.orderDate).toLocaleDateString() : '—'}
                                        </TableCell>
                                        <TableCell className="text-[#5C4033]">{so.items?.length ?? 0} item(s)</TableCell>
                                        <TableCell>{getStatusBadge(so.status)}</TableCell>
                                        <TableCell className="text-right font-medium text-[#3D2621]">
                                            {currencyFormat.format(Number(so.totalAmount))}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modals */}
            <CreateSalesOrderModal open={isCreateOpen} onOpenChange={setIsCreateOpen} />

            {selectedSoId && (
                <ShipOrderModal
                    soId={selectedSoId}
                    open={!!selectedSoId}
                    onOpenChange={open => { if (!open) setSelectedSoId(null); }}
                />
            )}
        </div>
    );
}
