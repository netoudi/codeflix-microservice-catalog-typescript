import { CategoriesIdExistsInDatabaseValidator } from '@/core/category/application/validations/categories-id-exists-in-database.validator';
import { CategoryId, Category } from '@/core/category/domain/category.entity';
import { CategoryInMemoryRepository } from '@/core/category/infra/db/in-memory/category-in-memory.repository';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';

describe('CategoriesIdExistsInDatabaseValidator Unit Tests', () => {
  let categoryRepository: CategoryInMemoryRepository;
  let validator: CategoriesIdExistsInDatabaseValidator;

  beforeEach(() => {
    categoryRepository = new CategoryInMemoryRepository();
    validator = new CategoriesIdExistsInDatabaseValidator(categoryRepository);
  });

  it('should return many not found error when categories id is not exists in database', async () => {
    const categoryId1 = new CategoryId();
    const categoryId2 = new CategoryId();
    const spyExistsById = jest.spyOn(categoryRepository, 'existsById');
    let [categoriesId, errorsCategoriesId] = await validator.validate([categoryId1.value, categoryId2.value]);
    expect(categoriesId).toStrictEqual(null);
    expect(errorsCategoriesId).toStrictEqual([
      new NotFoundError(categoryId1.value, Category),
      new NotFoundError(categoryId2.value, Category),
    ]);

    expect(spyExistsById).toHaveBeenCalledTimes(1);

    const category1 = Category.fake().aCategory().build();
    await categoryRepository.insert(category1);

    [categoriesId, errorsCategoriesId] = await validator.validate([category1.id.value, categoryId2.value]);
    expect(categoriesId).toStrictEqual(null);
    expect(errorsCategoriesId).toStrictEqual([new NotFoundError(categoryId2.value, Category)]);
    expect(spyExistsById).toHaveBeenCalledTimes(2);
  });

  it('should return a list of categories id', async () => {
    const category1 = Category.fake().aCategory().build();
    const category2 = Category.fake().aCategory().build();
    await categoryRepository.bulkInsert([category1, category2]);
    const [categoriesId, errorsCategoriesId] = await validator.validate([category1.id.value, category2.id.value]);
    expect(categoriesId).toHaveLength(2);
    expect(errorsCategoriesId).toStrictEqual(null);
    expect(categoriesId[0]).toBeValueObject(category1.id);
    expect(categoriesId[1]).toBeValueObject(category2.id);
  });
});
