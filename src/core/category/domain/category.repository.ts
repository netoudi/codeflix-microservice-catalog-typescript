import { Category, CategoryId } from '@/core/category/domain/category.entity';
import { ISearchableRepository } from '@/core/shared/domain/repository/repository-interface';
import { SearchParams } from '@/core/shared/domain/repository/search-params';
import { SearchResult } from '@/core/shared/domain/repository/search-result';

export type CategoryFilter = string;

export class CategorySearchParams extends SearchParams<CategoryFilter> {}

export class CategorySearchResult extends SearchResult<Category> {}

export interface ICategoryRepository
  extends ISearchableRepository<Category, CategoryId, CategoryFilter, CategorySearchParams, CategorySearchResult> {}
