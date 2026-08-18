import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createCategoryDto: CreateCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        parentId: string | null;
        slug: string;
        description: string | null;
        sortOrder: number;
    }>;
    findAll(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        parentId: string | null;
        slug: string;
        description: string | null;
        sortOrder: number;
    }[]>;
    findTree(): Promise<({
        children: ({
            children: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                parentId: string | null;
                slug: string;
                description: string | null;
                sortOrder: number;
            }[];
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            parentId: string | null;
            slug: string;
            description: string | null;
            sortOrder: number;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        parentId: string | null;
        slug: string;
        description: string | null;
        sortOrder: number;
    })[]>;
    findOne(id: string): Promise<{
        parent: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            parentId: string | null;
            slug: string;
            description: string | null;
            sortOrder: number;
        } | null;
        children: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            parentId: string | null;
            slug: string;
            description: string | null;
            sortOrder: number;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        parentId: string | null;
        slug: string;
        description: string | null;
        sortOrder: number;
    }>;
    update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        parentId: string | null;
        slug: string;
        description: string | null;
        sortOrder: number;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        parentId: string | null;
        slug: string;
        description: string | null;
        sortOrder: number;
    }>;
}
