import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderTree, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

interface Category {
    id: string;
    name: string;
    description?: string;
    _count?: {
        products: number;
    }
}

export default function CategoriesPage() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);

    const { data: res, isLoading, isError } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await api.get('/products/categories');
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
    });

    const categories: Category[] = res ?? [];

    const createMutation = useMutation({
        mutationFn: async (payload: { name: string; description?: string }) => {
            const { data } = await api.post('/products/categories', payload);
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['categories'] });
            setIsCreateOpen(false);
            setName('');
            setDescription('');
            setError(null);
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message ?? 'Failed to create category.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { data } = await api.delete(`/products/categories/${id}`);
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!name.trim()) {
            setError('Category name is required.');
            return;
        }
        createMutation.mutate({ name, description: description || undefined });
    };

    const filtered = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#3D2621]">Categories</h1>
                    <p className="text-[#8B6355] text-sm mt-1">Organize your product catalog.</p>
                </div>
                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-[#6B352A] hover:bg-[#5A2C22] text-white"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Category
                </Button>
            </div>

            <Card className="bg-[#FBF8F2] border-[#E4DAC6]">
                <CardContent className="p-0">
                    <div className="p-4 border-b border-[#E4DAC6]">
                        <div className="relative max-w-sm">
                            <FolderTree className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A08A72]" />
                            <Input
                                placeholder="Search categories..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="border-[#D9CBB0] bg-white pl-9 focus-visible:ring-[#B8863B]"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="py-16 text-center text-[#A08A72]">Loading categories…</div>
                    ) : isError ? (
                        <div className="py-16 text-center text-red-600">Couldn't load categories.</div>
                    ) : filtered.length === 0 ? (
                        <div className="py-16 text-center">
                            <FolderTree className="mx-auto h-12 w-12 text-[#D9CBB0] mb-3" />
                            <p className="text-[#8B6355]">No categories found.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#F0E7D3] text-[#5C4033] uppercase text-xs tracking-wider border-b border-[#E4DAC6]">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Name</th>
                                        <th className="px-6 py-3 font-semibold">Description</th>
                                        <th className="px-6 py-3 font-semibold text-right">Products Count</th>
                                        <th className="px-6 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E4DAC6] bg-white">
                                    {filtered.map(c => (
                                        <tr key={c.id} className="hover:bg-[#FBF8F2] transition-colors">
                                            <td className="px-6 py-4 font-medium text-[#3D2621]">{c.name}</td>
                                            <td className="px-6 py-4 text-[#8B6355]">{c.description || '—'}</td>
                                            <td className="px-6 py-4 text-right text-[#5C4033]">
                                                {c._count?.products ?? 0}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        if (confirm(`Delete category "${c.name}"? This cannot be undone.`)) {
                                                            deleteMutation.mutate(c.id);
                                                        }
                                                    }}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                                    title="Delete Category"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-md bg-[#FBF8F2] border-[#E4DAC6]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#3D2621]">New Category</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleCreate} className="space-y-4 mt-2">
                        <div className="space-y-1.5">
                            <Label className="text-[#8B6355]">Name <span className="text-red-500">*</span></Label>
                            <Input 
                                className="border-[#D9CBB0] bg-white focus-visible:ring-[#B8863B]"
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                placeholder="e.g. Electronics"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[#8B6355]">Description</Label>
                            <Input 
                                className="border-[#D9CBB0] bg-white focus-visible:ring-[#B8863B]"
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>
                        )}

                        <DialogFooter className="mt-4 gap-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsCreateOpen(false)}
                                className="border-[#D9CBB0] text-[#5C4033]"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={createMutation.isPending}
                                className="bg-[#6B352A] text-white hover:bg-[#5A2C22]"
                            >
                                {createMutation.isPending ? 'Saving...' : 'Create Category'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
