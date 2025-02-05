import { Category } from '@/core/category/domain/category.entity';
import { CategoryInMemoryRepository } from '@/core/category/infra/db/in-memory/category-in-memory.repository';

describe('CategoryInMemoryRepository Unit Tests', () => {
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository();
  });

  it('should no filter items when filter object is null', async () => {
    const items = [Category.fake().aCategory().build()];
    const filterSpy = jest.spyOn(items, 'filter');
    const itemsFiltered = await repository['applyFilter'](items, null);
    expect(filterSpy).not.toHaveBeenCalled();
    expect(itemsFiltered).toStrictEqual(items);
  });

  it('should filter items using filter parameter', async () => {
    const items = [
      Category.fake().aCategory().withName('test').build(),
      Category.fake().aCategory().withName('TEST').build(),
      Category.fake().aCategory().withName('fake').build(),
    ];

    const spyFilter = jest.spyOn(items, 'filter');

    const itemsFiltered = await repository['applyFilter'](items, 'TEST');
    expect(spyFilter).toHaveBeenCalledTimes(1);
    expect(itemsFiltered).toStrictEqual([items[0], items[1]]);
  });

  it('should sort by created_at when sort param is null', async () => {
    const created_at = new Date();
    const items = [
      Category.fake().aCategory().withName('test').withCreatedAt(created_at).build(),
      Category.fake()
        .aCategory()
        .withName('TEST')
        .withCreatedAt(new Date(created_at.getTime() + 100))
        .build(),
      Category.fake()
        .aCategory()
        .withName('fake')
        .withCreatedAt(new Date(created_at.getTime() + 200))
        .build(),
    ];
    const itemsFiltered = await repository['applySort'](items, null, null);
    expect(itemsFiltered).toStrictEqual([items[2], items[1], items[0]]);
  });

  it('should sort by name', async () => {
    const items = [
      Category.fake().aCategory().withName('c').build(),
      Category.fake().aCategory().withName('b').build(),
      Category.fake().aCategory().withName('a').build(),
    ];
    let itemsFiltered = await repository['applySort'](items, 'name', 'asc');
    expect(itemsFiltered).toStrictEqual([items[2], items[1], items[0]]);
    itemsFiltered = await repository['applySort'](items, 'name', 'desc');
    expect(itemsFiltered).toStrictEqual([items[0], items[1], items[2]]);
  });
});
