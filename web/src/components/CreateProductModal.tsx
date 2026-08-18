import { useState } from 'react';
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

interface CreateProductModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccessCb?: (newProduct: any) => void;
}

export default function CreateProductModal({ open, onOpenChange, onSuccessCb }: CreateProductModalProps) {
    const queryClient = useQueryClient();

    const [sku, setSku] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [costPrice, setCostPrice] = useState('0');
    const [sellPrice, setSellPrice] = useState('0');
    const [categoryId, setCategoryId] = useState('');

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await api.get('/categories');
            return data.data ?? data;
        },
        enabled: open,
    });

    const createMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/products', payload);
            return data.data ?? data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            resetForm();
            onOpenChange(false);
            if (onSuccessCb) {
                onSuccessCb(data);
            }
        },
    });

    const resetForm = () => {
        setSku('');
        setName('');
        setDescription('');
        setCostPrice('0');
        setSellPrice('0');
        setCategoryId('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!sku || !name) {
            alert('SKU and Name are required.');
            return;
        }

        const payload = {
            sku,
            name,
            description: description || undefined,
            costPrice: Number(costPrice),
            sellPrice: Number(sellPrice),
            categoryId: categoryId || undefined,
        };

        createMutation.mutate(payload);
    };

    return (
        <Dialog 
            open={open} 
            onOpenChange={(isOpen) => {
                if (!isOpen) resetForm();
                onOpenChange(isOpen);
            }}
        >
            <DialogContent className="max-w-xl bg-[#FBF8F2] border-[#E4DAC6]" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#3D2621]">New Product</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[#8B6355]">SKU *</Label>
                            <Input
                                placeholder="e.g. SKU-12345"
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                                className="border-[#D9CBB0]"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[#8B6355]">Name *</Label>
                            <Input
                                placeholder="Product Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="border-[#D9CBB0]"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[#8B6355]">Cost Price</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={costPrice}
                                onChange={(e) => setCostPrice(e.target.value)}
                                className="border-[#D9CBB0]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[#8B6355]">Sell Price</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={sellPrice}
                                onChange={(e) => setSellPrice(e.target.value)}
                                className="border-[#D9CBB0]"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-[#8B6355]">Category</Label>
                            <select 
                                className="w-full flex h-10 w-full rounded-md border border-[#D9CBB0] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8863B] focus-visible:ring-offset-2"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                            >
                                <option value="">Select category... (optional)</option>
                                {(categories || []).map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <Label className="text-[#8B6355]">Description</Label>
                            <Input
                                placeholder="Optional description..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="border-[#D9CBB0]"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-6 border-t border-[#E4DAC6] flex gap-2 sm:justify-end">
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
                            className="bg-[#6B352A] text-[#FBF8F2] hover:bg-[#5A2C22]"
                            disabled={createMutation.isPending}
                        >
                            {createMutation.isPending ? 'Saving...' : 'Save Product'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
