import { Category, CategoryId } from '@/core/category/domain/category.entity';
import { LoadEntityError } from '@/core/shared/domain/validators/validation.error';

export const CATEGORY_DOCUMENT_TYPE_NAME = 'category';

export type CategoryDocument = {
  category_name: string;
  category_description: string | null;
  is_active: boolean;
  created_at: Date | string;
  type: typeof CATEGORY_DOCUMENT_TYPE_NAME;
};

export class CategoryElasticSearchMapper {
  static toEntity(id: string, document: CategoryDocument): Category {
    if (document.type !== CATEGORY_DOCUMENT_TYPE_NAME) {
      throw new Error('Invalid document type');
    }
    const category = new Category({
      id: new CategoryId(id),
      name: document.category_name,
      description: document.category_description,
      is_active: document.is_active,
      created_at: !(document.created_at instanceof Date) ? new Date(document.created_at) : document.created_at,
    });
    category.validate();
    if (category.notification.hasErrors()) {
      throw new LoadEntityError(category.notification.toJSON());
    }
    return category;
  }

  static toDocument(category: Category): CategoryDocument {
    return {
      category_name: category.name,
      category_description: category.description,
      is_active: category.is_active,
      created_at: category.created_at,
      type: CATEGORY_DOCUMENT_TYPE_NAME,
    };
  }
}
