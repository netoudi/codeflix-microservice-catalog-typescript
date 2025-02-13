import { CategoryOutputMapper } from '@/core/category/application/use-cases/common/category-output.mapper';
import { ListAllCategoriesUseCase } from '@/core/category/application/use-cases/list-all-categories/list-all-categories.use-case';
import { Category } from '@/core/category/domain/category.entity';
import { CategoryInMemoryRepository } from '@/core/category/infra/db/in-memory/category-in-memory.repository';

describe('ListCategoriesUseCase Unit Tests', () => {
  let useCase: ListAllCategoriesUseCase;
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository();
    useCase = new ListAllCategoriesUseCase(repository);
  });

  it('should list all categories', async () => {
    const categories = Category.fake().theCategories(2).build();
    await repository.bulkInsert(categories);
    const output = await useCase.execute();
    expect(output).toHaveLength(2);
    expect(output).toContainEqual(CategoryOutputMapper.toOutput(categories[0]));
    expect(output).toContainEqual(CategoryOutputMapper.toOutput(categories[1]));
  });
});
