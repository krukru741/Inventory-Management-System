import { PrismaService } from '../../prisma/prisma.service';
import { ReportQueryDto, DeadStockQueryDto } from './dto/report-query.dto';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    getDashboardMetrics(): Promise<{
        totalProductsCount: number;
        totalInventoryValue: number;
        lowStockAlertsCount: number;
        openPurchaseOrdersCount: number;
        openSalesOrdersCount: number;
    }>;
    getStockSummary(query: ReportQueryDto): Promise<unknown>;
    getLowStock(query: ReportQueryDto): Promise<unknown>;
    getStockValuation(query: ReportQueryDto): Promise<unknown>;
    getTurnover(query: ReportQueryDto): Promise<unknown>;
    getDeadStock(query: DeadStockQueryDto): Promise<unknown>;
}
