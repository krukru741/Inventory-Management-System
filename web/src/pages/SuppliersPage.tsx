import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus, Search, Building2, Phone, Mail, Globe,
    Pencil, PowerOff, ChevronRight, Clock, Package,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import SupplierFormModal from '@/components/SupplierFormModal';

interface Supplier {
    id: string;
    name: string;
    code: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    website?: string;
    city?: string;
    country?: string;
    leadTimeDays?: number;
    paymentTermsDays?: number;
    currency?: string;
    minOrderValue?: number;
    isActive: boolean;
    createdAt: string;
}

interface SupplierProduct {
    id: string;
    sku: string;
    name: string;
    supplierSku?: string;
    unitCost?: number;
    leadTimeDays?: number;
    isPreferred?: boolean;
    category?: { name: string };
}

const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function SuppliersPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
    const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);

    const { data: res, isLoading, isError } = useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => {
            const { data } = await api.get('/suppliers', { params: { limit: 200 } });
            return data;
        },
    });

    const suppliers: Supplier[] = (res?.data ?? res ?? []);

    const { data: supplierProducts, isLoading: loadingProducts } = useQuery({
        queryKey: ['supplier-products', viewSupplier?.id],
        queryFn: async () => {
            const { data } = await api.get(`/suppliers/${viewSupplier!.id}/products`);
            return (data.data ?? data) as SupplierProduct[];
        },
        enabled: !!viewSupplier,
    });

    const deactivateMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/suppliers/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
    });

    const filtered = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    );

    const activeCount = suppliers.filter(s => s.isActive).length;
    const inactiveCount = suppliers.length - activeCount;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#3D2621]">Suppliers</h1>
                    <p className="text-sm text-[#A08A72]">Manage your vendor and supplier directory.</p>
                </div>
                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-[#6B352A] text-white hover:bg-[#5A2C22]"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Supplier
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-[#FBF8F2] border-[#E4DAC6]">
                    <p className="text-xs text-[#A08A72] uppercase tracking-wide mb-1">Total Suppliers</p>
                    <p className="text-2xl font-bold text-[#3D2621]">{suppliers.length}</p>
                </Card>
                <Card className="p-4 bg-[#FBF8F2] border-[#E4DAC6]">
                    <p className="text-xs text-[#A08A72] uppercase tracking-wide mb-1">Active</p>
                    <p className="text-2xl font-bold text-[#3D6B50]">{activeCount}</p>
                </Card>
                <Card className="p-4 bg-[#FBF8F2] border-[#E4DAC6]">
                    <p className="text-xs text-[#A08A72] uppercase tracking-wide mb-1">Inactive</p>
                    <p className="text-2xl font-bold text-[#A08A72]">{inactiveCount}</p>
                </Card>
            </div>

            {/* Search + Cards */}
            <div className="space-y-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A08A72]" />
                    <Input
                        placeholder="Search suppliers..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="border-[#D9CBB0] bg-white pl-9 focus-visible:ring-[#B8863B]"
                    />
                </div>

                {isLoading ? (
                    <div className="py-16 text-center text-[#A08A72]">Loading suppliers…</div>
                ) : isError ? (
                    <div className="py-16 text-center text-red-600">Couldn't load suppliers.</div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-3 text-[#A08A72]">
                        <Building2 className="h-12 w-12 opacity-25" />
                        <p className="font-medium">No suppliers yet.</p>
                        <Button size="sm" onClick={() => setIsCreateOpen(true)}
                            className="bg-[#6B352A] text-white hover:bg-[#5A2C22]">
                            <Plus className="mr-1 h-4 w-4" /> Add your first supplier
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map(s => (
                            <Card key={s.id}
                                className={`bg-[#FBF8F2] border-[#E4DAC6] hover:shadow-md transition-shadow ${!s.isActive ? 'opacity-60' : ''}`}>
                                <CardContent className="p-5 space-y-4">
                                    {/* Card header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-[#3D2621] truncate">{s.name}</p>
                                                {!s.isActive && (
                                                    <Badge variant="outline" className="shrink-0 text-xs text-[#A08A72] border-[#D9CBB0]">Inactive</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs font-mono text-[#A08A72] mt-0.5">{s.code}</p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <Button size="icon" variant="ghost"
                                                className="h-7 w-7 text-[#A08A72] hover:text-[#3D2621] hover:bg-[#F0E7D3]"
                                                onClick={() => setEditSupplier(s)}
                                                title="Edit">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            {s.isActive && (
                                                <Button size="icon" variant="ghost"
                                                    className="h-7 w-7 text-[#A08A72] hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => {
                                                        if (confirm(`Deactivate ${s.name}?`)) deactivateMutation.mutate(s.id);
                                                    }}
                                                    title="Deactivate">
                                                    <PowerOff className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contact info */}
                                    <div className="space-y-1.5 text-sm text-[#5C4033]">
                                        {s.contactPerson && (
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-3.5 w-3.5 text-[#A08A72] shrink-0" />
                                                <span className="truncate">{s.contactPerson}</span>
                                            </div>
                                        )}
                                        {s.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3.5 w-3.5 text-[#A08A72] shrink-0" />
                                                <a href={`mailto:${s.email}`} className="truncate hover:underline">{s.email}</a>
                                            </div>
                                        )}
                                        {s.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5 text-[#A08A72] shrink-0" />
                                                <span className="truncate">{s.phone}</span>
                                            </div>
                                        )}
                                        {s.website && (
                                            <div className="flex items-center gap-2">
                                                <Globe className="h-3.5 w-3.5 text-[#A08A72] shrink-0" />
                                                <a href={s.website} target="_blank" rel="noopener noreferrer"
                                                    className="truncate hover:underline text-[#6B352A]">
                                                    {s.website.replace(/^https?:\/\//, '')}
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Terms strip */}
                                    <div className="flex items-center gap-3 pt-2 border-t border-[#EFE7D6] text-xs text-[#A08A72]">
                                        {s.leadTimeDays !== undefined && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>{s.leadTimeDays}d lead</span>
                                            </div>
                                        )}
                                        {s.paymentTermsDays !== undefined && (
                                            <span>Net {s.paymentTermsDays}</span>
                                        )}
                                        {s.currency && (
                                            <span className="font-mono">{s.currency}</span>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="ml-auto h-6 px-2 text-xs text-[#6B352A] hover:bg-[#F0E7D3]"
                                            onClick={() => setViewSupplier(s)}
                                        >
                                            <Package className="mr-1 h-3 w-3" />
                                            Products
                                            <ChevronRight className="ml-0.5 h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Supplier Products Drawer */}
            {viewSupplier && (
                <Dialog open={!!viewSupplier} onOpenChange={open => { if (!open) setViewSupplier(null); }}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#FBF8F2] border-[#E4DAC6]">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-[#3D2621]">
                                {viewSupplier.name} — Products
                            </DialogTitle>
                        </DialogHeader>

                        {loadingProducts ? (
                            <div className="py-8 text-center text-[#A08A72]">Loading…</div>
                        ) : !supplierProducts?.length ? (
                            <div className="py-8 text-center text-[#A08A72]">
                                <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                <p>No products linked to this supplier yet.</p>
                                <p className="text-xs mt-1">Link products via Purchasing when creating a PO.</p>
                            </div>
                        ) : (
                            <div className="rounded-md border border-[#E4DAC6] overflow-hidden mt-2">
                                <table className="w-full text-sm">
                                    <thead className="bg-[#F0E7D3]">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-[#5C4033] font-semibold">Product</th>
                                            <th className="px-4 py-2 text-left text-[#5C4033] font-semibold">Supplier SKU</th>
                                            <th className="px-4 py-2 text-right text-[#5C4033] font-semibold">Unit Cost</th>
                                            <th className="px-4 py-2 text-right text-[#5C4033] font-semibold">Lead (days)</th>
                                            <th className="px-4 py-2 text-center text-[#5C4033] font-semibold">Preferred</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supplierProducts.map(p => (
                                            <tr key={p.id} className="border-t border-[#EFE7D6]">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-[#3D2621]">{p.name}</p>
                                                    <p className="text-xs text-[#A08A72]">{p.sku}</p>
                                                </td>
                                                <td className="px-4 py-3 text-[#5C4033] font-mono text-xs">
                                                    {p.supplierSku ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-[#3D2621] font-medium">
                                                    {p.unitCost != null ? currencyFormat.format(Number(p.unitCost)) : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right text-[#5C4033]">
                                                    {p.leadTimeDays ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {p.isPreferred
                                                        ? <span className="text-[#3D6B50] font-medium">★ Yes</span>
                                                        : <span className="text-[#D9CBB0]">—</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            )}

            {/* Create / Edit Modals */}
            <SupplierFormModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />

            {editSupplier && (
                <SupplierFormModal
                    open={!!editSupplier}
                    onOpenChange={open => { if (!open) setEditSupplier(null); }}
                    supplier={editSupplier}
                />
            )}
        </div>
    );
}
