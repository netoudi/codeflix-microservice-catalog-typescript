import { DeleteGenreUseCase } from '@/core/genre/application/delete-genre/delete-genre.use-case';
import { Genre, GenreId } from '@/core/genre/domain/genre.aggregate';
import { GenreElasticSearchRepository } from '@/core/genre/infra/db/elastic-search/genre-elastic-search.repository';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { setupElasticsearch } from '@/core/shared/infra/testing/global-helpers';

describe('DeleteGenreUseCase Integration Tests', () => {
  let useCase: DeleteGenreUseCase;
  let repository: GenreElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    repository = new GenreElasticSearchRepository(esHelper.esClient, esHelper.indexName);
    useCase = new DeleteGenreUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const genreId = new GenreId();
    await expect(() => useCase.execute(genreId.id)).rejects.toThrow(new NotFoundError(genreId.id, Genre));
  });

  it('should delete a genre', async () => {
    const genre = Genre.fake().aGenre().build();
    await repository.insert(genre);
    await useCase.execute(genre.genre_id.id);
    const noEntity = await repository.ignoreSoftDeleted().findById(genre.genre_id);
    expect(noEntity).toBeNull();
  });
});
