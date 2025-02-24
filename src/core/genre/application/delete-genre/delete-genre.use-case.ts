import { Genre, GenreId } from '@/core/genre/domain/genre.aggregate';
import { IGenreRepository } from '@/core/genre/domain/genre.repository';
import { IUseCase } from '@/core/shared/application/use-case.interface';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';

export class DeleteGenreUseCase implements IUseCase<string, void> {
  constructor(private genreRepository: IGenreRepository) {}

  async execute(id: string): Promise<void> {
    const genre = await this.genreRepository.findById(new GenreId(id));

    if (!genre) {
      throw new NotFoundError(id, Genre);
    }

    genre.markAsDeleted();

    await this.genreRepository.update(genre);
  }
}
