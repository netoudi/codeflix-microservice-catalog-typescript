import { AggregateRoot } from '@/core/shared/domain/aggregate-root';
import { ICriteria } from '@/core/shared/domain/repository/criteria.interface';
import { SearchParams, SortDirection } from '@/core/shared/domain/repository/search-params';
import { SearchResult } from '@/core/shared/domain/repository/search-result';
import { ValueObject } from '@/core/shared/domain/value-object';

export interface IRepository<E extends AggregateRoot, EntityId extends ValueObject> {
  sortableFields: string[];
  scopes: Map<string, ICriteria>;
  insert(entity: E): Promise<void>;
  bulkInsert(entities: E[]): Promise<void>;
  update(entity: E): Promise<void>;
  delete(entityId: EntityId): Promise<void>;
  findById(entityId: EntityId): Promise<E | null>;
  findOneBy(filter: Partial<E>): Promise<E | null>;
  findBy(filter: Partial<E>, order?: { field: string; direction: SortDirection }): Promise<E[]>;
  findAll(): Promise<E[]>;
  findByIds(ids: EntityId[]): Promise<{ exists: E[]; not_exists: EntityId[] }>;
  existsById(ids: EntityId[]): Promise<{ exists: EntityId[]; not_exists: EntityId[] }>;
  ignoreSoftDeleted(): this;
  clearScopes(): this;
  getEntity(): new (...args: any[]) => E;
}

export interface ISearchableRepository<
  A extends AggregateRoot,
  AggregateId extends ValueObject,
  Filter = string,
  SearchInput = SearchParams<Filter>,
  SearchOutput = SearchResult<A>,
> extends IRepository<A, AggregateId> {
  sortableFields: string[];
  search(props: SearchInput): Promise<SearchOutput>;
  searchByCriteria(criterias: ICriteria[]): Promise<SearchOutput>;
}
