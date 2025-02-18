import {
  CategoryOutput,
  CategoryOutputMapper,
} from '@/core/category/application/use-cases/common/category-output.mapper';
import { ICategoryRepository } from '@/core/category/domain/category.repository';
import { IUseCase } from '@/core/shared/application/use-case.interface';

export class ListAllCategoriesUseCase implements IUseCase<ListAllCategoriesInput, ListAllCategoriesOutput> {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(): Promise<ListAllCategoriesOutput> {
    const categories = await this.categoryRepository
      .ignoreSoftDeleted()
      .findBy({ is_active: true }, { field: 'name', direction: 'asc' });

    return categories.map(CategoryOutputMapper.toOutput);
  }
}

export type ListAllCategoriesInput = void;

export type ListAllCategoriesOutput = CategoryOutput[];
