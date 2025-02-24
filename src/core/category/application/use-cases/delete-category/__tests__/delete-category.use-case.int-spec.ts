import { DeleteCategoryUseCase } from '@/core/category/application/use-cases/delete-category/delete-category.use-case';
import { Category, CategoryId } from '@/core/category/domain/category.entity';
import { CategoryElasticSearchRepository } from '@/core/category/infra/db/elastic-search/category-elastic-search.repository';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { setupElasticsearch } from '@/core/shared/infra/testing/global-helpers';

describe('DeleteCategoryUseCase Integration Tests', () => {
  let useCase: DeleteCategoryUseCase;
  let repository: CategoryElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    repository = new CategoryElasticSearchRepository(esHelper.esClient, esHelper.indexName);
    useCase = new DeleteCategoryUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const categoryId = new CategoryId();
    await expect(() => useCase.execute({ id: categoryId.value })).rejects.toThrow(
      new NotFoundError(categoryId.value, Category),
    );
  });

  it('should throw an error when there is only one category not deleted in related and a only category valid is being deleted', async () => {
    const category = Category.fake().aCategory().build();
    await repository.insert(category);
    await esHelper.esClient.create({
      index: esHelper.indexName,
      id: '1',
      body: {
        categories: [
          {
            category_id: category.category_id.id,
            category_name: 'test',
            is_active: true,
            deleted_at: null,
            is_deleted: false,
          },
        ],
      },
      refresh: true,
    });
    await expect(() => useCase.execute({ id: category.category_id.id })).rejects.toThrow(
      'At least one category must be present in related.',
    );
  });

  it('should delete a category', async () => {
    const category = Category.fake().aCategory().build();
    await repository.insert(category);
    await useCase.execute({ id: category.id.value });
    const result = await repository.findById(category.id);
    expect(result?.deleted_at).not.toBeNull();
  });
});
