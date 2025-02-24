import { Category, CategoryId } from '@/core/category/domain/category.entity';
import { ICategoryRepository } from '@/core/category/domain/category.repository';
import { IUseCase } from '@/core/shared/application/use-case.interface';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';

export class DeleteCategoryUseCase implements IUseCase<DeleteCategoryInput, DeleteCategoryOutput> {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(input: DeleteCategoryInput): Promise<DeleteCategoryOutput> {
    const category = await this.categoryRepository.findById(new CategoryId(input.id));

    if (!category) {
      throw new NotFoundError(input.id, Category);
    }

    const hasOnlyOneNotDeletedInRelated = await this.categoryRepository.hasOnlyOneNotDeletedInRelated(category.id);

    if (hasOnlyOneNotDeletedInRelated) {
      //criar um erro personalizado
      throw new Error('At least one category must be present in related.');
    }

    category.markAsDeleted();

    await this.categoryRepository.update(category);
  }
}

export type DeleteCategoryInput = {
  id: string;
};

export type DeleteCategoryOutput = void;
