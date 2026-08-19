import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Package, History, ArrowRightLeft, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProductFormModal from '@/components/ProductFormModal';
import ProductHistoryModal from '@/components/ProductHistoryModal';

interface Product {
    id: string;
    sku: string;
    name: string;
    description?: string;
    costPrice?: number;
    sellPrice?: number;
    isActive: boolean;
    category?: { name: string };
}

const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export default function ProductsPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [historyFor, setHistoryFor] = useState<Product | null>(null);

    const { data: res, isLoading, isError } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const { data } = await api.get('/products');
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
    });

    const products: Product[] = res ?? [];

    const toggleStatusMutation = useMutation({
        mutationFn: async (prod: Product) => {
            // we use the patch endpoint for partial updates
            const { data } = await api.patch(`/products/${prod.id}`, { isActive: !prod.isActive });
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
    });

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#3D2621]">Product Catalog</h1>
                    <p className="text-[#8B6355] text-sm mt-1">Manage master data for all items.</p>
                </div>
                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-[#6B352A] hover:bg-[#5A2C22] text-white"
                >
                    <Plus className="w-4 h-4 mr-2" /> New Product
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-[#E4DAC6] shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B6355]" />
                    <Input
                        placeholder="Search SKU or Name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 border-[#D9CBB0] focus-visible:ring-[#B8863B]"
                    />
                </div>
                <div className="text-sm text-[#8B6355]">
                    {filtered.length} product{filtered.length !== 1 && 's'} found
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-[#8B6355]">Loading catalog...</div>
            ) : isError ? (
                <div className="text-center py-12 text-red-500">Failed to load catalog.</div>
            ) : filtered.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-[#D9CBB0] rounded-lg bg-[#FBF8F2]">
                    <Package className="w-12 h-12 text-[#B8863B] mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-[#3D2621]">No products found</h3>
                    <p className="text-[#8B6355] mt-1">Try adjusting your search or create a new product.</p>
                </div>
            ) : (
                <div className="bg-white border border-[#E4DAC6] rounded-lg shadow-sm overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F5EEDC] text-[#5C4033] font-semibold uppercase text-xs tracking-wider border-b border-[#E4DAC6]">
                            <tr>
                                <th className="px-4 py-3">SKU</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3 text-right">Cost Price</th>
                                <th className="px-4 py-3 text-right">Sell Price</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0E6D2]">
                            {filtered.map(p => (
                                <tr key={p.id} className="hover:bg-[#FBF8F2] transition-colors">
                                    <td className="px-4 py-3 font-medium text-[#3D2621]">{p.sku}</td>
                                    <td className="px-4 py-3 text-[#5C4033]">{p.name}</td>
                                    <td className="px-4 py-3 text-[#8B6355]">{p.category?.name || '-'}</td>
                                    <td className="px-4 py-3 text-right text-[#5C4033]">{p.costPrice != null ? currencyFormat.format(p.costPrice) : '-'}</td>
                                    <td className="px-4 py-3 text-right text-[#5C4033]">{p.sellPrice != null ? currencyFormat.format(p.sellPrice) : '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                        {p.isActive ? (
                                            <Badge className="bg-[#DFF0E8] text-[#3D6B50] hover:bg-[#cce8d8] text-[10px]">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[10px]">Inactive</Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setHistoryFor(p)}
                                            className="text-[#8B6355] hover:text-[#3D2621] hover:bg-[#EADFC7] h-8 w-8"
                                            title="Stock Movement History"
                                        >
                                            <History className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setEditProduct(p)}
                                            className="text-[#8B6355] hover:text-[#3D2621] hover:bg-[#EADFC7] h-8 w-8"
                                            title="Edit Product"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if(confirm(`Are you sure you want to ${p.isActive ? 'deactivate' : 'activate'} this product?`)) {
                                                    toggleStatusMutation.mutate(p);
                                                }
                                            }}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                            title={p.isActive ? 'Deactivate' : 'Activate'}
                                        >
                                            <ArrowRightLeft className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ProductFormModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />

            {editProduct && (
                <ProductFormModal
                    open={!!editProduct}
                    onOpenChange={(o) => !o && setEditProduct(null)}
                    product={editProduct}
                />
            )}

            {historyFor && (
                <ProductHistoryModal
                    open={!!historyFor}
                    onOpenChange={(o) => !o && setHistoryFor(null)}
                    product={historyFor}
                />
            )}
        </div>
    );
}
