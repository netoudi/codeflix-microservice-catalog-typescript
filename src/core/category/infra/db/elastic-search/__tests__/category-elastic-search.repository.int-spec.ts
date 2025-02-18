import { Category, CategoryId } from '@/core/category/domain/category.entity';
import { CategoryElasticSearchRepository } from '@/core/category/infra/db/elastic-search/category-elastic-search.repository';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { setupElasticsearch } from '@/core/shared/infra/testing/global-helpers';

describe('CategoryElasticSearchRepository Integration Tests', () => {
  let repository: CategoryElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    repository = new CategoryElasticSearchRepository(esHelper.esClient, esHelper.indexName);
  });

  it('should insert a new entity', async () => {
    const category = Category.create({
      id: new CategoryId(),
      name: 'Movie',
      description: 'Some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(category);
    const output = await repository.findById(category.id);
    expect(output?.toJSON()).toStrictEqual(category.toJSON());
  });

  it('should insert many entities', async () => {
    const categories = Category.fake().theCategories(2).build();
    await repository.bulkInsert(categories);
    const { exists: foundCategories } = await repository.findByIds(categories.map((g) => g.id));
    expect(foundCategories.length).toBe(2);
    expect(foundCategories[0].toJSON()).toStrictEqual(categories[0].toJSON());
    expect(foundCategories[1].toJSON()).toStrictEqual(categories[1].toJSON());
  });

  it('should find a entity by id', async () => {
    let category = await repository.findById(new CategoryId());
    expect(category).toBeNull();
    const entity = Category.create({
      id: new CategoryId(),
      name: 'Movie',
      description: 'Some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(entity);
    category = await repository.findById(entity.id);
    expect(entity.toJSON()).toStrictEqual(category!.toJSON());
    entity.markAsDeleted();
    await repository.update(entity);
    await expect(repository.ignoreSoftDeleted().findById(entity.id)).resolves.toBeNull();
  });

  it('should find a entity by filter', async () => {
    const category = Category.create({
      id: new CategoryId(),
      name: 'Movie',
      description: 'Some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(category);
    let output = await repository.findOneBy({ id: category.id });
    expect(output?.toJSON()).toStrictEqual(category.toJSON());
    expect(repository.findOneBy({ is_active: true })).resolves.toBeNull();
    output = await repository.findOneBy({ id: category.id, is_active: false });
    expect(output?.toJSON()).toStrictEqual(category.toJSON());
    category.markAsDeleted();
    await repository.update(category);
    expect(repository.ignoreSoftDeleted().findOneBy({ id: category.id })).resolves.toBeNull();
  });

  it('should find entities by filter and order', async () => {
    const categories = [
      Category.fake().aCategory().withName('a').build(),
      Category.fake().aCategory().withName('b').build(),
    ];
    await repository.bulkInsert(categories);
    let entities = await repository.findBy({ is_active: true }, { field: 'name', direction: 'asc' });
    expect(entities).toStrictEqual([categories[0], categories[1]]);
    entities = await repository.findBy({ is_active: true }, { field: 'name', direction: 'desc' });
    expect(entities).toStrictEqual([categories[1], categories[0]]);
    categories[0].markAsDeleted();
    await repository.update(categories[0]);
    entities = await repository.ignoreSoftDeleted().findBy({ is_active: true }, { field: 'name', direction: 'asc' });
    expect(entities).toStrictEqual([categories[1]]);
  });

  it('should find entities by filter', async () => {
    const entity = Category.create({
      id: new CategoryId(),
      name: 'Movie',
      description: 'some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(entity);
    let entities = await repository.findBy({ id: entity.id });
    expect(entities).toHaveLength(1);
    expect(JSON.stringify(entities)).toBe(JSON.stringify([entity]));
    entities = await repository.findBy({ is_active: true });
    expect(entities).toHaveLength(0);
    entities = await repository.findBy({ id: entity.id, is_active: false });
    expect(entities).toHaveLength(1);
    expect(JSON.stringify(entities)).toBe(JSON.stringify([entity]));
    entity.markAsDeleted();
    await repository.update(entity);
    entities = await repository.ignoreSoftDeleted().findBy({ id: entity.id });
    expect(entities).toHaveLength(0);
  });

  it('should return all categories', async () => {
    const category = new Category({
      id: new CategoryId(),
      name: 'Movie',
      description: 'Some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(category);
    let output = await repository.findAll();
    expect(output).toHaveLength(1);
    expect(JSON.stringify(output)).toBe(JSON.stringify([category]));
    category.markAsDeleted();
    await repository.update(category);
    output = await repository.ignoreSoftDeleted().findAll();
    expect(output).toHaveLength(0);
  });

  it('should return a categories list by ids', async () => {
    const categories = Category.fake().theCategories(2).build();
    await repository.bulkInsert(categories);
    const { exists: foundCategories } = await repository.findByIds(categories.map((g) => g.id));
    expect(foundCategories.length).toBe(2);
    expect(foundCategories[0].toJSON()).toStrictEqual(categories[0].toJSON());
    expect(foundCategories[1].toJSON()).toStrictEqual(categories[1].toJSON());
    categories[0].markAsDeleted();
    categories[1].markAsDeleted();
    Promise.all([await repository.update(categories[0]), await repository.update(categories[1])]);
    const { exists: foundCategories2 } = await repository.ignoreSoftDeleted().findByIds(categories.map((g) => g.id));
    expect(foundCategories2.length).toBe(0);
  });

  it('should return category id that exists', async () => {
    const category = Category.fake().aCategory().build();
    await repository.insert(category);

    const existsResult1 = await repository.existsById([category.id]);
    expect(existsResult1.exists[0]).toBeValueObject(category.id);
    expect(existsResult1.not_exists).toHaveLength(0);

    const categoryId1 = new CategoryId();
    const categoryId2 = new CategoryId();
    const notExistsResult = await repository.existsById([categoryId1, categoryId2]);
    expect(notExistsResult.exists).toHaveLength(0);
    expect(notExistsResult.not_exists).toHaveLength(2);
    expect(notExistsResult.not_exists[0]).toBeValueObject(categoryId1);
    expect(notExistsResult.not_exists[1]).toBeValueObject(categoryId2);

    const existsResult2 = await repository.existsById([category.id, categoryId1]);
    expect(existsResult2.exists).toHaveLength(1);
    expect(existsResult2.not_exists).toHaveLength(1);
    expect(existsResult2.exists[0]).toBeValueObject(category.id);
    expect(existsResult2.not_exists[0]).toBeValueObject(categoryId1);

    category.markAsDeleted();
    await repository.update(category);
    const existsResult3 = await repository.ignoreSoftDeleted().existsById([category.id]);
    expect(existsResult3.exists).toHaveLength(0);
    expect(existsResult3.not_exists).toHaveLength(1);
    expect(existsResult3.not_exists[0]).toBeValueObject(category.id);
  });

  it('should throw error on update when a entity not found', async () => {
    const category = Category.fake().aCategory().build();
    await expect(repository.update(category)).rejects.toThrow(new NotFoundError(category.id.value, Category));
    category.markAsDeleted();
    await repository.insert(category);
    await expect(repository.ignoreSoftDeleted().update(category)).rejects.toThrow(
      new NotFoundError(category.id.value, Category),
    );
  });

  it('should update a entity', async () => {
    const category = Category.fake().aCategory().build();
    await repository.insert(category);
    category.changeName('Movie updated');
    await repository.update(category);
    const output = await repository.findById(category.id);
    expect(output?.toJSON()).toStrictEqual(category.toJSON());
  });

  it('should throw error on delete when a entity not found', async () => {
    const categoryId = new CategoryId();
    await expect(repository.delete(categoryId)).rejects.toThrow(new NotFoundError(categoryId.value, Category));
    const category = Category.fake().aCategory().build();
    category.markAsDeleted();
    await repository.insert(category);
    await expect(repository.ignoreSoftDeleted().delete(category.id)).rejects.toThrow(
      new NotFoundError(category.id, Category),
    );
  });

  it('should delete a entity', async () => {
    const category = new Category({
      id: new CategoryId(),
      name: 'Movie',
      description: 'Some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(category);
    await repository.delete(category.id);
    await expect(repository.findById(category.id)).resolves.toBeNull();
  });
});
