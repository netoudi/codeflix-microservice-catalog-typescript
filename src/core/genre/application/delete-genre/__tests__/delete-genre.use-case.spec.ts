import { Category } from '@/core/category/domain/category.entity';
import { DeleteGenreUseCase } from '@/core/genre/application/delete-genre/delete-genre.use-case';
import { Genre, GenreId } from '@/core/genre/domain/genre.aggregate';
import { GenreInMemoryRepository } from '@/core/genre/infra/db/in-memory/genre-in-memory.repository';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';

describe('DeleteGenreUseCase Unit Tests', () => {
  let useCase: DeleteGenreUseCase;
  let repository: GenreInMemoryRepository;

  beforeEach(() => {
    repository = new GenreInMemoryRepository();
    useCase = new DeleteGenreUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const genreId = new GenreId();

    await expect(() => useCase.execute(genreId.id)).rejects.toThrow(new NotFoundError(genreId.id, Genre));
  });

  it('should delete a genre', async () => {
    const items = [
      Genre.create({
        genre_id: new GenreId(),
        name: 'Movie',
        categories_props: [Category.fake().aNestedCategory().build()],
        is_active: true,
        created_at: new Date(),
      }),
    ];
    repository.items = items;
    await useCase.execute(items[0].genre_id.id);
    expect(repository.ignoreSoftDeleted().findAll()).resolves.toHaveLength(0);
  });
});
