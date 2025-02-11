import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Category, CategoryId } from '@/core/category/domain/category.entity';
import {
  CATEGORY_DOCUMENT_TYPE_NAME,
  CategoryElasticSearchMapper,
} from '@/core/category/infra/db/elastic-search/category-elastic-search.mapper';
import { CategoryElasticSearchRepository } from '@/core/category/infra/db/elastic-search/category-elastic-search.repository';

describe('CategoryElasticSearchRepository Integration Tests', () => {
  const esClient = new ElasticsearchService({ node: 'http://host.docker.internal:9200' });
  let repository: CategoryElasticSearchRepository;

  beforeEach(async () => {
    await esClient.indices.create({ index: CATEGORY_DOCUMENT_TYPE_NAME });
    repository = new CategoryElasticSearchRepository(esClient, CATEGORY_DOCUMENT_TYPE_NAME);
  });

  afterEach(async () => {
    await esClient.indices.delete({ index: CATEGORY_DOCUMENT_TYPE_NAME });
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
});
