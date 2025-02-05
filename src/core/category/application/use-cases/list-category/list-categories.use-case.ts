import {
  CategoryOutput,
  CategoryOutputMapper,
} from '@/core/category/application/use-cases/common/category-output.mapper';
import { CategoryFilter, CategorySearchParams, ICategoryRepository } from '@/core/category/domain/category.repository';
import { PaginationOutput } from '@/core/shared/application/pagination-output.mapper';
import { IUseCase } from '@/core/shared/application/use-case.interface';
import { SortDirection } from '@/core/shared/domain/repository/search-params';

export class ListCategoriesUseCase implements IUseCase<ListCategoriesInput, ListCategoriesOutput> {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(input: ListCategoriesInput): Promise<ListCategoriesOutput> {
    const result = await this.categoryRepository.search(new CategorySearchParams(input));

    return CategoryOutputMapper.toPagination(result);
  }
}

export type ListCategoriesInput = {
  page?: number;
  per_page?: number;
  sort?: string;
  sort_dir?: SortDirection | null;
  filter?: CategoryFilter | null;
};

export type ListCategoriesOutput = PaginationOutput<CategoryOutput>;
