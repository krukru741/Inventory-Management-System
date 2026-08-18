export declare class ReportQueryDto {
    warehouseId?: string;
    categoryId?: string;
    format?: 'json' | 'csv';
}
export declare class DeadStockQueryDto extends ReportQueryDto {
    daysThreshold?: number;
}
