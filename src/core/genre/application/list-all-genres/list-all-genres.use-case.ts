import { GenreOutput, GenreOutputMapper } from '@/core/genre/application/use-cases/common/genre-output';
import { IGenreRepository } from '@/core/genre/domain/genre.repository';
import { SearchInput } from '@/core/shared/application/search-input';
import { IUseCase } from '@/core/shared/application/use-case.interface';

export class ListAllGenresUseCase implements IUseCase<ListGenresInput, ListGenresOutput> {
  constructor(private genreRepo: IGenreRepository) {}

  async execute(): Promise<ListGenresOutput> {
    const genres = await this.genreRepo.ignoreSoftDeleted().findBy(
      {
        is_active: true,
      },
      { field: 'name', direction: 'asc' },
    );
    return genres.map(GenreOutputMapper.toOutput);
  }
}

export type ListGenresInput = SearchInput;

export type ListGenresOutput = GenreOutput[];
