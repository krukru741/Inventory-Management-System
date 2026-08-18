import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  unitOfMeasure: string;
}

interface StockSummary {
  product_id: string;
  sku: string;
  product_name: string;
  total_on_hand: number;
  total_allocated: number;
  total_available: number;
  min_stock_level: number;
  max_stock_level: number;
}

export default function ProductsPage() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Fetch from the backend view or products endpoint
  const { data: stockSummaries, isLoading } = useQuery<StockSummary[]>({
    queryKey: ['stock-summaries'],
    queryFn: async () => {
      // Fetching the stock-summary report from the backend
      try {
        const res = await api.get('/reports/stock-summary');
        return res.data.data;
      } catch (err) {
        // Fallback mock data if endpoint isn't fully ready
        return [
          {
            product_id: '1', sku: 'SKU-LAPTOP-X1', product_name: 'ThinkPad X1 Carbon Gen 10',
            total_on_hand: 50, total_allocated: 0, total_available: 50, min_stock_level: 10, max_stock_level: 100
          },
          {
            product_id: '2', sku: 'SKU-MOUSE-M705', product_name: 'Logitech M705 Wireless Mouse',
            total_on_hand: 15, total_allocated: 0, total_available: 15, min_stock_level: 20, max_stock_level: 200
          },
          {
            product_id: '3', sku: 'SKU-DOCK', product_name: 'USB-C Dock Station',
            total_on_hand: 0, total_allocated: 0, total_available: 0, min_stock_level: 5, max_stock_level: 50
          }
        ];
      }
    }
  });

  const getStockStatus = (summary: StockSummary) => {
    if (summary.total_available <= 0) {
      return { label: 'out of stock', classes: 'bg-status-red-bg text-status-red-text' };
    }
    if (summary.total_available <= summary.min_stock_level) {
      return { label: 'low stock', classes: 'bg-status-amber-bg text-status-amber-text' };
    }
    return { label: 'in stock', classes: 'bg-status-green-bg text-status-green-text' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-primary">Products</h1>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card className="bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">Product Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading products...</TableCell>
                </TableRow>
              ) : (
                stockSummaries?.map((item) => {
                  const isSelected = selectedProductId === item.product_id;
                  const status = getStockStatus(item);
                  
                  return (
                    <TableRow 
                      key={item.product_id}
                      onClick={() => setSelectedProductId(item.product_id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-butter-yellow hover:bg-butter-yellow' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <TableCell className="font-medium">
                        {item.product_name.toLowerCase()}
                        {isSelected && <span className="ml-2 text-xs text-muted-foreground">← selected row</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                      <TableCell className="text-right">{item.total_available}</TableCell>
                      <TableCell className="text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.classes}`}>
                          {status.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
