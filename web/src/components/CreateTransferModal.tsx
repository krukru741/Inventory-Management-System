import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateTransferModal({ open, onOpenChange }: Props) {
    const qc = useQueryClient();

    const [fromLocationId, setFromLocationId] = useState('');
    const [toLocationId, setToLocationId] = useState('');
    const [items, setItems] = useState<any[]>([
        { id: '1', productId: '', quantity: 1 }
    ]);
    const [error, setError] = useState<string | null>(null);

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            const { data } = await api.get('/warehouses/locations');
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
        enabled: open,
    });

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data } = await api.get('/products', { params: { limit: 500 } });
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
        enabled: open,
    });

    const createMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/transfers', payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['transfers'] });
            onOpenChange(false);
            setFromLocationId('');
            setToLocationId('');
            setItems([{ id: '1', productId: '', quantity: 1 }]);
            setError(null);
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message ?? 'Failed to create transfer.');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!fromLocationId || !toLocationId) {
            setError('Please select both source and destination locations.');
            return;
        }

        if (fromLocationId === toLocationId) {
            setError('Source and destination cannot be the same.');
            return;
        }

        const validItems = items.filter(i => i.productId && i.quantity > 0);
        if (validItems.length === 0) {
            setError('Please add at least one valid product with quantity > 0.');
            return;
        }

        createMutation.mutate({
            fromLocationId,
            toLocationId,
            items: validItems.map(i => ({
                productId: i.productId,
                quantity: Number(i.quantity)
            }))
        });
    };

    const addItem = () => {
        setItems(prev => [...prev, { id: Date.now().toString(), productId: '', quantity: 1 }]);
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const updateItem = (id: string, field: string, value: any) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-[#FBF8F2] border-[#E4DAC6]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#3D2621]">New Stock Transfer</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[#8B6355]">Source Location <span className="text-red-500">*</span></Label>
                            <select
                                value={fromLocationId}
                                onChange={(e) => setFromLocationId(e.target.value)}
                                className="w-full h-10 rounded-md border border-[#D9CBB0] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8863B]"
                            >
                                <option value="">Select source...</option>
                                {(locations || []).map((loc: any) => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.warehouse?.name} - {loc.code}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[#8B6355]">Destination Location <span className="text-red-500">*</span></Label>
                            <select
                                value={toLocationId}
                                onChange={(e) => setToLocationId(e.target.value)}
                                className="w-full h-10 rounded-md border border-[#D9CBB0] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8863B]"
                            >
                                <option value="">Select destination...</option>
                                {(locations || []).map((loc: any) => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.warehouse?.name} - {loc.code}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[#8B6355]">Items to Transfer</Label>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={addItem}
                                className="h-8 border-[#D9CBB0] text-[#5C4033]"
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add Item
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-start gap-2">
                                    <div className="flex-1">
                                        <select
                                            value={item.productId}
                                            onChange={(e) => updateItem(item.id, 'productId', e.target.value)}
                                            className="w-full h-10 rounded-md border border-[#D9CBB0] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8863B]"
                                        >
                                            <option value="">Select product...</option>
                                            {(products || []).map((p: any) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.sku} - {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                                            className="border-[#D9CBB0]"
                                            placeholder="Qty"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeItem(item.id)}
                                        className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        disabled={items.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>
                    )}

                    <DialogFooter className="mt-6 gap-2 border-t border-[#E4DAC6] pt-4">
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
                            disabled={createMutation.isPending}
                            className="bg-[#6B352A] text-white hover:bg-[#5A2C22]"
                        >
                            {createMutation.isPending ? 'Saving...' : 'Create Transfer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
