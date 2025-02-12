import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Category, CategoryId } from '@/core/category/domain/category.entity';
import {
  CATEGORY_DOCUMENT_TYPE_NAME,
  CategoryElasticSearchMapper,
} from '@/core/category/infra/db/elastic-search/category-elastic-search.mapper';
import { CategoryElasticSearchRepository } from '@/core/category/infra/db/elastic-search/category-elastic-search.repository';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { setupElasticsearch } from '@/core/shared/infra/testing/global-helpers';

describe('CategoryElasticSearchRepository Integration Tests', () => {
  let esClient: ElasticsearchService;
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
    const output = await repository.findAll();
    expect(output.length).toBe(2);
    expect(output[0].toJSON()).toStrictEqual(categories[0].toJSON());
    expect(output[1].toJSON()).toStrictEqual(categories[1].toJSON());
  });

  it('should find a entity by id', async () => {
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
    expect(repository.findById(new CategoryId())).resolves.toBeNull();
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
  });

  it('should find entities by filter an order', async () => {
    const categories = [
      Category.fake().aCategory().withName('a').build(),
      Category.fake().aCategory().withName('b').build(),
    ];
    await repository.bulkInsert(categories);
    const output = await repository.findBy({ is_active: true }, { field: 'name', direction: 'asc' });
    expect(output).toStrictEqual([categories[0], categories[1]]);
  });

  it('should find all entities', async () => {
    const category = new Category({
      id: new CategoryId(),
      name: 'Movie',
      description: 'Some description',
      is_active: false,
      created_at: new Date(),
    });
    await repository.insert(category);
    const output = await repository.findAll();
    expect(output).toHaveLength(1);
    expect(JSON.stringify(output)).toBe(JSON.stringify([category]));
  });

  it('should return a entities list by ids', async () => {
    const categories = Category.fake().theCategories(2).build();
    await repository.bulkInsert(categories);
    const output = await repository.findByIds(categories.map((category) => category.id));
    expect(output.exists).toHaveLength(2);
    expect(output.not_exists).toHaveLength(0);
    expect(JSON.stringify(output.exists)).toBe(JSON.stringify(categories));
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
  });

  it('should throw error on update when a entity not found', async () => {
    const category = Category.fake().aCategory().build();
    await expect(repository.update(category)).rejects.toThrow(new NotFoundError(category.id.value, Category));
  });

  it('should update a entity', async () => {
    const category = Category.fake().aCategory().build();
    await repository.insert(category);
    category.changeName('Movie updated');
    await repository.update(category);
    const output = await repository.findById(category.id);
    expect(output?.toJSON()).toStrictEqual(category.toJSON());
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
