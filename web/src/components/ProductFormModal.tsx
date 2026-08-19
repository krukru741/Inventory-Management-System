import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

interface ProductFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccessCb?: (newProduct: any) => void;
    product?: any;
}

export default function ProductFormModal({ open, onOpenChange, onSuccessCb, product }: ProductFormModalProps) {
    const queryClient = useQueryClient();
    const isEdit = !!product;

    const [sku, setSku] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [costPrice, setCostPrice] = useState('0');
    const [sellPrice, setSellPrice] = useState('0');
    const [categoryId, setCategoryId] = useState('');

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setSku(product?.sku ?? '');
            setName(product?.name ?? '');
            setDescription(product?.description ?? '');
            setCostPrice(String(product?.costPrice ?? '0'));
            setSellPrice(String(product?.sellPrice ?? '0'));
            setCategoryId(product?.categoryId ?? '');
            setError(null);
        }
    }, [open, product]);

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await api.get('/products/categories');
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
        enabled: open,
    });

    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            if (isEdit) {
                const { data } = await api.patch(`/products/${product.id}`, payload);
                return data;
            }
            const { data } = await api.post('/products', payload);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            onOpenChange(false);
            if (onSuccessCb) onSuccessCb(data);
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message ?? 'Failed to save product.');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (!sku || !name || !categoryId) {
            setError('SKU, Name, and Category are required.');
            return;
        }

        mutation.mutate({
            sku,
            name,
            description: description || undefined,
            costPrice: parseFloat(costPrice),
            sellPrice: parseFloat(sellPrice),
            categoryId,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-[#FBF8F2] border-[#E4DAC6]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#3D2621]">
                        {isEdit ? 'Edit Product' : 'Add New Product'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-1.5">
                        <Label className="text-[#8B6355]">SKU <span className="text-red-500">*</span></Label>
                        <Input 
                            className="border-[#D9CBB0] bg-white focus-visible:ring-[#B8863B]"
                            value={sku} 
                            onChange={e => setSku(e.target.value.toUpperCase())} 
                            placeholder="e.g. LAP-01"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[#8B6355]">Name <span className="text-red-500">*</span></Label>
                        <Input 
                            className="border-[#D9CBB0] bg-white focus-visible:ring-[#B8863B]"
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="e.g. ThinkPad X1"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[#8B6355]">Category <span className="text-red-500">*</span></Label>
                        <select 
                            className="w-full flex h-10 w-full rounded-md border border-[#D9CBB0] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8863B] focus-visible:ring-offset-2"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                        >
                            <option value="" disabled>Select category...</option>
                            {(categories || []).map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[#8B6355]">Description</Label>
                        <Input 
                            className="border-[#D9CBB0] bg-white focus-visible:ring-[#B8863B]"
                            value={description} 
                            onChange={e => setDescription(e.target.value)} 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[#8B6355]">Cost Price</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                className="border-[#D9CBB0] bg-white focus-visible:ring-[#B8863B]"
                                value={costPrice} 
                                onChange={e => setCostPrice(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[#8B6355]">Sell Price</Label>
                            <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                className="border-[#D9CBB0] bg-white focus-visible:ring-[#B8863B]"
                                value={sellPrice} 
                                onChange={e => setSellPrice(e.target.value)} 
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>
                    )}

                    <DialogFooter className="mt-4 gap-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            className="border-[#D9CBB0] text-[#5C4033]"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={mutation.isPending}
                            className="bg-[#6B352A] text-white hover:bg-[#5A2C22]"
                        >
                            {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
