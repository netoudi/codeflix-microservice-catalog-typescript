import { CategoryId } from '@/core/category/domain/category.entity';
import { NestedCategory } from '@/core/category/domain/nested-category.entity';
import { Genre, GenreId } from '@/core/genre/domain/genre.aggregate';
import { Notification } from '@/core/shared/domain/validators/notification';
import { LoadEntityError } from '@/core/shared/domain/validators/validation.error';

export const GENRE_DOCUMENT_TYPE_NAME = 'Genre';

export type GenreDocument = {
  genre_name: string;
  categories: {
    category_id: string;
    category_name: string;
    is_active: boolean;
    deleted_at: Date | string | null;
    is_deleted: boolean;
  }[];
  is_active: boolean;
  created_at: Date | string;
  deleted_at: Date | string | null;
  type: typeof GENRE_DOCUMENT_TYPE_NAME;
};

export class GenreElasticSearchMapper {
  static toEntity(id: string, document: GenreDocument): Genre {
    if (document.type !== GENRE_DOCUMENT_TYPE_NAME) {
      throw new Error('Invalid document type');
    }

    const nestedCategories = document.categories.map(
      (category) =>
        new NestedCategory({
          category_id: new CategoryId(category.category_id),
          name: category.category_name,
          is_active: category.is_active,
          deleted_at:
            category.deleted_at === null
              ? null
              : !(category.deleted_at instanceof Date)
                ? new Date(category.deleted_at)
                : category.deleted_at,
        }),
    );

    const notification = new Notification();
    if (!nestedCategories.length) {
      notification.addError('categories should not be empty', 'categories');
    }

    const genre = new Genre({
      genre_id: new GenreId(id),
      name: document.genre_name,
      categories: new Map(nestedCategories.map((category) => [category.category_id.id, category])),
      is_active: document.is_active,
      created_at: !(document.created_at instanceof Date) ? new Date(document.created_at) : document.created_at,
      deleted_at:
        document.deleted_at === null
          ? null
          : !(document.deleted_at instanceof Date)
            ? new Date(document.deleted_at!)
            : document.deleted_at,
    });

    genre.validate();

    notification.copyErrors(genre.notification);

    if (notification.hasErrors()) {
      throw new LoadEntityError(notification.toJSON());
    }

    return genre;
  }

  static toDocument(entity: Genre): GenreDocument {
    return {
      genre_name: entity.name,
      categories: Array.from(entity.categories.values()).map((category) => ({
        category_id: category.category_id.id,
        category_name: category.name,
        is_active: category.is_active,
        deleted_at: category.deleted_at,
        is_deleted: category.deleted_at !== null,
      })),
      is_active: entity.is_active,
      created_at: entity.created_at,
      deleted_at: entity.deleted_at,
      type: GENRE_DOCUMENT_TYPE_NAME,
    };
  }
}
