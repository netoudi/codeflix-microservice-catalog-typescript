import { Category, CategoryId } from '@/core/category/domain/category.entity';
import { ICategoryRepository } from '@/core/category/domain/category.repository';
import { Either } from '@/core/shared/domain/either';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';

export class CategoriesIdExistsInDatabaseValidator {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async validate(categories_id: string[]): Promise<Either<CategoryId[], NotFoundError[]>> {
    const categoriesId = categories_id.map((v) => new CategoryId(v));
    const existsResult = await this.categoryRepository.existsById(categoriesId);
    return existsResult.not_exists.length > 0
      ? Either.fail(existsResult.not_exists.map((c) => new NotFoundError(c.value, Category)))
      : Either.ok(categoriesId);
  }
}
