import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, ArrowRightLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CreateTransferModal from '@/components/CreateTransferModal';
import { format } from 'date-fns';

interface Transfer {
    id: string;
    referenceNumber: string;
    sourceLocation: { code: string; warehouse: { name: string } };
    destinationLocation: { code: string; warehouse: { name: string } };
    status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
    transferDate: string;
    items: any[];
}

export default function TransfersPage() {
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data: res, isLoading, isError } = useQuery({
        queryKey: ['transfers'],
        queryFn: async () => {
            const { data } = await api.get('/inventory/transfers'); // Assuming this is the endpoint based on common patterns
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
    });

    const transfers: Transfer[] = res ?? [];

    const filtered = transfers.filter(t =>
        t.referenceNumber?.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="border-[#D9CBB0] text-[#5C4033] bg-[#FBF8F2]">Pending</Badge>;
            case 'in_transit':
                return <Badge className="bg-[#B8863B] text-white hover:bg-[#A07028]">In Transit</Badge>;
            case 'completed':
                return <Badge className="bg-[#A9C4A0] text-[#3F6B37] hover:bg-[#97B88E]">Completed</Badge>;
            case 'cancelled':
                return <Badge variant="secondary" className="bg-gray-100 text-gray-500">Cancelled</Badge>;
            default:
                return <Badge variant="secondary" className="uppercase">{status.replace('_', ' ')}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#3D2621]">Stock Transfers</h1>
                    <p className="text-[#8B6355] text-sm mt-1">Move inventory between warehouses and bins.</p>
                </div>
                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-[#6B352A] hover:bg-[#5A2C22] text-white"
                >
                    <Plus className="w-4 h-4 mr-2" /> New Transfer
                </Button>
            </div>

            <Card className="bg-[#FBF8F2] border-[#E4DAC6]">
                <CardContent className="p-0">
                    <div className="p-4 border-b border-[#E4DAC6]">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A08A72]" />
                            <Input
                                placeholder="Search reference number..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="border-[#D9CBB0] bg-white pl-9 focus-visible:ring-[#B8863B]"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="py-16 text-center text-[#A08A72]">Loading transfers…</div>
                    ) : isError ? (
                        <div className="py-16 text-center text-red-600">Couldn't load transfers.</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <ArrowRightLeft className="mx-auto h-12 w-12 text-[#D9CBB0] mb-3" />
                            <p className="text-[#8B6355]">No stock transfers found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#F0E7D3] text-[#5C4033] uppercase text-xs tracking-wider border-b border-[#E4DAC6]">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Reference</th>
                                        <th className="px-6 py-3 font-semibold">Date</th>
                                        <th className="px-6 py-3 font-semibold">Source</th>
                                        <th className="px-6 py-3 font-semibold">Destination</th>
                                        <th className="px-6 py-3 font-semibold">Items</th>
                                        <th className="px-6 py-3 font-semibold">Status</th>
                                        <th className="px-6 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E4DAC6] bg-white">
                                    {filtered.map(t => (
                                        <tr key={t.id} className="hover:bg-[#FBF8F2] transition-colors">
                                            <td className="px-6 py-4 font-medium text-[#3D2621]">{t.referenceNumber}</td>
                                            <td className="px-6 py-4 text-[#8B6355]">
                                                {t.transferDate ? format(new Date(t.transferDate), 'MMM d, yyyy') : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-[#5C4033]">
                                                <div className="font-medium">{t.sourceLocation?.warehouse?.name}</div>
                                                <div className="text-xs text-[#8B6355]">{t.sourceLocation?.code}</div>
                                            </td>
                                            <td className="px-6 py-4 text-[#5C4033]">
                                                <div className="font-medium">{t.destinationLocation?.warehouse?.name}</div>
                                                <div className="text-xs text-[#8B6355]">{t.destinationLocation?.code}</div>
                                            </td>
                                            <td className="px-6 py-4 text-[#5C4033]">{t.items?.length ?? 0} item(s)</td>
                                            <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-[#6B352A] hover:bg-[#EADFC7] hover:text-[#3D2621]"
                                                >
                                                    View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isCreateOpen && (
                <CreateTransferModal
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                />
            )}
        </div>
    );
}
