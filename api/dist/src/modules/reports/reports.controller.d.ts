import { ReportsService } from './reports.service';
import { ReportQueryDto, DeadStockQueryDto } from './dto/report-query.dto';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getDashboardMetrics(): Promise<{
        totalProductsCount: number;
        totalInventoryValue: number;
        lowStockAlertsCount: number;
        openPurchaseOrdersCount: number;
        openSalesOrdersCount: number;
        activeCustomersCount: number;
    }>;
    getStockSummary(query: ReportQueryDto): Promise<unknown>;
    getLowStock(query: ReportQueryDto): Promise<unknown>;
    getStockValuation(query: ReportQueryDto): Promise<unknown>;
    getTurnover(query: ReportQueryDto): Promise<unknown>;
    getDeadStock(query: DeadStockQueryDto): Promise<unknown>;
}
