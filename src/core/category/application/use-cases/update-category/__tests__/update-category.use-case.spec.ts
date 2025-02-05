import { UpdateCategoryUseCase } from '@/core/category/application/use-cases/update-category/update-category.use-case';
import { Category } from '@/core/category/domain/category.entity';
import { CategoryInMemoryRepository } from '@/core/category/infra/db/in-memory/category-in-memory.repository';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { InvalidUuidError, Uuid } from '@/core/shared/domain/value-objects/uuid.vo';

describe('UpdateCategoryUseCase Unit Tests', () => {
  let useCase: UpdateCategoryUseCase;
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository();
    useCase = new UpdateCategoryUseCase(repository);
  });

  it('should throw error when category is not valid', async () => {
    const category = new Category({ name: 'Movie' });
    repository.items = [category];
    const input = { id: category.id.value, name: 'x'.repeat(256) };
    await expect(useCase.execute(input)).rejects.toThrow('Entity Validation Error');
  });

  it('should throw error when entity not found', async () => {
    await expect(useCase.execute({ id: 'fake-id', name: 'test' })).rejects.toThrow(new InvalidUuidError());
    const uuid = new Uuid();
    await expect(useCase.execute({ id: uuid.value, name: 'test' })).rejects.toThrow(
      new NotFoundError(uuid.value, Category),
    );
  });

  it('should update a category', async () => {
    const spyInsert = jest.spyOn(repository, 'update');
    const category = new Category({ name: 'Movie' });
    repository.items = [category];
    const output = await useCase.execute({ id: category.id.value, name: 'test' });
    expect(spyInsert).toHaveBeenCalledTimes(1);
    expect(output).toStrictEqual({
      id: category.id.value,
      name: 'test',
      description: null,
      is_active: true,
      created_at: category.created_at,
    });
    type Arrange = {
      input: {
        id: string;
        name?: string;
        description?: string | null;
        is_active?: boolean;
      };
      output: {
        id: string;
        name: string;
        description: string | null;
        is_active: boolean;
        created_at: Date;
      };
    };
    const arrange: Arrange[] = [
      {
        input: {
          id: category.id.value,
          name: 'test',
          description: 'some description',
        },
        output: {
          id: category.id.value,
          name: 'test',
          description: 'some description',
          is_active: true,
          created_at: category.created_at,
        },
      },
      {
        input: {
          id: category.id.value,
          name: 'test',
        },
        output: {
          id: category.id.value,
          name: 'test',
          description: 'some description',
          is_active: true,
          created_at: category.created_at,
        },
      },
      {
        input: {
          id: category.id.value,
          name: 'test',
          is_active: false,
        },
        output: {
          id: category.id.value,
          name: 'test',
          description: 'some description',
          is_active: false,
          created_at: category.created_at,
        },
      },
      {
        input: {
          id: category.id.value,
          name: 'test',
        },
        output: {
          id: category.id.value,
          name: 'test',
          description: 'some description',
          is_active: false,
          created_at: category.created_at,
        },
      },
      {
        input: {
          id: category.id.value,
          name: 'test',
          is_active: true,
        },
        output: {
          id: category.id.value,
          name: 'test',
          description: 'some description',
          is_active: true,
          created_at: category.created_at,
        },
      },
      {
        input: {
          id: category.id.value,
          name: 'test',
          description: 'some description',
          is_active: false,
        },
        output: {
          id: category.id.value,
          name: 'test',
          description: 'some description',
          is_active: false,
          created_at: category.created_at,
        },
      },
      {
        input: {
          id: category.id.value,
          description: null,
        },
        output: {
          id: category.id.value,
          name: 'test',
          description: null,
          is_active: false,
          created_at: category.created_at,
        },
      },
    ];
    for (const i of arrange) {
      const output = await useCase.execute({
        id: i.input.id,
        ...('name' in i.input && { name: i.input.name }),
        ...('description' in i.input && { description: i.input.description }),
        ...('is_active' in i.input && { is_active: i.input.is_active }),
      });
      expect(output).toStrictEqual(i.output);
    }
  });
});
