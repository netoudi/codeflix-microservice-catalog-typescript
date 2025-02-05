import { CategoryOutputMapper } from '@/core/category/application/use-cases/common/category-output.mapper';
import { Category } from '@/core/category/domain/category.entity';
import { CategorySearchResult } from '@/core/category/domain/category.repository';

describe('CategoryOutputMapper Unit Tests', () => {
  it('should convert a category in output', () => {
    const category = Category.fake().aCategory().build();
    const output = CategoryOutputMapper.toOutput(category);
    expect(output).toStrictEqual({
      id: category.id.value,
      name: category.name,
      description: category.description,
      is_active: category.is_active,
      created_at: category.created_at,
    });
  });

  it('should convert search result to pagination', () => {
    let result = new CategorySearchResult({
      items: [],
      total: 0,
      current_page: 1,
      per_page: 1,
    });
    let output = CategoryOutputMapper.toPagination(result);
    expect(output).toStrictEqual({
      items: [],
      total: result.total,
      current_page: result.current_page,
      per_page: result.per_page,
      last_page: result.last_page,
    });
    result = new CategorySearchResult({
      items: Category.fake().theCategories(3).build(),
      total: 3,
      current_page: 1,
      per_page: 15,
    });
    output = CategoryOutputMapper.toPagination(result);
    expect(output).toStrictEqual({
      items: result.items.map(CategoryOutputMapper.toOutput),
      total: result.total,
      current_page: result.current_page,
      per_page: result.per_page,
      last_page: result.last_page,
    });
  });
});
