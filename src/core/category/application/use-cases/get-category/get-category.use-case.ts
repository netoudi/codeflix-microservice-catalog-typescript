import {
  CategoryOutput,
  CategoryOutputMapper,
} from '@/core/category/application/use-cases/common/category-output.mapper';
import { Category, CategoryId } from '@/core/category/domain/category.entity';
import { ICategoryRepository } from '@/core/category/domain/category.repository';
import { IUseCase } from '@/core/shared/application/use-case.interface';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';

export class GetCategoryUseCase implements IUseCase<GetCategoryInput, GetCategoryOutput> {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(input: GetCategoryInput): Promise<GetCategoryOutput> {
    const category = await this.categoryRepository.findById(new CategoryId(input.id));

    if (!category) throw new NotFoundError(input.id, Category);

    return CategoryOutputMapper.toOutput(category);
  }
}

export type GetCategoryInput = {
  id: string;
};

export type GetCategoryOutput = CategoryOutput;
