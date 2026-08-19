import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, PowerOff, Users, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import CustomerFormModal from '@/components/CustomerFormModal';

interface Customer {
    id: string;
    name: string;
    code: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    city?: string;
    country?: string;
    creditLimit?: number;
    paymentTerms?: number;
    currency?: string;
    isActive: boolean;
}

const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function CustomersPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

    const { data: res, isLoading, isError } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const { data } = await api.get('/customers', { params: { limit: 200 } });
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
    });

    const customers: Customer[] = res ?? [];

    const deactivateMutation = useMutation({
        mutationFn: async (id: string) => api.delete(`/customers/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
    });

    const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );

    const activeCount = customers.filter(c => c.isActive).length;
    const inactiveCount = customers.length - activeCount;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#3D2621]">Customers</h1>
                    <p className="text-sm text-[#A08A72]">Manage buyers and set credit limits.</p>
                </div>
                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-[#6B352A] text-white hover:bg-[#5A2C22]"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Customer
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 bg-[#FBF8F2] border-[#E4DAC6]">
                    <p className="text-xs text-[#A08A72] uppercase tracking-wide mb-1">Total Customers</p>
                    <p className="text-2xl font-bold text-[#3D2621]">{customers.length}</p>
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

            {/* Content area */}
            <Card className="bg-[#FBF8F2] border-[#E4DAC6]">
                <CardContent className="p-0">
                    <div className="p-4 border-b border-[#E4DAC6]">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A08A72]" />
                            <Input
                                placeholder="Search customers..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="border-[#D9CBB0] bg-white pl-9 focus-visible:ring-[#B8863B]"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="py-16 text-center text-[#A08A72]">Loading customers…</div>
                    ) : isError ? (
                        <div className="py-16 text-center text-red-600">Couldn't load customers.</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 flex flex-col items-center gap-3 text-[#A08A72]">
                            <Users className="h-12 w-12 opacity-25" />
                            <p className="font-medium">No customers yet.</p>
                            <Button size="sm" onClick={() => setIsCreateOpen(true)}
                                className="bg-[#6B352A] text-white hover:bg-[#5A2C22]">
                                <Plus className="mr-1 h-4 w-4" /> Add your first customer
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-[#F0E7D3] border-b border-[#E4DAC6]">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-[#5C4033]">Customer</th>
                                        <th className="px-4 py-3 text-left font-semibold text-[#5C4033]">Contact</th>
                                        <th className="px-4 py-3 text-left font-semibold text-[#5C4033]">Location</th>
                                        <th className="px-4 py-3 text-right font-semibold text-[#5C4033]">Credit Limit</th>
                                        <th className="px-4 py-3 text-right font-semibold text-[#5C4033]">Terms</th>
                                        <th className="px-4 py-3 text-right font-semibold text-[#5C4033]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(c => (
                                        <tr key={c.id} className={`border-b border-[#EFE7D6] hover:bg-[#F5EEDF] ${!c.isActive ? 'opacity-60 bg-[#EFE7D6]/50' : ''}`}>
                                            <td className="px-4 py-3 align-top">
                                                <div className="font-bold text-[#3D2621] flex items-center gap-2">
                                                    {c.name}
                                                    {!c.isActive && <Badge variant="outline" className="text-[10px] text-[#A08A72] border-[#D9CBB0] h-4 px-1">Inactive</Badge>}
                                                </div>
                                                <div className="text-xs font-mono text-[#A08A72]">{c.code}</div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="text-[#3D2621] font-medium">{c.contactPerson || '—'}</div>
                                                <div className="flex flex-col gap-0.5 mt-0.5 text-xs text-[#A08A72]">
                                                    {c.email && (
                                                        <div className="flex items-center gap-1 hover:text-[#6B352A]">
                                                            <Mail className="h-3 w-3" /> <a href={`mailto:${c.email}`}>{c.email}</a>
                                                        </div>
                                                    )}
                                                    {c.phone && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" /> <span>{c.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top text-[#5C4033]">
                                                {c.city || c.country ? [c.city, c.country].filter(Boolean).join(', ') : '—'}
                                            </td>
                                            <td className="px-4 py-3 align-top text-right text-[#3D2621] font-medium">
                                                {c.creditLimit ? currencyFormat.format(c.creditLimit) : '—'}
                                            </td>
                                            <td className="px-4 py-3 align-top text-right text-[#5C4033]">
                                                {c.paymentTerms ? `Net ${c.paymentTerms}` : '—'}
                                            </td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button size="icon" variant="ghost"
                                                        className="h-8 w-8 text-[#A08A72] hover:text-[#3D2621] hover:bg-[#E4DAC6]"
                                                        onClick={() => setEditCustomer(c)}
                                                        title="Edit">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    {c.isActive && (
                                                        <Button size="icon" variant="ghost"
                                                            className="h-8 w-8 text-[#A08A72] hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => {
                                                                if (confirm(`Deactivate ${c.name}?`)) deactivateMutation.mutate(c.id);
                                                            }}
                                                            title="Deactivate">
                                                            <PowerOff className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CustomerFormModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />

            {editCustomer && (
                <CustomerFormModal
                    open={!!editCustomer}
                    onOpenChange={open => { if (!open) setEditCustomer(null); }}
                    customer={editCustomer}
                />
            )}
        </div>
    );
}
