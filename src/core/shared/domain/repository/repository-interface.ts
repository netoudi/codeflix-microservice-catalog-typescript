import { AggregateRoot } from '@/core/shared/domain/aggregate-root';
import { Entity } from '@/core/shared/domain/entity';
import { SearchParams, SortDirection } from '@/core/shared/domain/repository/search-params';
import { SearchResult } from '@/core/shared/domain/repository/search-result';
import { ValueObject } from '@/core/shared/domain/value-object';

export interface IRepository<E extends AggregateRoot, EntityId extends ValueObject> {
  sortableFields: string[];
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
  getEntity(): new (...args: any[]) => E;
}

export interface ISearchableRepository<
  E extends Entity,
  EntityId extends ValueObject,
  Filter = string,
  SearchInput = SearchParams<Filter>,
  SearchOutput = SearchResult,
> extends IRepository<E, EntityId> {
  sortableFields: string[];
  search(props: SearchInput): Promise<SearchOutput>;
}
