import { ListAllCategoriesUseCase } from '@/core/category/application/use-cases/list-all-categories/list-all-categories.use-case';
import { Category } from '@/core/category/domain/category.entity';
import { CategoryElasticSearchRepository } from '@/core/category/infra/db/elastic-search/category-elastic-search.repository';
import { setupElasticsearch } from '@/core/shared/infra/testing/global-helpers';

describe('ListAllCategoriesUseCase Integration Tests', () => {
  let useCase: ListAllCategoriesUseCase;
  let repository: CategoryElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    repository = new CategoryElasticSearchRepository(esHelper.esClient, esHelper.indexName);
    useCase = new ListAllCategoriesUseCase(repository);
  });

  it('should list all categories', async () => {
    const category1 = Category.fake().aCategory().build();
    const category2 = Category.fake().aCategory().build();
    await repository.insert(category1);
    await repository.insert(category2);
    const output = await useCase.execute();
    expect(output).toHaveLength(2);
    expect(output).toContainEqual({
      id: category1.id.value,
      name: category1.name,
      description: category1.description,
      is_active: category1.is_active,
      created_at: category1.created_at,
      deleted_at: null,
    });
    expect(output).toContainEqual({
      id: category2.id.value,
      name: category2.name,
      description: category2.description,
      is_active: category2.is_active,
      created_at: category2.created_at,
      deleted_at: null,
    });
  });
});
