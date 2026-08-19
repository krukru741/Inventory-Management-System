import { useState, useEffect } from 'react';
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
    /** Pass a customer to edit; omit for create mode */
    customer?: any;
}

const inputCls = 'border-[#D9CBB0] bg-white focus-visible:ring-[#B8863B]';
const labelCls = 'text-[#8B6355] text-sm font-medium';

export default function CustomerFormModal({ open, onOpenChange, customer }: Props) {
    const qc = useQueryClient();
    const isEdit = !!customer;

    const [form, setForm] = useState({
        name: '',
        code: '',
        contactPerson: '',
        email: '',
        phone: '',
        addressLine1: '',
        city: '',
        state: '',
        country: '',
        creditLimit: 0,
        paymentTerms: 30,
        currency: 'USD',
        notes: '',
    });

    useEffect(() => {
        if (open) {
            setForm({
                name: customer?.name ?? '',
                code: customer?.code ?? '',
                contactPerson: customer?.contactPerson ?? '',
                email: customer?.email ?? '',
                phone: customer?.phone ?? '',
                addressLine1: customer?.addressLine1 ?? '',
                city: customer?.city ?? '',
                state: customer?.state ?? '',
                country: customer?.country ?? '',
                creditLimit: customer?.creditLimit ?? 0,
                paymentTerms: customer?.paymentTerms ?? 30,
                currency: customer?.currency ?? 'USD',
                notes: customer?.notes ?? '',
            });
            setError(null);
        }
    }, [open, customer]);

    const [error, setError] = useState<string | null>(null);

    const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            if (isEdit) {
                const { data } = await api.patch(`/customers/${customer.id}`, payload);
                return data;
            }
            const { data } = await api.post('/customers', payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['customers'] });
            onOpenChange(false);
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message ?? 'Failed to save customer.');
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
            creditLimit: Number(form.creditLimit),
            paymentTerms: Number(form.paymentTerms),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FBF8F2] border-[#E4DAC6]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#3D2621]">
                        {isEdit ? 'Edit Customer' : 'New Customer'}
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
                                    onChange={e => set('name', e.target.value)} placeholder="Customer name" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Code <span className="text-red-500">*</span></Label>
                                <Input className={inputCls} value={form.code}
                                    onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. CUST-001" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Contact Person</Label>
                                <Input className={inputCls} value={form.contactPerson}
                                    onChange={e => set('contactPerson', e.target.value)} placeholder="Full name" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Email</Label>
                                <Input type="email" className={inputCls} value={form.email}
                                    onChange={e => set('email', e.target.value)} placeholder="customer@email.com" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Phone</Label>
                                <Input className={inputCls} value={form.phone}
                                    onChange={e => set('phone', e.target.value)} placeholder="+1 555 0000" />
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

                    {/* Commercial Terms */}
                    <div className="space-y-4 pt-4 border-t border-[#E4DAC6]">
                        <h3 className="text-sm font-semibold text-[#5C4033] uppercase tracking-wide">Commercial Terms</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Credit Limit</Label>
                                <Input type="number" min="0" step="100" className={inputCls}
                                    value={form.creditLimit} onChange={e => set('creditLimit', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Payment Terms (days)</Label>
                                <Input type="number" min="0" className={inputCls}
                                    value={form.paymentTerms} onChange={e => set('paymentTerms', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Currency</Label>
                                <Input className={inputCls} value={form.currency}
                                    onChange={e => set('currency', e.target.value.toUpperCase())} placeholder="USD" maxLength={3} />
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
                            {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Customer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
