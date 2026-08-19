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
import ProductFormModal from '@/components/ProductFormModal';

interface SoItemRow {
    id: string;
    productId: string;
    productSearch: string;
    isDropdownOpen: boolean;
    orderedQty: number;
    unitPrice: number;
    discountPct: number; // stored as whole number e.g. 5 = 5%, sent as 0.05 to API
    taxRate: number;     // stored as whole number e.g. 8 = 8%, sent as 0.08 to API
}

const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const emptyRow = (): SoItemRow => ({
    id: crypto.randomUUID(),
    productId: '',
    productSearch: '',
    isDropdownOpen: false,
    orderedQty: 1,
    unitPrice: 0,
    discountPct: 0,
    taxRate: 0,
});

export default function CreateSalesOrderModal({ open, onOpenChange }: Props) {
    const queryClient = useQueryClient();

    const [customerId, setCustomerId] = useState('');
    const [warehouseId, setWarehouseId] = useState('');
    const [shipToName, setShipToName] = useState('');
    const [shipToLine1, setShipToLine1] = useState('');
    const [shipToCity, setShipToCity] = useState('');
    const [customerPoRef, setCustomerPoRef] = useState('');
    const [notes, setNotes] = useState('');
    const [shippingCost, setShippingCost] = useState(0);
    const [items, setItems] = useState<SoItemRow[]>([emptyRow()]);
    const [error, setError] = useState<string | null>(null);

    const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);
    const [targetRowIdForNewProduct, setTargetRowIdForNewProduct] = useState<string | null>(null);

    const { data: customers } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const { data } = await api.get('/customers');
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
        enabled: open,
    });

    const { data: warehouses } = useQuery({
        queryKey: ['warehouses'],
        queryFn: async () => {
            const { data } = await api.get('/warehouses');
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
        enabled: open,
    });

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data } = await api.get('/products');
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
        enabled: open,
    });

    const createMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/sales-orders', payload);
            return data.data ?? data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
            resetForm();
            onOpenChange(false);
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message ?? 'Failed to create sales order.');
        },
    });

    const resetForm = () => {
        setCustomerId('');
        setWarehouseId('');
        setShipToName('');
        setShipToLine1('');
        setShipToCity('');
        setCustomerPoRef('');
        setNotes('');
        setShippingCost(0);
        setItems([emptyRow()]);
        setError(null);
    };

    const handleItemChange = (id: string, field: keyof SoItemRow, value: any) => {
        setItems(items.map(item => (item.id === id ? { ...item, [field]: value } : item)));
    };

    const handleProductSelect = (rowId: string, product: any) => {
        setItems(items.map(item =>
            item.id === rowId
                ? {
                    ...item,
                    productId: product.id,
                    productSearch: `${product.sku} - ${product.name}`,
                    isDropdownOpen: false,
                    unitPrice: Number(product.sellPrice ?? product.sell_price ?? 0),
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

    const lineTotal = (item: SoItemRow) => {
        const base = item.orderedQty * item.unitPrice;
        const afterDiscount = base * (1 - item.discountPct / 100);
        return afterDiscount * (1 + item.taxRate / 100);
    };

    const subtotal = items.reduce((acc, i) => acc + i.orderedQty * i.unitPrice * (1 - i.discountPct / 100), 0);
    const taxTotal = items.reduce((acc, i) => acc + i.orderedQty * i.unitPrice * (1 - i.discountPct / 100) * (i.taxRate / 100), 0);
    const grandTotal = subtotal + taxTotal + shippingCost;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!customerId || !warehouseId) { setError('Please select a customer and warehouse.'); return; }
        if (items.some(i => !i.productId || i.orderedQty <= 0)) {
            setError('All line items must have a product and a quantity greater than 0.');
            return;
        }

        createMutation.mutate({
            customerId,
            warehouseId,
            shipToName: shipToName || undefined,
            shipToLine1: shipToLine1 || undefined,
            shipToCity: shipToCity || undefined,
            customerPoRef: customerPoRef || undefined,
            notes: notes || undefined,
            shippingCost: Number(shippingCost) || 0,
            items: items.map(i => ({
                productId: i.productId,
                orderedQty: Number(i.orderedQty),
                unitPrice: Number(i.unitPrice),
                discountPct: Number(i.discountPct) / 100,   // convert % → decimal (5 → 0.05)
                taxRate: Number(i.taxRate) / 100,            // convert % → decimal (8 → 0.08)
            })),
        });
    };

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(isOpen) => {
                    if (!isOpen) resetForm();
                    onOpenChange(isOpen);
                }}
            >
                <DialogContent
                    className="max-w-5xl max-h-[90vh] overflow-y-auto bg-[#FBF8F2] border-[#E4DAC6]"
                    onClick={() => setItems(items.map(i => ({ ...i, isDropdownOpen: false })))}
                >
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#3D2621]">New Sales Order</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        {/* Order Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[#8B6355]">Customer <span className="text-red-500">*</span></Label>
                                <select
                                    className="w-full flex h-10 rounded-md border border-[#D9CBB0] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8863B]"
                                    value={customerId}
                                    onChange={e => setCustomerId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select customer...</option>
                                    {(customers || []).map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[#8B6355]">Ship From Warehouse <span className="text-red-500">*</span></Label>
                                <select
                                    className="w-full flex h-10 rounded-md border border-[#D9CBB0] bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8863B]"
                                    value={warehouseId}
                                    onChange={e => setWarehouseId(e.target.value)}
                                    required
                                >
                                    <option value="" disabled>Select warehouse...</option>
                                    {(warehouses || []).map((w: any) => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[#8B6355]">Ship To (Name)</Label>
                                <Input
                                    placeholder="Recipient name..."
                                    value={shipToName}
                                    onChange={e => setShipToName(e.target.value)}
                                    className="border-[#D9CBB0]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[#8B6355]">Ship To (Address)</Label>
                                <Input
                                    placeholder="Street address..."
                                    value={shipToLine1}
                                    onChange={e => setShipToLine1(e.target.value)}
                                    className="border-[#D9CBB0]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[#8B6355]">City</Label>
                                <Input
                                    placeholder="City..."
                                    value={shipToCity}
                                    onChange={e => setShipToCity(e.target.value)}
                                    className="border-[#D9CBB0]"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[#8B6355]">Customer PO Reference</Label>
                                <Input
                                    placeholder="Customer's own PO number..."
                                    value={customerPoRef}
                                    onChange={e => setCustomerPoRef(e.target.value)}
                                    className="border-[#D9CBB0]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-[#8B6355]">Notes (Optional)</Label>
                            <Input
                                placeholder="Special instructions..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="border-[#D9CBB0]"
                            />
                        </div>

                        {/* Line Items */}
                        <div className="space-y-4 pt-4 border-t border-[#E4DAC6]">
                            <h2 className="font-semibold text-[#5C4033]">Line Items</h2>

                            {items.map(item => {
                                const filtered = (products || []).filter((p: any) =>
                                    `${p.sku} ${p.name}`.toLowerCase().includes(item.productSearch.toLowerCase())
                                );
                                return (
                                    <div key={item.id} className="flex flex-wrap md:flex-nowrap gap-3 items-start bg-white p-4 rounded-md border border-[#EFE7D6]">
                                        {/* Product Search */}
                                        <div className="flex-1 min-w-0 space-y-1.5 relative" onClick={e => e.stopPropagation()}>
                                            <Label className="text-[#8B6355]">Product</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Search product..."
                                                    value={item.productSearch}
                                                    onChange={e => {
                                                        handleItemChange(item.id, 'productSearch', e.target.value);
                                                        handleItemChange(item.id, 'productId', '');
                                                        handleItemChange(item.id, 'isDropdownOpen', true);
                                                    }}
                                                    onClick={() => handleItemChange(item.id, 'isDropdownOpen', true)}
                                                    className="border-[#D9CBB0]"
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
                                                    {filtered.length === 0 ? (
                                                        <div className="p-2 text-sm text-[#A08A72]">No products found.</div>
                                                    ) : filtered.map((p: any) => (
                                                        <div
                                                            key={p.id}
                                                            className="p-2 text-sm hover:bg-[#F5EFE3] cursor-pointer text-[#3D2621]"
                                                            onClick={() => handleProductSelect(item.id, p)}
                                                        >
                                                            <span className="font-medium">{p.sku}</span> — {p.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-20 space-y-1.5 shrink-0">
                                            <Label className="text-[#8B6355]">Qty</Label>
                                            <Input type="number" min="1" value={item.orderedQty}
                                                onChange={e => handleItemChange(item.id, 'orderedQty', e.target.value)}
                                                className="border-[#D9CBB0]" />
                                        </div>

                                        <div className="w-28 space-y-1.5 shrink-0">
                                            <Label className="text-[#8B6355]">Unit Price</Label>
                                            <Input type="number" min="0" step="0.01" value={item.unitPrice}
                                                onChange={e => handleItemChange(item.id, 'unitPrice', e.target.value)}
                                                className="border-[#D9CBB0]" />
                                        </div>

                                        <div className="w-20 space-y-1.5 shrink-0">
                                            <Label className="text-[#8B6355]">Disc %</Label>
                                            <Input type="number" min="0" max="100" step="0.1" placeholder="0"
                                                value={item.discountPct}
                                                onChange={e => handleItemChange(item.id, 'discountPct', e.target.value)}
                                                className="border-[#D9CBB0]" />
                                        </div>

                                        <div className="w-20 space-y-1.5 shrink-0">
                                            <Label className="text-[#8B6355]">Tax %</Label>
                                            <Input type="number" min="0" max="100" step="0.1" placeholder="0"
                                                value={item.taxRate}
                                                onChange={e => handleItemChange(item.id, 'taxRate', e.target.value)}
                                                className="border-[#D9CBB0]" />
                                        </div>

                                        <div className="w-24 pt-8 text-right shrink-0">
                                            <span className="text-sm font-medium text-[#3D2621]">
                                                {currencyFormat.format(lineTotal(item))}
                                            </span>
                                        </div>

                                        {items.length > 1 && (
                                            <Button type="button" variant="ghost" size="icon"
                                                onClick={() => setItems(items.filter(i => i.id !== item.id))}
                                                className="mt-6 text-red-500 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}

                            <Button type="button" variant="outline" onClick={() => setItems([...items, emptyRow()])}
                                className="w-full border-dashed border-[#D9CBB0] text-[#5C4033] hover:bg-[#F5EFE3]">
                                <Plus className="mr-2 h-4 w-4" /> Add Item
                            </Button>
                        </div>

                        {/* Summary */}
                        <div className="pt-4 border-t border-[#E4DAC6] space-y-2">
                            <div className="flex justify-between text-sm text-[#8B6355]">
                                <span>Subtotal</span>
                                <span>{currencyFormat.format(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-[#8B6355]">
                                <span>Tax</span>
                                <span>{currencyFormat.format(taxTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-[#8B6355] items-center">
                                <span>Shipping Cost</span>
                                <Input
                                    type="number" min="0" step="0.01"
                                    value={shippingCost}
                                    onChange={e => setShippingCost(Number(e.target.value))}
                                    className="w-32 border-[#D9CBB0] text-right"
                                />
                            </div>
                            <div className="flex justify-between font-bold text-lg text-[#3D2621] pt-2 border-t border-[#E4DAC6]">
                                <span>Grand Total</span>
                                <span>{currencyFormat.format(grandTotal)}</span>
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>
                        )}

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="border-[#D9CBB0] text-[#5C4033]">
                                Cancel
                            </Button>
                            <Button type="submit"
                                className="bg-[#3D6B50] text-white hover:bg-[#2F5440]"
                                disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creating...' : 'Save as Draft'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ProductFormModal
                open={isCreateProductOpen}
                onOpenChange={setIsCreateProductOpen}
                onSuccessCb={handleNewProductSuccess}
            />
        </>
    );
}
