import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class QueryProductDto extends PaginationDto {
    search?: string;
    category?: string;
    sku?: string;
    lowStock?: boolean;
}
