import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
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
import CreateProductModal from '@/components/CreateProductModal';

interface ItemRow {
    id: string; // temp id for ui
    productId: string;
    productSearch: string;
    isDropdownOpen: boolean;
    orderedQty: number;
    unitCost: number;
}

const currencyFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

interface CreatePurchaseOrderModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreatePurchaseOrderModal({ open, onOpenChange }: CreatePurchaseOrderModalProps) {
    const queryClient = useQueryClient();

    const [supplierId, setSupplierId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<ItemRow[]>([
        { id: crypto.randomUUID(), productId: '', productSearch: '', isDropdownOpen: false, orderedQty: 1, unitCost: 0 }
    ]);

    const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
    const [targetRowIdForNewProduct, setTargetRowIdForNewProduct] = useState<string | null>(null);

    const { data: suppliers } = useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => {
            const { data } = await api.get('/suppliers');
            return data.data ?? data;
        },
        enabled: open,
    });

    const { data: warehouses } = useQuery({
        queryKey: ['warehouses'],
        queryFn: async () => {
            const { data } = await api.get('/warehouses');
            return data.data ?? data;
        },
        enabled: open,
    });

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data } = await api.get('/products');
            return data.data ?? data;
        },
        enabled: open,
    });

    const createMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/purchase-orders', payload);
            return data.data ?? data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            resetForm();
            onOpenChange(false);
        },
    });

    const resetForm = () => {
        setSupplierId('');
        setWarehouseId('');
        setNotes('');
        setItems([{ id: crypto.randomUUID(), productId: '', productSearch: '', isDropdownOpen: false, orderedQty: 1, unitCost: 0 }]);
    };

    const handleAddItem = () => {
        setItems([...items, { id: crypto.randomUUID(), productId: '', productSearch: '', isDropdownOpen: false, orderedQty: 1, unitCost: 0 }]);
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter((item) => item.id !== id));
    };

    const handleItemChange = (id: string, field: keyof ItemRow, value: any) => {
        setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
    };

    const handleProductSelect = (id: string, product: any) => {
        setItems(items.map((item) => 
            item.id === id 
            ? { 
                ...item, 
                productId: product.id, 
                productSearch: `${product.sku} - ${product.name}`,
                isDropdownOpen: false,
                unitCost: Number(product.costPrice || 0) 
              } 
            : item
        ));
    };

    const handleNewProductSuccess = (newProduct: any) => {
        if (targetRowIdForNewProduct) {
            handleProductSelect(targetRowIdForNewProduct, newProduct);
            setTargetRowIdForNewProduct(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || !warehouseId || items.some(i => !i.productId || i.orderedQty <= 0)) {
            alert('Please fill out all required fields and select valid products from the list.');
            return;
        }

        const payload = {
            supplierId,
            warehouseId,
            notes,
            items: items.map(i => ({
                productId: i.productId,
                orderedQty: Number(i.orderedQty),
                unitCost: Number(i.unitCost),
            })),
        };

        createMutation.mutate(payload);
    };

    const totalOrderAmount = items.reduce((acc, item) => acc + (item.orderedQty * item.unitCost), 0);

    return (
        <>
        <Dialog 
            open={open} 
            onOpenChange={(isOpen) => {
                if (!isOpen) resetForm();
                onOpenChange(isOpen);
            }}
        >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#FBF8F2] border-[#E4DAC6]" onClick={() => {
                // Close dropdowns if clicking outside
                setItems(items.map(item => ({ ...item, isDropdownOpen: false })));
            }}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#3D2621]">New Purchase Order</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <Label className="text-[#8B6355]">Supplier</Label>
                            <select 
                                className="w-full flex h-10 w-full rounded-md border border-[#D9CBB0] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8863B] focus-visible:ring-offset-2"
                                value={supplierId}
                                onChange={(e) => setSupplierId(e.target.value)}
                                required
                            >
                                <option value="" disabled>Select supplier...</option>
                                {(suppliers || []).map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[#8B6355]">Destination Warehouse</Label>
                            <select 
                                className="w-full flex h-10 w-full rounded-md border border-[#D9CBB0] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8863B] focus-visible:ring-offset-2"
                                value={warehouseId}
                                onChange={(e) => setWarehouseId(e.target.value)}
                                required
                            >
                                <option value="" disabled>Select warehouse...</option>
                                {(warehouses || []).map((w: any) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-[#8B6355]">Notes (Optional)</Label>
                        <Input
                            placeholder="Order references or special instructions..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="border-[#D9CBB0]"
                        />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-[#E4DAC6]">
                        <h2 className="font-semibold text-[#5C4033]">Line Items</h2>
                        
                        {items.map((item) => {
                            const filteredProducts = (products || []).filter((p: any) => 
                                `${p.sku} ${p.name}`.toLowerCase().includes(item.productSearch.toLowerCase())
                            );

                            return (
                            <div key={item.id} className="flex flex-wrap md:flex-nowrap gap-4 items-start bg-white p-4 rounded-md border border-[#EFE7D6]">
                                <div className="flex-1 w-full md:w-auto space-y-1.5 relative" onClick={(e) => e.stopPropagation()}>
                                    <Label className="text-[#8B6355]">Product</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Search product..."
                                            value={item.productSearch}
                                            onChange={(e) => {
                                                handleItemChange(item.id, 'productSearch', e.target.value);
                                                handleItemChange(item.id, 'productId', ''); // Reset ID if they type
                                                handleItemChange(item.id, 'isDropdownOpen', true);
                                            }}
                                            onClick={() => handleItemChange(item.id, 'isDropdownOpen', true)}
                                            className="border-[#D9CBB0]"
                                            required
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            title="Add New Product"
                                            className="border-[#D9CBB0] text-[#5C4033] hover:bg-[#F5EFE3] shrink-0"
                                            onClick={() => {
                                                setTargetRowIdForNewProduct(item.id);
                                                setIsCreateProductOpen(true);
                                            }}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {item.isDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-[#D9CBB0] rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {filteredProducts.length === 0 ? (
                                                <div className="p-2 text-sm text-[#A08A72]">No products found.</div>
                                            ) : (
                                                filteredProducts.map((p: any) => (
                                                    <div 
                                                        key={p.id}
                                                        className="p-2 text-sm hover:bg-[#F5EFE3] cursor-pointer text-[#3D2621]"
                                                        onClick={() => handleProductSelect(item.id, p)}
                                                    >
                                                        <span className="font-medium">{p.sku}</span> - {p.name}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="w-24 space-y-1.5">
                                    <Label className="text-[#8B6355]">Qty</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={item.orderedQty}
                                        onChange={(e) => handleItemChange(item.id, 'orderedQty', e.target.value)}
                                        className="border-[#D9CBB0]"
                                        required
                                    />
                                </div>

                                <div className="w-32 space-y-1.5">
                                    <Label className="text-[#8B6355]">Unit Cost</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.unitCost}
                                        onChange={(e) => handleItemChange(item.id, 'unitCost', e.target.value)}
                                        className="border-[#D9CBB0]"
                                        required
                                    />
                                </div>

                                <div className="w-24 pt-8 text-right">
                                    <span className="text-sm font-medium text-[#3D2621]">
                                        {currencyFormat.format(item.orderedQty * item.unitCost)}
                                    </span>
                                </div>

                                {items.length > 1 && (
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="mt-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )})}

                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleAddItem}
                            className="w-full border-[#D9CBB0] text-[#5C4033] hover:bg-[#F5EFE3]"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </div>

                    <DialogFooter className="pt-6 border-t border-[#E4DAC6] flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center">
                            <span className="font-medium text-[#5C4033] mr-4">Estimated Total:</span>
                            <span className="text-xl font-bold text-[#3D2621]">
                                {currencyFormat.format(totalOrderAmount)}
                            </span>
                        </div>
                        
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => onOpenChange(false)}
                                className="w-full sm:w-auto border-[#D9CBB0] text-[#5C4033]"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                className="w-full sm:w-auto bg-[#6B352A] text-[#FBF8F2] hover:bg-[#5A2C22]"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? 'Creating...' : 'Create Order'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <CreateProductModal 
            open={isCreateProductOpen}
            onOpenChange={setIsCreateProductOpen}
            onSuccessCb={handleNewProductSuccess}
        />
        </>
    );
}
