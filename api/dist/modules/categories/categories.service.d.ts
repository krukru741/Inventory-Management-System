import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createCategoryDto: CreateCategoryDto): Promise<{
        description: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        parentId: string | null;
        sortOrder: number;
    }>;
    findAll(): Promise<{
        description: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        parentId: string | null;
        sortOrder: number;
    }[]>;
    findTree(): Promise<({
        children: ({
            children: {
                description: string | null;
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                parentId: string | null;
                sortOrder: number;
            }[];
        } & {
            description: string | null;
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            parentId: string | null;
            sortOrder: number;
        })[];
    } & {
        description: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        parentId: string | null;
        sortOrder: number;
    })[]>;
    findOne(id: string): Promise<{
        parent: {
            description: string | null;
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            parentId: string | null;
            sortOrder: number;
        } | null;
        children: {
            description: string | null;
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            parentId: string | null;
            sortOrder: number;
        }[];
    } & {
        description: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        parentId: string | null;
        sortOrder: number;
    }>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<{
        description: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        parentId: string | null;
        sortOrder: number;
    }>;
    remove(id: string): Promise<{
        description: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        parentId: string | null;
        sortOrder: number;
    }>;
}
