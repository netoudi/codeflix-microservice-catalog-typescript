import { SaveCategoryInput } from '@/core/category/application/use-cases/save-category/save-category.input';
import { SaveCategoryUseCase } from '@/core/category/application/use-cases/save-category/save-category.use-case';
import { CategoryId, Category } from '@/core/category/domain/category.entity';
import { CategoryInMemoryRepository } from '@/core/category/infra/db/in-memory/category-in-memory.repository';

describe('SaveCategoryUseCase Unit Tests', () => {
  let useCase: SaveCategoryUseCase;
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository();
    jest.spyOn(repository, 'hasOnlyOneActivateInRelated').mockImplementation();
    useCase = new SaveCategoryUseCase(repository);
  });

  it('should call createCategory method when category not exists in database', async () => {
    useCase['createCategory'] = jest.fn();
    const input = new SaveCategoryInput({
      id: new CategoryId().value,
      name: 'test',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await useCase.execute(input);
    expect(useCase['createCategory']).toHaveBeenCalledTimes(1);
    expect(useCase['createCategory']).toHaveBeenCalledWith(input);
  });

  it('should call updateCategory method when category exists in database', async () => {
    useCase['updateCategory'] = jest.fn();
    const category = Category.fake().aCategory().build();
    repository.insert(category);
    const input = new SaveCategoryInput({
      id: category.id.value,
      name: 'test',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await useCase.execute(input);
    expect(useCase['updateCategory']).toHaveBeenCalledTimes(1);
    expect(useCase['updateCategory']).toHaveBeenCalledWith(input, expect.any(Category));
  });

  describe('execute createCategory method', () => {
    it('should throw an error when entity is not valid', async () => {
      const spyCreateCategory = jest.spyOn(useCase, 'createCategory' as any);
      const input = new SaveCategoryInput({
        id: new CategoryId().value,
        name: 't'.repeat(256),
        description: 'some description',
        is_active: false,
        created_at: new Date(),
      });
      await expect(() => useCase.execute(input)).rejects.toThrowError('Entity Validation Error');
      expect(spyCreateCategory).toHaveBeenCalledTimes(1);
    });

    it('should create a category', async () => {
      const spyInsert = jest.spyOn(repository, 'insert');
      const categoryId = new CategoryId().value;
      const input = new SaveCategoryInput({
        id: categoryId,
        name: 'test',
        description: 'some description',
        is_active: false,
        created_at: new Date(),
      });
      const output = await useCase.execute(input);
      expect(spyInsert).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: categoryId,
        created: true,
      });
    });
  });

  describe('execute calling updateCategory method', () => {
    it('should throw an error when entity is not valid', async () => {
      const category = Category.fake().aCategory().build();
      repository.items.push(category);
      const input = new SaveCategoryInput({
        id: category.id.value,
        name: 't'.repeat(256),
        description: 'some description',
        is_active: false,
        created_at: new Date(),
      });
      await expect(() => useCase.execute(input)).rejects.toThrowError('Entity Validation Error');
    });

    it('should update a category', async () => {
      const spyUpdate = jest.spyOn(repository, 'update');
      const category = Category.fake().aCategory().build();
      repository.items.push(category);
      const input = new SaveCategoryInput({
        id: category.id.value,
        name: 'test',
        description: 'some description',
        is_active: false,
        created_at: new Date(),
      });
      const output = await useCase.execute(input);
      expect(spyUpdate).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: repository.items[0].id.value,
        created: false,
      });
    });
  });
});
