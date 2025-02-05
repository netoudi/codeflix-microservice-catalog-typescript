import {
  CategoryOutput,
  CategoryOutputMapper,
} from '@/core/category/application/use-cases/common/category-output.mapper';
import { CreateCategoryInput } from '@/core/category/application/use-cases/create-category/create-category.input';
import { Category } from '@/core/category/domain/category.entity';
import { ICategoryRepository } from '@/core/category/domain/category.repository';
import { IUseCase } from '@/core/shared/application/use-case.interface';
import { EntityValidationError } from '@/core/shared/domain/validators/validation.error';

export class CreateCategoryUseCase implements IUseCase<CreateCategoryInput, CreateCategoryOutput> {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<CreateCategoryOutput> {
    const category = Category.create(input);

    if (category.notification.hasErrors()) {
      throw new EntityValidationError(category.notification.toJSON());
    }

    await this.categoryRepository.insert(category);

    return CategoryOutputMapper.toOutput(category);
  }
}

export type CreateCategoryOutput = CategoryOutput;
