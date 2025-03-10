import { Category } from '@/core/category/domain/category.entity';
import { GenreOutputMapper } from '@/core/genre/application/use-cases/common/genre-output';
import { Genre, GenreId } from '@/core/genre/domain/genre.aggregate';

describe('GenreOutputMapper Unit Tests', () => {
  it('should convert a genre in output', () => {
    const genre = Genre.create({
      genre_id: new GenreId(),
      name: 'Comedy',
      categories_props: [Category.fake().aNestedCategory().build()],
      is_active: true,
      created_at: new Date(),
    });

    const output = GenreOutputMapper.toOutput(genre);

    expect(output).toEqual({
      id: genre.genre_id.id,
      name: genre.name,
      categories: Array.from(genre.categories.values()).map((category) => {
        return {
          id: category.category_id.id,
          name: category.name,
          is_active: category.is_active,
          deleted_at: category.deleted_at,
        };
      }),
      is_active: genre.is_active,
      created_at: genre.created_at,
    });
  });
});
