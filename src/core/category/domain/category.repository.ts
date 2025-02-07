import { Category, CategoryId } from '@/core/category/domain/category.entity';
import { ISearchableRepository } from '@/core/shared/domain/repository/repository-interface';
import { SearchParams, SearchParamsConstructor } from '@/core/shared/domain/repository/search-params';
import { SearchResult } from '@/core/shared/domain/repository/search-result';

export type CategoryFilter = {
  name?: string | null;
  is_active?: boolean;
};

export type CategorySearchParamsCreateCommand = Omit<SearchParamsConstructor<CategoryFilter>, 'filter'> & {
  filter?: CategoryFilter | null;
};

export class CategorySearchParams extends SearchParams<CategoryFilter> {
  private constructor(props: SearchParamsConstructor<CategoryFilter>) {
    super(props);
  }

  static create(props: CategorySearchParamsCreateCommand = {}) {
    return new CategorySearchParams({
      ...props,
      filter: {
        name: props.filter?.name,
        is_active: props.filter?.is_active,
      },
    });
  }

  get filter(): CategoryFilter | null {
    return this._filter;
  }

  protected set filter(value: CategoryFilter | null) {
    const _value = !value || (value as unknown) === '' || typeof value !== 'object' ? null : value;
    const filter = {
      ...(_value && _value.name && { name: `${_value?.name}` }),
      ...(_value &&
        _value.is_active !== undefined && {
          is_active:
            _value.is_active === ('true' as any) ||
            _value.is_active === true ||
            _value.is_active === (1 as any) ||
            _value.is_active === ('1' as any),
        }),
    };
    this._filter = Object.keys(filter).length === 0 ? null : filter;
  }
}

export class CategorySearchResult extends SearchResult<Category> {}

export interface ICategoryRepository
  extends ISearchableRepository<Category, CategoryId, CategoryFilter, CategorySearchParams, CategorySearchResult> {}
