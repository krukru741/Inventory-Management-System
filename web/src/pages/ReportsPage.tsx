import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const currencyFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

function ValuationReport() {
    const { data: res, isLoading } = useQuery({
        queryKey: ['reports', 'valuation'],
        queryFn: async () => {
            const { data } = await api.get('/reports/stock-valuation');
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
    });

    const rows = res ?? [];
    const totalValuation = rows.reduce((sum: number, row: any) => sum + Number(row.total_value), 0);

    if (isLoading) return <div className="p-8 text-center text-[#A08A72]">Loading valuation report...</div>;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[#FBF8F2] border-[#E4DAC6]">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[#A08A72] font-semibold uppercase tracking-wider text-xs">Total Stock Value</CardDescription>
                        <CardTitle className="text-3xl text-[#3D2621]">{currencyFormat.format(totalValuation)}</CardTitle>
                    </CardHeader>
                </Card>
            </div>
            
            <Card className="border-[#E4DAC6] shadow-sm">
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F0E7D3] text-[#5C4033] uppercase text-xs tracking-wider border-b border-[#E4DAC6]">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Warehouse Name</th>
                                <th className="px-6 py-3 font-semibold text-right">Total Qty</th>
                                <th className="px-6 py-3 font-semibold text-right">Total Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E4DAC6] bg-white">
                            {rows.map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-[#FBF8F2] transition-colors">
                                    <td className="px-6 py-4 font-medium text-[#3D2621]">{row.warehouse_name || 'Unassigned'}</td>
                                    <td className="px-6 py-4 text-right text-[#8B6355]">{Number(row.total_qty || 0)}</td>
                                    <td className="px-6 py-4 text-right font-semibold text-[#3D2621]">{currencyFormat.format(Number(row.total_value || 0))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}

function LowStockReport() {
    const { data: res, isLoading } = useQuery({
        queryKey: ['reports', 'low-stock'],
        queryFn: async () => {
            const { data } = await api.get('/reports/low-stock');
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
    });

    const rows = res ?? [];
    const outOfStock = rows.filter((r: any) => r.alert_level === 'out_of_stock').length;

    if (isLoading) return <div className="p-8 text-center text-[#A08A72]">Loading low stock report...</div>;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[#FFF4F2] border-[#F3D9D6]">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[#8C2E27] font-semibold uppercase tracking-wider text-xs">Out of Stock</CardDescription>
                        <CardTitle className="text-3xl text-[#6B221C]">{outOfStock}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-[#FBF8F2] border-[#E4DAC6]">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[#A08A72] font-semibold uppercase tracking-wider text-xs">Low Stock Alerts</CardDescription>
                        <CardTitle className="text-3xl text-[#3D2621]">{rows.length - outOfStock}</CardTitle>
                    </CardHeader>
                </Card>
            </div>
            
            <Card className="border-[#E4DAC6] shadow-sm">
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F0E7D3] text-[#5C4033] uppercase text-xs tracking-wider border-b border-[#E4DAC6]">
                            <tr>
                                <th className="px-6 py-3 font-semibold">SKU</th>
                                <th className="px-6 py-3 font-semibold">Product Name</th>
                                <th className="px-6 py-3 font-semibold">Location</th>
                                <th className="px-6 py-3 font-semibold text-right">Current Qty</th>
                                <th className="px-6 py-3 font-semibold text-right">Min Level</th>
                                <th className="px-6 py-3 font-semibold text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E4DAC6] bg-white">
                            {rows.map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-[#FBF8F2] transition-colors">
                                    <td className="px-6 py-4 font-medium text-[#3D2621]">{row.sku}</td>
                                    <td className="px-6 py-4 text-[#5C4033]">{row.product_name}</td>
                                    <td className="px-6 py-4 text-[#8B6355]">{row.warehouse_name} - {row.location_code}</td>
                                    <td className="px-6 py-4 text-right font-medium text-[#6B221C]">{Number(row.current_quantity)}</td>
                                    <td className="px-6 py-4 text-right text-[#5C4033]">{Number(row.min_stock_level)}</td>
                                    <td className="px-6 py-4 text-center">
                                        {row.alert_level === 'out_of_stock' ? (
                                            <Badge className="bg-[#8C2E27] text-white hover:bg-[#6B221C]">Out of Stock</Badge>
                                        ) : (
                                            <Badge className="bg-[#B8863B] text-white hover:bg-[#A07028]">Low Stock</Badge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}

function DeadStockReport() {
    const { data: res, isLoading } = useQuery({
        queryKey: ['reports', 'dead-stock'],
        queryFn: async () => {
            const { data } = await api.get('/reports/dead-stock');
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
    });

    const rows = res ?? [];

    if (isLoading) return <div className="p-8 text-center text-[#A08A72]">Loading dead stock report...</div>;

    return (
        <div className="space-y-4">
            <Card className="border-[#E4DAC6] shadow-sm">
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F0E7D3] text-[#5C4033] uppercase text-xs tracking-wider border-b border-[#E4DAC6]">
                            <tr>
                                <th className="px-6 py-3 font-semibold">SKU</th>
                                <th className="px-6 py-3 font-semibold">Product Name</th>
                                <th className="px-6 py-3 font-semibold text-right">Current Qty</th>
                                <th className="px-6 py-3 font-semibold">Last Movement</th>
                                <th className="px-6 py-3 font-semibold text-right">Stock Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E4DAC6] bg-white">
                            {rows.length === 0 ? (
                                <tr><td colSpan={5} className="py-12 text-center text-[#8B6355]">No dead stock found. Great job!</td></tr>
                            ) : (
                                rows.map((row: any, i: number) => (
                                    <tr key={i} className="hover:bg-[#FBF8F2] transition-colors">
                                        <td className="px-6 py-4 font-medium text-[#3D2621]">{row.sku}</td>
                                        <td className="px-6 py-4 text-[#5C4033]">{row.product_name}</td>
                                        <td className="px-6 py-4 text-right font-medium text-[#5C4033]">{Number(row.current_stock || 0)}</td>
                                        <td className="px-6 py-4 text-[#8B6355]">
                                            {row.last_movement_date ? format(new Date(row.last_movement_date), 'MMM d, yyyy') : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 text-right text-[#8C2E27] font-semibold">{currencyFormat.format(Number(row.stock_value || 0))}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}

function TurnoverReport() {
    const { data: res, isLoading } = useQuery({
        queryKey: ['reports', 'turnover'],
        queryFn: async () => {
            const { data } = await api.get('/reports/turnover');
            return Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
        },
    });

    const rows = res ?? [];

    if (isLoading) return <div className="p-8 text-center text-[#A08A72]">Loading turnover report...</div>;

    return (
        <div className="space-y-4">
            <Card className="border-[#E4DAC6] shadow-sm">
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#F0E7D3] text-[#5C4033] uppercase text-xs tracking-wider border-b border-[#E4DAC6]">
                            <tr>
                                <th className="px-6 py-3 font-semibold">SKU</th>
                                <th className="px-6 py-3 font-semibold">Product Name</th>
                                <th className="px-6 py-3 font-semibold text-right">Total Outbound</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E4DAC6] bg-white">
                            {rows.length === 0 ? (
                                <tr><td colSpan={3} className="py-12 text-center text-[#8B6355]">No turnover data available.</td></tr>
                            ) : (
                                rows.map((row: any, i: number) => (
                                    <tr key={i} className="hover:bg-[#FBF8F2] transition-colors">
                                        <td className="px-6 py-4 font-medium text-[#3D2621]">{row.sku}</td>
                                        <td className="px-6 py-4 text-[#5C4033]">{row.product_name}</td>
                                        <td className="px-6 py-4 text-right text-[#8C2E27] font-medium">{Number(row.total_outbound || 0)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[#3D2621]">Reports</h1>
                <p className="text-[#8B6355] text-sm mt-1">Detailed analytics and insights across your inventory.</p>
            </div>

            <Tabs defaultValue="valuation" className="w-full">
                <TabsList className="bg-[#EADFC7] p-1 border border-[#D9CBB0]">
                    <TabsTrigger value="valuation" className="data-[state=active]:bg-[#6B4A3E] data-[state=active]:text-[#F7F2E7] text-[#5C4033]">Stock Valuation</TabsTrigger>
                    <TabsTrigger value="low-stock" className="data-[state=active]:bg-[#6B4A3E] data-[state=active]:text-[#F7F2E7] text-[#5C4033]">Low Stock</TabsTrigger>
                    <TabsTrigger value="turnover" className="data-[state=active]:bg-[#6B4A3E] data-[state=active]:text-[#F7F2E7] text-[#5C4033]">Turnover</TabsTrigger>
                    <TabsTrigger value="dead-stock" className="data-[state=active]:bg-[#6B4A3E] data-[state=active]:text-[#F7F2E7] text-[#5C4033]">Dead Stock</TabsTrigger>
                </TabsList>
                
                <div className="mt-6">
                    <TabsContent value="valuation">
                        <ValuationReport />
                    </TabsContent>
                    
                    <TabsContent value="low-stock">
                        <LowStockReport />
                    </TabsContent>
                    
                    <TabsContent value="turnover">
                        <TurnoverReport />
                    </TabsContent>
                    
                    <TabsContent value="dead-stock">
                        <DeadStockReport />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
