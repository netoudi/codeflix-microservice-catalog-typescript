import { Category, CategoryId } from '@/core/category/domain/category.entity';
import { ICategoryRepository } from '@/core/category/domain/category.repository';
import { NestedCategoryConstructorProps } from '@/core/category/domain/nested-category.entity';
import { SaveGenreInput } from '@/core/genre/application/use-cases/save-genre/save-genre.input';
import { Genre, GenreId } from '@/core/genre/domain/genre.aggregate';
import { IGenreRepository } from '@/core/genre/domain/genre.repository';
import { IUseCase } from '@/core/shared/application/use-case.interface';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { EntityValidationError } from '@/core/shared/domain/validators/validation.error';

export class SaveGenreUseCase implements IUseCase<SaveGenreInput, SaveGenreOutput> {
  constructor(
    private genreRepo: IGenreRepository,
    private categoryRepo: ICategoryRepository,
  ) {}

  async execute(input: SaveGenreInput): Promise<SaveGenreOutput> {
    const genreId = new GenreId(input.genre_id);
    const genre = await this.genreRepo.findById(genreId);

    return genre ? this.updateGenre(input, genre) : this.createGenre(input);
  }

  private async createGenre(input: SaveGenreInput) {
    const nestedCategoriesProps = await this.getCategoriesProps(input.categories_id);

    const entity = Genre.create({
      genre_id: new GenreId(input.genre_id),
      name: input.name,
      categories_props: nestedCategoriesProps,
      is_active: input.is_active,
      created_at: input.created_at,
    });

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.genreRepo.insert(entity);
    return { id: entity.genre_id.id, created: true };
  }

  private async updateGenre(input: SaveGenreInput, genre: Genre) {
    if (!genre) {
      throw new NotFoundError(input.genre_id, Genre);
    }

    genre.changeName(input.name);
    const nestedCategoriesProps = await this.getCategoriesProps(input.categories_id);
    genre.syncNestedCategories(nestedCategoriesProps);

    input.is_active === true ? genre.activate() : genre.deactivate();

    genre.changeCreatedAt(input.created_at);

    if (genre.notification.hasErrors()) {
      throw new EntityValidationError(genre.notification.toJSON());
    }

    await this.genreRepo.update(genre);

    return { id: genre.genre_id.id, created: false };
  }

  private async getCategoriesProps(categoriesId: string[]): Promise<NestedCategoryConstructorProps[]> {
    const { exists: categoriesExists, not_exists: notCategoriesExists } = await this.categoryRepo
      .ignoreSoftDeleted()
      .findByIds(categoriesId.map((id) => new CategoryId(id)));

    if (notCategoriesExists.length) {
      throw new EntityValidationError([
        {
          categories_id: notCategoriesExists.map((vo) => new NotFoundError(vo.id, Category).message),
        },
      ]);
    }

    return categoriesExists.map((category) => ({
      category_id: category.category_id,
      name: category.name,
      is_active: category.is_active,
      created_at: category.created_at,
    }));
  }
}

export type SaveGenreOutput = { id: string; created: boolean };
