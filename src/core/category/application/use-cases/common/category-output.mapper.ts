import { Category } from '@/core/category/domain/category.entity';
import { CategorySearchResult } from '@/core/category/domain/category.repository';
import { PaginationOutput, PaginationOutputMapper } from '@/core/shared/application/pagination-output.mapper';

export type CategoryOutput = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
};

export class CategoryOutputMapper {
  static toOutput(category: Category): CategoryOutput {
    return {
      id: category.id.value,
      name: category.name,
      description: category.description,
      is_active: category.is_active,
      created_at: category.created_at,
    };
  }

  static toPagination(result: CategorySearchResult): PaginationOutput<CategoryOutput> {
    return PaginationOutputMapper.toOutput(result.items.map(CategoryOutputMapper.toOutput), result);
  }
}
