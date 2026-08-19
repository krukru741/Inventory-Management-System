import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Pass a supplier to edit; omit for create mode */
    supplier?: any;
}

const inputCls = 'border-[#D9CBB0] bg-white focus-visible:ring-[#B8863B]';
const labelCls = 'text-[#8B6355] text-sm font-medium';

export default function SupplierFormModal({ open, onOpenChange, supplier }: Props) {
    const qc = useQueryClient();
    const isEdit = !!supplier;

    const [form, setForm] = useState({
        name: supplier?.name ?? '',
        code: supplier?.code ?? '',
        contactPerson: supplier?.contactPerson ?? '',
        email: supplier?.email ?? '',
        phone: supplier?.phone ?? '',
        website: supplier?.website ?? '',
        addressLine1: supplier?.addressLine1 ?? '',
        city: supplier?.city ?? '',
        state: supplier?.state ?? '',
        country: supplier?.country ?? '',
        leadTimeDays: supplier?.leadTimeDays ?? 0,
        paymentTermsDays: supplier?.paymentTermsDays ?? 30,
        currency: supplier?.currency ?? 'USD',
        minOrderValue: supplier?.minOrderValue ?? 0,
        notes: supplier?.notes ?? '',
    });

    const [error, setError] = useState<string | null>(null);

    const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            if (isEdit) {
                const { data } = await api.patch(`/suppliers/${supplier.id}`, payload);
                return data;
            }
            const { data } = await api.post('/suppliers', payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['suppliers'] });
            onOpenChange(false);
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message ?? 'Failed to save supplier.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!form.name.trim() || !form.code.trim()) {
            setError('Name and Code are required.');
            return;
        }
        mutation.mutate({
            ...form,
            leadTimeDays: Number(form.leadTimeDays),
            paymentTermsDays: Number(form.paymentTermsDays),
            minOrderValue: Number(form.minOrderValue),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FBF8F2] border-[#E4DAC6]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#3D2621]">
                        {isEdit ? 'Edit Supplier' : 'New Supplier'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-2">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-[#5C4033] uppercase tracking-wide">Basic Info</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Name <span className="text-red-500">*</span></Label>
                                <Input className={inputCls} value={form.name}
                                    onChange={e => set('name', e.target.value)} placeholder="Supplier name" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Code <span className="text-red-500">*</span></Label>
                                <Input className={inputCls} value={form.code}
                                    onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. ACME" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Contact Person</Label>
                                <Input className={inputCls} value={form.contactPerson}
                                    onChange={e => set('contactPerson', e.target.value)} placeholder="Full name" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Email</Label>
                                <Input type="email" className={inputCls} value={form.email}
                                    onChange={e => set('email', e.target.value)} placeholder="supplier@email.com" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Phone</Label>
                                <Input className={inputCls} value={form.phone}
                                    onChange={e => set('phone', e.target.value)} placeholder="+1 555 0000" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Website</Label>
                                <Input className={inputCls} value={form.website}
                                    onChange={e => set('website', e.target.value)} placeholder="https://..." />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4 pt-4 border-t border-[#E4DAC6]">
                        <h3 className="text-sm font-semibold text-[#5C4033] uppercase tracking-wide">Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                                <Label className={labelCls}>Address Line</Label>
                                <Input className={inputCls} value={form.addressLine1}
                                    onChange={e => set('addressLine1', e.target.value)} placeholder="Street address" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>City</Label>
                                <Input className={inputCls} value={form.city}
                                    onChange={e => set('city', e.target.value)} placeholder="City" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>State / Province</Label>
                                <Input className={inputCls} value={form.state}
                                    onChange={e => set('state', e.target.value)} placeholder="State" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Country</Label>
                                <Input className={inputCls} value={form.country}
                                    onChange={e => set('country', e.target.value)} placeholder="Philippines" />
                            </div>
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="space-y-4 pt-4 border-t border-[#E4DAC6]">
                        <h3 className="text-sm font-semibold text-[#5C4033] uppercase tracking-wide">Commercial Terms</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Lead Time (days)</Label>
                                <Input type="number" min="0" className={inputCls}
                                    value={form.leadTimeDays} onChange={e => set('leadTimeDays', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Payment Terms (days)</Label>
                                <Input type="number" min="0" className={inputCls}
                                    value={form.paymentTermsDays} onChange={e => set('paymentTermsDays', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Currency</Label>
                                <Input className={inputCls} value={form.currency}
                                    onChange={e => set('currency', e.target.value.toUpperCase())} placeholder="USD" maxLength={3} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Min. Order Value</Label>
                                <Input type="number" min="0" step="0.01" className={inputCls}
                                    value={form.minOrderValue} onChange={e => set('minOrderValue', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className={labelCls}>Notes</Label>
                            <Input className={inputCls} value={form.notes}
                                onChange={e => set('notes', e.target.value)} placeholder="Any special notes..." />
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>
                    )}

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}
                            className="border-[#D9CBB0] text-[#5C4033]">Cancel</Button>
                        <Button type="submit"
                            className="bg-[#6B352A] text-white hover:bg-[#5A2C22]"
                            disabled={mutation.isPending}>
                            {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Supplier'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
