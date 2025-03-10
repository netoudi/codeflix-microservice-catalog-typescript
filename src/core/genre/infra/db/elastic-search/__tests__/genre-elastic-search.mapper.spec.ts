import { CategoryId } from '@/core/category/domain/category.entity';
import { NestedCategory } from '@/core/category/domain/nested-category.entity';
import { Genre, GenreId } from '@/core/genre/domain/genre.aggregate';
import {
  GENRE_DOCUMENT_TYPE_NAME,
  GenreDocument,
  GenreElasticSearchMapper,
} from '@/core/genre/infra/db/elastic-search/genre-elastic-search.mapper';

describe('GenreElasticSearchMapper Unit Tests', () => {
  let genreDocument: GenreDocument;
  let genre: Genre;

  beforeEach(() => {
    genreDocument = {
      genre_name: 'Test',
      categories: [
        {
          category_id: '6b4f4b3b-1b7b-4b6b-8b1b-7b4b3b1b7b4b',
          category_name: 'Test',
          is_active: true,
          deleted_at: null,
          is_deleted: false,
        },
      ],
      is_active: true,
      created_at: new Date(),
      deleted_at: null,
      type: GENRE_DOCUMENT_TYPE_NAME,
    };
    const id = new GenreId();

    genre = new Genre({
      genre_id: id,
      name: genreDocument.genre_name,
      categories: new Map(
        genreDocument.categories
          .map(
            (category) =>
              new NestedCategory({
                category_id: new CategoryId(category.category_id),
                name: category.category_name,
                is_active: category.is_active,
                deleted_at: category.deleted_at as null,
              }),
          )
          .map((category) => [category.category_id.id, category]),
      ),
      is_active: genreDocument.is_active,
      created_at: genreDocument.created_at as Date,
    });
  });

  describe('toEntity', () => {
    it('should convert document to entity', () => {
      const result = GenreElasticSearchMapper.toEntity(genre.genre_id.id, genreDocument);
      expect(result).toEqual(genre);

      genreDocument.deleted_at = new Date();
      genre.deleted_at = genreDocument.deleted_at;

      const result2 = GenreElasticSearchMapper.toEntity(genre.genre_id.id, genreDocument);
      expect(result2).toEqual(genre);

      genreDocument.categories[0].deleted_at = new Date();
      genre.categories.get(genreDocument.categories[0].category_id)!.deleted_at =
        genreDocument.categories[0].deleted_at;

      const result3 = GenreElasticSearchMapper.toEntity(genre.genre_id.id, genreDocument);
      expect(result3).toEqual(genre);
    });
  });

  describe('toDocument', () => {
    it('should convert entity to document', () => {
      const result = GenreElasticSearchMapper.toDocument(genre);
      expect(result).toEqual(genreDocument);

      genre.deleted_at = new Date();
      genreDocument.deleted_at = genre.deleted_at;

      const result2 = GenreElasticSearchMapper.toDocument(genre);
      expect(result2).toEqual(genreDocument);

      genre.categories.get(genreDocument.categories[0].category_id)!.deleted_at = new Date();
      genreDocument.categories[0].deleted_at = genre.categories.get(
        genreDocument.categories[0].category_id,
      )!.deleted_at;

      const result3 = GenreElasticSearchMapper.toDocument(genre);
      expect(result3).toEqual({
        ...genreDocument,
        categories: [
          {
            ...genreDocument.categories[0],
            is_deleted: true,
          },
        ],
      });
    });
  });
});
