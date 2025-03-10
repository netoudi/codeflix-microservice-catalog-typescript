import { CreateCategoryUseCase } from '@/core/category/application/use-cases/create-category/create-category.use-case';
import { CategoryId } from '@/core/category/domain/category.entity';
import { CategoryInMemoryRepository } from '@/core/category/infra/db/in-memory/category-in-memory.repository';

describe('CreateCategoryUseCase Unit Tests', () => {
  let useCase: CreateCategoryUseCase;
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository();
    useCase = new CreateCategoryUseCase(repository);
  });

  it('should throw error when category is not valid', async () => {
    await expect(
      useCase.execute({
        id: new CategoryId(),
        name: 'x'.repeat(256),
        description: null,
        is_active: true,
        created_at: new Date(),
      }),
    ).rejects.toThrow('Entity Validation Error');
  });

  it('should create a new category', async () => {
    const spyInsert = jest.spyOn(repository, 'insert');
    let output = await useCase.execute({
      id: new CategoryId(),
      name: 'test',
      description: null,
      is_active: true,
      created_at: new Date(),
    });
    expect(spyInsert).toHaveBeenCalledTimes(1);
    expect(output).toStrictEqual({
      id: repository.items[0].id.value,
      name: 'test',
      description: null,
      is_active: true,
      created_at: repository.items[0].created_at,
      deleted_at: null,
    });
    output = await useCase.execute({
      id: new CategoryId(),
      name: 'test',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    expect(spyInsert).toHaveBeenCalledTimes(2);
    expect(output).toStrictEqual({
      id: repository.items[1].id.value,
      name: 'test',
      description: 'some description',
      is_active: false,
      created_at: repository.items[1].created_at,
      deleted_at: null,
    });
  });
});
