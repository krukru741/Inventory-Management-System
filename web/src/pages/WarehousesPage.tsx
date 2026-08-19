import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, MapPin, Building2, Package, ArrowRightLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import WarehouseFormModal from '@/components/WarehouseFormModal';
import ManageLocationsModal from '@/components/ManageLocationsModal';

interface Warehouse {
    id: string;
    name: string;
    code: string;
    addressLine1?: string;
    city?: string;
    country?: string;
    phone?: string;
    isActive: boolean;
    _count?: {
        locations: number;
    };
}

export default function WarehousesPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editWarehouse, setEditWarehouse] = useState<Warehouse | null>(null);
    const [manageLocationsFor, setManageLocationsFor] = useState<string | null>(null);

    const { data: res, isLoading, isError } = useQuery({
        queryKey: ['warehouses'],
        queryFn: async () => {
            const { data } = await api.get('/warehouses');
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
    });

    const warehouses: Warehouse[] = res ?? [];

    const deactivateMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/warehouses/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['warehouses'] }),
    });

    const filtered = warehouses.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.code.toLowerCase().includes(search.toLowerCase()) ||
        w.city?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-[#3D2621]">Warehouses</h1>
                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-[#6B352A] hover:bg-[#5A2C22] text-white"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Warehouse
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-[#E4DAC6] shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B6355]" />
                    <Input
                        placeholder="Search warehouses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 border-[#D9CBB0] focus-visible:ring-[#B8863B]"
                    />
                </div>
                <div className="text-sm text-[#8B6355]">
                    {filtered.length} warehouse{filtered.length !== 1 && 's'} found
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-[#FBF8F2] animate-pulse rounded-lg border border-[#E4DAC6]"></div>
                    ))}
                </div>
            ) : isError ? (
                <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg border border-red-100">
                    Failed to load warehouses. Please try again.
                </div>
            ) : filtered.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-[#D9CBB0] rounded-lg bg-[#FBF8F2]">
                    <Building2 className="w-12 h-12 text-[#B8863B] mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-[#3D2621]">No warehouses found</h3>
                    <p className="text-[#8B6355] mt-1">Try adjusting your search or add a new warehouse.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map(w => (
                        <div key={w.id} className="flex flex-col bg-white rounded-lg shadow-sm border border-[#E4DAC6] overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-[#3D2621]">{w.name}</h3>
                                            {!w.isActive && <Badge variant="secondary" className="bg-gray-100 text-gray-600">Inactive</Badge>}
                                        </div>
                                        <Badge className="bg-[#E4DAC6] text-[#5C4033] hover:bg-[#D9CBB0] uppercase tracking-wide text-[10px]">
                                            {w.code}
                                        </Badge>
                                    </div>
                                    <div className="p-2 bg-[#F5EEDC] rounded-full">
                                        <Building2 className="w-5 h-5 text-[#8B6355]" />
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm text-[#5C4033]">
                                    {(w.addressLine1 || w.city || w.country) && (
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-[#B8863B] shrink-0 mt-0.5" />
                                            <span>
                                                {[w.addressLine1, w.city, w.country].filter(Boolean).join(', ')}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 pt-2 border-t border-[#F0E6D2]">
                                        <Package className="w-4 h-4 text-[#8B6355]" />
                                        <span className="font-medium">{w._count?.locations ?? 0} Bins/Locations</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-[#FBF8F2] p-3 border-t border-[#E4DAC6] flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-[#D9CBB0] text-[#5C4033] hover:bg-[#F5EEDC]"
                                    onClick={() => setManageLocationsFor(w.id)}
                                >
                                    Manage Bins
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-[#D9CBB0] text-[#5C4033] hover:bg-[#F5EEDC]"
                                    onClick={() => setEditWarehouse(w)}
                                >
                                    Edit
                                </Button>
                                {w.isActive && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => {
                                            if (confirm('Deactivate this warehouse?')) deactivateMutation.mutate(w.id);
                                        }}
                                    >
                                        Deactivate
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <WarehouseFormModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />

            {editWarehouse && (
                <WarehouseFormModal
                    open={!!editWarehouse}
                    onOpenChange={(o) => !o && setEditWarehouse(null)}
                    warehouse={editWarehouse}
                />
            )}

            <ManageLocationsModal
                warehouseId={manageLocationsFor}
                open={!!manageLocationsFor}
                onOpenChange={(o) => !o && setManageLocationsFor(null)}
            />
        </div>
    );
}
