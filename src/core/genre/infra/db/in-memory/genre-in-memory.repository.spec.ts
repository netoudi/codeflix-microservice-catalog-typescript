import { Genre } from '@/core/genre/domain/genre.aggregate';
import { GenreInMemoryRepository } from '@/core/genre/infra/db/in-memory/genre-in-memory.repository';

describe('GenreInMemoryRepository', () => {
  let repository: GenreInMemoryRepository;

  beforeEach(() => (repository = new GenreInMemoryRepository()));

  it('should getEntity return Genre Entity', async () => {
    expect(repository.getEntity()).toStrictEqual(Genre);
  });
});
