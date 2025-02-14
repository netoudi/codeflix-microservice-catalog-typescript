import { Category, CategoryId } from '@/core/category/domain/category.entity';
import {
  CATEGORY_DOCUMENT_TYPE_NAME,
  CategoryDocument,
  CategoryElasticSearchMapper,
} from '@/core/category/infra/db/elastic-search/category-elastic-search.mapper';

describe('CategoryElasticSearchMapper Unit Tests', () => {
  let categoryDocument: CategoryDocument;
  let category: Category;

  beforeEach(() => {
    categoryDocument = {
      category_name: 'Test',
      category_description: 'Test description',
      is_active: true,
      created_at: new Date(),
      deleted_at: null,
      type: CATEGORY_DOCUMENT_TYPE_NAME,
    };
    const id = new CategoryId();
    category = new Category({
      id: id,
      name: categoryDocument.category_name,
      description: categoryDocument.category_description,
      is_active: categoryDocument.is_active,
      created_at: categoryDocument.created_at as Date,
    });
  });

  describe('toEntity', () => {
    it('should convert document to entity', () => {
      const result = CategoryElasticSearchMapper.toEntity(category.id.value, categoryDocument);
      expect(result).toEqual(category);
      categoryDocument.deleted_at = new Date();
      category.deleted_at = categoryDocument.deleted_at;
      const result2 = CategoryElasticSearchMapper.toEntity(category.id.value, categoryDocument);
      expect(result2).toEqual(category);
    });
  });

  describe('toDocument', () => {
    it('should convert entity to document', () => {
      const result = CategoryElasticSearchMapper.toDocument(category);
      expect(result).toEqual(categoryDocument);
      category.deleted_at = new Date();
      categoryDocument.deleted_at = category.deleted_at;
      const result2 = CategoryElasticSearchMapper.toDocument(category);
      expect(result2).toEqual(categoryDocument);
    });
  });
});
