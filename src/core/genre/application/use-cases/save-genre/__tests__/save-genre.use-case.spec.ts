import { Category, CategoryId } from '@/core/category/domain/category.entity';
import { CategoryInMemoryRepository } from '@/core/category/infra/db/in-memory/category-in-memory.repository';
import { SaveGenreInput } from '@/core/genre/application/use-cases/save-genre/save-genre.input';
import { SaveGenreUseCase } from '@/core/genre/application/use-cases/save-genre/save-genre.use-case';
import { Genre, GenreId } from '@/core/genre/domain/genre.aggregate';
import { GenreInMemoryRepository } from '@/core/genre/infra/db/in-memory/genre-in-memory.repository';
import { InvalidUuidError } from '@/core/shared/domain/value-objects/uuid.vo';

describe('SaveGenreUseCase Unit Tests', () => {
  let useCase: SaveGenreUseCase;
  let genreRepo: GenreInMemoryRepository;
  let categoryRepo: CategoryInMemoryRepository;

  beforeEach(() => {
    genreRepo = new GenreInMemoryRepository();
    categoryRepo = new CategoryInMemoryRepository();
    useCase = new SaveGenreUseCase(genreRepo, categoryRepo);
  });

  it('should call createGenre method when genre not exists in database', async () => {
    useCase['createGenre'] = jest.fn();
    const input = new SaveGenreInput({
      genre_id: new GenreId().id,
      name: 'test',
      categories_id: [new CategoryId().id],
      is_active: false,
      created_at: new Date(),
    });
    await useCase.execute(input);
    expect(useCase['createGenre']).toHaveBeenCalledTimes(1);
    expect(useCase['createGenre']).toHaveBeenCalledWith(input);
  });

  it('should call updateGenre method when genre exists in database', async () => {
    useCase['updateGenre'] = jest.fn();
    const genre = Genre.fake().aGenre().build();
    genreRepo.insert(genre);
    const input = new SaveGenreInput({
      genre_id: genre.genre_id.id,
      name: 'test',
      categories_id: [new CategoryId().id],
      is_active: false,
      created_at: new Date(),
    });
    await useCase.execute(input);
    expect(useCase['updateGenre']).toHaveBeenCalledTimes(1);
    expect(useCase['updateGenre']).toHaveBeenCalledWith(input, expect.any(Genre));
  });

  describe('getCategoriesProps', () => {
    it('should throw an error when category is not found', async () => {
      try {
        await useCase['getCategoriesProps'](['fake id']);
        fail('should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidUuidError);
      }
    });

    it('should return an array of NestedCategoryConstructorProps', async () => {
      const category = Category.fake().aCategory().build();
      await categoryRepo.insert(category);
      const categoriesProps = await useCase['getCategoriesProps']([category.category_id.id]);
      expect(categoriesProps).toStrictEqual([
        {
          category_id: category.category_id,
          name: category.name,
          is_active: category.is_active,
          created_at: category.created_at,
        },
      ]);
    });
  });

  describe('execute createGenre method', () => {
    it('should throw an error when entity is not valid', async () => {
      const spyCreateGenre = jest.spyOn(useCase, 'createGenre' as any);
      const input = new SaveGenreInput({
        genre_id: new GenreId().id,
        name: 't'.repeat(256),
        categories_id: [new CategoryId().id],
        is_active: false,
        created_at: new Date(),
      });
      await expect(() => useCase.execute(input)).rejects.toThrowError('Entity Validation Error');
      expect(spyCreateGenre).toHaveBeenCalledTimes(1);
    });

    it('should create a genre', async () => {
      const category = Category.fake().aCategory().build();
      await categoryRepo.insert(category);
      const spyInsert = jest.spyOn(genreRepo, 'insert');
      const genreId = new GenreId().id;
      const input = new SaveGenreInput({
        genre_id: genreId,
        name: 'test',
        categories_id: [category.category_id.id],
        is_active: false,
        created_at: new Date(),
      });
      const output = await useCase.execute(input);
      expect(spyInsert).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: genreId,
        created: true,
      });
    });
  });

  describe('execute calling updateGenre method', () => {
    it('should throw an error when entity is not valid', async () => {
      const genre = Genre.fake().aGenre().build();
      genreRepo.items.push(genre);
      const input = new SaveGenreInput({
        genre_id: genre.genre_id.id,
        name: 't'.repeat(256),
        categories_id: [new CategoryId().id],
        is_active: false,
        created_at: new Date(),
      });
      await expect(() => useCase.execute(input)).rejects.toThrowError('Entity Validation Error');
    });

    it('should update a genre', async () => {
      const spyUpdate = jest.spyOn(genreRepo, 'update');
      const genre = Genre.fake().aGenre().build();
      genreRepo.items.push(genre);
      const category = Category.fake().aCategory().build();
      await categoryRepo.insert(category);
      const input = new SaveGenreInput({
        genre_id: genre.genre_id.id,
        name: 'test',
        categories_id: [category.category_id.id],
        is_active: false,
        created_at: new Date(),
      });
      const output = await useCase.execute(input);
      expect(spyUpdate).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: genreRepo.items[0].genre_id.id,
        created: false,
      });
    });
  });
});
