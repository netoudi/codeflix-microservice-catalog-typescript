import { DeleteCategoryUseCase } from '@/core/category/application/use-cases/delete-category/delete-category.use-case';
import { Category, CategoryId } from '@/core/category/domain/category.entity';
import { CategoryInMemoryRepository } from '@/core/category/infra/db/in-memory/category-in-memory.repository';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';

describe('DeleteCategoryUseCase Unit Tests', () => {
  let useCase: DeleteCategoryUseCase;
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository();
    jest.spyOn(repository, 'hasOnlyOneNotDeletedInRelated').mockImplementation();
    useCase = new DeleteCategoryUseCase(repository);
  });

  it('should throw error when entity not found', async () => {
    const categoryId = new CategoryId();
    await expect(() => useCase.execute({ id: categoryId.value })).rejects.toThrow(
      new NotFoundError(categoryId.value, Category),
    );
  });

  it('should delete a category', async () => {
    const items = [
      new Category({
        id: new CategoryId(),
        name: 'Movie',
        description: 'some description',
        is_active: true,
        created_at: new Date(),
      }),
    ];
    repository.items = items;
    await useCase.execute({ id: items[0].id.value });
    const item = await repository.findById(items[0].id);
    expect(item?.deleted_at).not.toBeNull();
  });
});
