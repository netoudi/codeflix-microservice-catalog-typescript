import { CategoryOutputMapper } from '@/core/category/application/use-cases/common/category-output.mapper';
import { ListCategoriesUseCase } from '@/core/category/application/use-cases/list-category/list-categories.use-case';
import { Category } from '@/core/category/domain/category.entity';
import { CategoryInMemoryRepository } from '@/core/category/infra/db/in-memory/category-in-memory.repository';

describe('ListCategoriesUseCase Unit Tests', () => {
  let useCase: ListCategoriesUseCase;
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository();
    useCase = new ListCategoriesUseCase(repository);
  });

  it('should return output sorted by created_at when input param is empty', async () => {
    const items = [
      Category.fake().aCategory().withName('test 1').build(),
      Category.fake()
        .aCategory()
        .withName('test 2')
        .withCreatedAt(new Date(new Date().getTime() + 1000))
        .build(),
    ];
    repository.items = items;
    const output = await useCase.execute({});
    expect(output).toStrictEqual({
      items: [...items].reverse().map(CategoryOutputMapper.toOutput),
      total: 2,
      current_page: 1,
      per_page: 15,
      last_page: 1,
    });
  });

  it('should return output using pagination, sort and filter', async () => {
    const items = [
      Category.fake().aCategory().withName('a').build(),
      Category.fake().aCategory().withName('AAA').build(),
      Category.fake().aCategory().withName('AaA').build(),
      Category.fake().aCategory().withName('b').build(),
      Category.fake().aCategory().withName('c').build(),
    ];
    repository.items = items;
    let output = await useCase.execute({
      page: 1,
      per_page: 2,
      sort: 'name',
      filter: 'a',
    });
    expect(output).toStrictEqual({
      items: [items[1], items[2]].map(CategoryOutputMapper.toOutput),
      total: 3,
      current_page: 1,
      per_page: 2,
      last_page: 2,
    });
    output = await useCase.execute({
      page: 2,
      per_page: 2,
      sort: 'name',
      filter: 'a',
    });
    expect(output).toStrictEqual({
      items: [items[0]].map(CategoryOutputMapper.toOutput),
      total: 3,
      current_page: 2,
      per_page: 2,
      last_page: 2,
    });
    output = await useCase.execute({
      page: 1,
      per_page: 2,
      sort: 'name',
      sort_dir: 'desc',
      filter: 'a',
    });
    expect(output).toStrictEqual({
      items: [items[0], items[2]].map(CategoryOutputMapper.toOutput),
      total: 3,
      current_page: 1,
      per_page: 2,
      last_page: 2,
    });
  });
});
