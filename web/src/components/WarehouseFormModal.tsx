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
    /** Pass a warehouse to edit; omit for create mode */
    warehouse?: any;
}

const inputCls = 'border-[#D9CBB0] bg-white focus-visible:ring-[#B8863B]';
const labelCls = 'text-[#8B6355] text-sm font-medium';

export default function WarehouseFormModal({ open, onOpenChange, warehouse }: Props) {
    const qc = useQueryClient();
    const isEdit = !!warehouse;

    const [form, setForm] = useState({
        name: '',
        code: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        phone: '',
        email: '',
    });

    useEffect(() => {
        if (open) {
            setForm({
                name: warehouse?.name ?? '',
                code: warehouse?.code ?? '',
                addressLine1: warehouse?.addressLine1 ?? '',
                addressLine2: warehouse?.addressLine2 ?? '',
                city: warehouse?.city ?? '',
                state: warehouse?.state ?? '',
                postalCode: warehouse?.postalCode ?? '',
                country: warehouse?.country ?? '',
                phone: warehouse?.phone ?? '',
                email: warehouse?.email ?? '',
            });
            setError(null);
        }
    }, [open, warehouse]);

    const [error, setError] = useState<string | null>(null);

    const set = (field: string, value: any) => setForm(f => ({ ...f, [field]: value }));

    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            if (isEdit) {
                const { data } = await api.patch(`/warehouses/${warehouse.id}`, payload);
                return data;
            }
            const { data } = await api.post('/warehouses', payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['warehouses'] });
            onOpenChange(false);
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message ?? 'Failed to save warehouse.');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!form.name.trim() || !form.code.trim()) {
            setError('Name and Code are required.');
            return;
        }
        mutation.mutate(form);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FBF8F2] border-[#E4DAC6]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#3D2621]">
                        {isEdit ? 'Edit Warehouse' : 'New Warehouse'}
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
                                    onChange={e => set('name', e.target.value)} placeholder="Main Warehouse" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Code <span className="text-red-500">*</span></Label>
                                <Input className={inputCls} value={form.code}
                                    onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. WH-01" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Contact Phone</Label>
                                <Input className={inputCls} value={form.phone}
                                    onChange={e => set('phone', e.target.value)} placeholder="+1 555 0000" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Contact Email</Label>
                                <Input type="email" className={inputCls} value={form.email}
                                    onChange={e => set('email', e.target.value)} placeholder="warehouse@email.com" />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-4 pt-4 border-t border-[#E4DAC6]">
                        <h3 className="text-sm font-semibold text-[#5C4033] uppercase tracking-wide">Location</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                                <Label className={labelCls}>Address Line 1</Label>
                                <Input className={inputCls} value={form.addressLine1}
                                    onChange={e => set('addressLine1', e.target.value)} placeholder="Street address" />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label className={labelCls}>Address Line 2</Label>
                                <Input className={inputCls} value={form.addressLine2}
                                    onChange={e => set('addressLine2', e.target.value)} placeholder="Suite, unit, etc." />
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
                                <Label className={labelCls}>Postal Code</Label>
                                <Input className={inputCls} value={form.postalCode}
                                    onChange={e => set('postalCode', e.target.value)} placeholder="Zip code" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className={labelCls}>Country</Label>
                                <Input className={inputCls} value={form.country}
                                    onChange={e => set('country', e.target.value)} placeholder="Country" />
                            </div>
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
                            {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Warehouse'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
