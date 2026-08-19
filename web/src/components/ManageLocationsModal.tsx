import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Trash2, Plus, ArrowRightLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
    warehouseId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface Location {
    id: string;
    code: string;
    isActive: boolean;
}

export default function ManageLocationsModal({ warehouseId, open, onOpenChange }: Props) {
    const qc = useQueryClient();
    const [newCode, setNewCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    const { data: locations, isLoading } = useQuery<Location[]>({
        queryKey: ['warehouses', warehouseId, 'locations'],
        queryFn: async () => {
            if (!warehouseId) return [];
            const { data } = await api.get(`/warehouses/${warehouseId}/locations`);
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
        enabled: open && !!warehouseId,
    });

    const addMutation = useMutation({
        mutationFn: async (code: string) => {
            const { data } = await api.post(`/warehouses/${warehouseId}/locations`, { code });
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['warehouses', warehouseId, 'locations'] });
            qc.invalidateQueries({ queryKey: ['locations', 'options'] });
            setNewCode('');
            setError(null);
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message ?? 'Failed to add location.');
        },
    });

    const toggleMutation = useMutation({
        mutationFn: async (loc: Location) => {
            const { data } = await api.patch(`/warehouses/${warehouseId}/locations/${loc.id}`, { isActive: !loc.isActive });
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['warehouses', warehouseId, 'locations'] });
            qc.invalidateQueries({ queryKey: ['locations', 'options'] });
        },
        onError: (err: any) => {
            setError(err?.response?.data?.message ?? 'Failed to update location.');
        },
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCode.trim()) return;
        addMutation.mutate(newCode.toUpperCase().trim());
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto bg-[#FBF8F2] border-[#E4DAC6]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#3D2621]">Manage Warehouse Bins</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <form onSubmit={handleAdd} className="flex items-end gap-3 p-4 bg-[#F5EEDC] rounded-md border border-[#E4DAC6]">
                        <div className="flex-1 space-y-1.5">
                            <Label className="text-[#8B6355] text-sm font-medium">New Bin / Location Code</Label>
                            <Input
                                value={newCode}
                                onChange={e => setNewCode(e.target.value.toUpperCase())}
                                placeholder="e.g. A1-01, BIN-2"
                                className="border-[#D9CBB0] bg-white focus-visible:ring-[#B8863B]"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={!newCode.trim() || addMutation.isPending}
                            className="bg-[#6B352A] text-white hover:bg-[#5A2C22]"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Bin
                        </Button>
                    </form>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>
                    )}

                    <div className="space-y-3">
                        <Label className="text-[#5C4033] font-semibold tracking-wide uppercase text-xs">Existing Bins</Label>
                        {isLoading ? (
                            <p className="text-sm text-[#8B6355]">Loading bins...</p>
                        ) : !locations || locations.length === 0 ? (
                            <div className="text-center py-8 border border-dashed border-[#D9CBB0] rounded-md">
                                <p className="text-[#8B6355] text-sm">No bins found in this warehouse.</p>
                            </div>
                        ) : (
                            <div className="border border-[#E4DAC6] rounded-md bg-white divide-y divide-[#F0E6D2]">
                                {locations.map(loc => (
                                    <div key={loc.id} className="flex items-center justify-between p-3 hover:bg-[#FBF8F2] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-[#3D2621]">{loc.code}</span>
                                            {loc.isActive ? (
                                                <Badge className="bg-[#DFF0E8] text-[#3D6B50] hover:bg-[#cce8d8] text-[10px]">Active</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[10px]">Inactive</Badge>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleMutation.mutate(loc)}
                                            className="text-[#8B6355] hover:text-[#3D2621] hover:bg-[#F5EEDC]"
                                            title={loc.isActive ? "Deactivate" : "Activate"}
                                        >
                                            <ArrowRightLeft className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
