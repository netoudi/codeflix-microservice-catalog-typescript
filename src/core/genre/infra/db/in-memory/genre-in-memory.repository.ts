import { Genre, GenreId } from '@/core/genre/domain/genre.aggregate';
import { IGenreRepository } from '@/core/genre/domain/genre.repository';
import { InMemoryRepository } from '@/core/shared/infra/db/in-memory/in-memory.repository';

export class GenreInMemoryRepository extends InMemoryRepository<Genre, GenreId> implements IGenreRepository {
  sortableFields: string[] = ['name', 'created_at'];

  getEntity(): new (...args: any[]) => Genre {
    return Genre;
  }
}
