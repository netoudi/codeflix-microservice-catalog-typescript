import { Genre, GenreId } from '@/core/genre/domain/genre.aggregate';
import { IRepository } from '@/core/shared/domain/repository/repository-interface';

export interface IGenreRepository extends IRepository<Genre, GenreId> {}
