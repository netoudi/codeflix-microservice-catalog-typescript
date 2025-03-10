import { Category } from '@/core/category/domain/category.entity';
import { NestedCategory } from '@/core/category/domain/nested-category.entity';
import { CategoryElasticSearchRepository } from '@/core/category/infra/db/elastic-search/category-elastic-search.repository';
import { SaveGenreInput } from '@/core/genre/application/use-cases/save-genre/save-genre.input';
import { SaveGenreUseCase } from '@/core/genre/application/use-cases/save-genre/save-genre.use-case';
import { Genre, GenreId } from '@/core/genre/domain/genre.aggregate';
import { GenreElasticSearchRepository } from '@/core/genre/infra/db/elastic-search/genre-elastic-search.repository';
import { setupElasticsearch } from '@/core/shared/infra/testing/global-helpers';

describe('SaveGenreUseCase Integration Tests', () => {
  let useCase: SaveGenreUseCase;
  let genreRepo: GenreElasticSearchRepository;
  let categoryRepo: CategoryElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    genreRepo = new GenreElasticSearchRepository(esHelper.esClient, esHelper.indexName);
    categoryRepo = new CategoryElasticSearchRepository(esHelper.esClient, esHelper.indexName);
    useCase = new SaveGenreUseCase(genreRepo, categoryRepo);
  });

  it('should create a genre', async () => {
    const category = Category.fake().aCategory().build();
    await categoryRepo.insert(category);
    const uuid = '4e9e2e4e-0d1a-4a4b-8c0a-5b0e4e4e4e4e';
    const created_at = new Date();
    const output = await useCase.execute(
      new SaveGenreInput({
        genre_id: uuid,
        name: 'test',
        categories_id: [category.category_id.id],
        is_active: false,
        created_at: created_at,
      }),
    );
    expect(output).toStrictEqual({
      id: uuid,
      created: true,
    });
    const entity = await genreRepo.findById(new GenreId(uuid));
    expect(entity).toMatchObject({
      name: 'test',
      categories: new Map([
        [
          category.category_id.id,
          new NestedCategory({
            category_id: category.category_id,
            name: category.name,
            is_active: category.is_active,
            deleted_at: null,
          }),
        ],
      ]),
      is_active: false,
      created_at,
    });
  });

  it('should update a genre', async () => {
    const created_at = new Date();
    const genre = Genre.fake().aGenre().build();
    await genreRepo.insert(genre);
    const category = Category.fake().aCategory().build();
    await categoryRepo.insert(category);
    const output = await useCase.execute(
      new SaveGenreInput({
        genre_id: genre.genre_id.id,
        name: 'test',
        categories_id: [category.category_id.id],
        is_active: false,
        created_at: created_at,
      }),
    );
    expect(output).toStrictEqual({
      id: genre.genre_id.id,
      created: false,
    });
    const entity = await genreRepo.findById(genre.genre_id);
    expect(entity).toMatchObject({
      name: 'test',
      categories: new Map([
        [
          category.category_id.id,
          new NestedCategory({
            category_id: category.category_id,
            name: category.name,
            is_active: category.is_active,
            deleted_at: null,
          }),
        ],
      ]),
      is_active: false,
      created_at,
    });
  });
});
