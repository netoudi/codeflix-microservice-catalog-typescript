import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ElasticsearchContainer, StartedElasticsearchContainer } from '@testcontainers/elasticsearch';
import { Category, CategoryId } from '@/core/category/domain/category.entity';
import {
  CATEGORY_DOCUMENT_TYPE_NAME,
  CategoryElasticSearchMapper,
} from '@/core/category/infra/db/elastic-search/category-elastic-search.mapper';
import { CategoryElasticSearchRepository } from '@/core/category/infra/db/elastic-search/category-elastic-search.repository';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { esMapping } from '@/core/shared/infra/db/elastic-search/es-mapping';

describe('CategoryElasticSearchRepository Integration Tests', () => {
  let esClient: ElasticsearchService;
  let startedContainer: StartedElasticsearchContainer;
  let repository: CategoryElasticSearchRepository;

  beforeEach(async () => {
    const esContainer = new ElasticsearchContainer('elasticsearch:7.17.7');
    startedContainer = await esContainer.start();
    esClient = new ElasticsearchService({ node: startedContainer.getHttpUrl() });
    await esClient.indices.create({ index: CATEGORY_DOCUMENT_TYPE_NAME });
    await esClient.indices.putMapping({ index: CATEGORY_DOCUMENT_TYPE_NAME, body: esMapping });
    repository = new CategoryElasticSearchRepository(esClient, CATEGORY_DOCUMENT_TYPE_NAME);
  }, 60000);

  afterEach(async () => {
    await esClient.indices.delete({ index: CATEGORY_DOCUMENT_TYPE_NAME });
    await startedContainer.stop();
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
    const document = await esClient.get({ index: CATEGORY_DOCUMENT_TYPE_NAME, id: category.id.value });
    const entity = CategoryElasticSearchMapper.toEntity(category.id.value, document.body._source);
    expect(entity.toJSON()).toStrictEqual(category.toJSON());
  });

  it('should insert many entities', async () => {
    const categories = Category.fake().theCategories(2).build();
    await repository.bulkInsert(categories);
    const result = await Promise.all(
      categories.map((category) => esClient.get({ index: CATEGORY_DOCUMENT_TYPE_NAME, id: category.id.value })),
    );
    const entities = result.map((doc) => CategoryElasticSearchMapper.toEntity(doc.body._id, doc.body._source));
    expect(entities.length).toBe(2);
    expect(entities[0].toJSON()).toStrictEqual(categories[0].toJSON());
    expect(entities[1].toJSON()).toStrictEqual(categories[1].toJSON());
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
