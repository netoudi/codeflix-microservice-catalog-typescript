import { Entity } from '@/core/shared/domain/entity';
import { InvalidArgumentError } from '@/core/shared/domain/errors/invalid-argument.error';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { IRepository, ISearchableRepository } from '@/core/shared/domain/repository/repository-interface';
import { SearchParams, SortDirection } from '@/core/shared/domain/repository/search-params';
import { SearchResult } from '@/core/shared/domain/repository/search-result';
import { ValueObject } from '@/core/shared/domain/value-object';

export abstract class InMemoryRepository<E extends Entity, EntityId extends ValueObject>
  implements IRepository<E, EntityId>
{
  public items: E[] = [];

  async insert(entity: E): Promise<void> {
    this.items.push(entity);
  }

  async bulkInsert(entities: E[]): Promise<void> {
    this.items.push(...entities);
  }

  async update(entity: E): Promise<void> {
    const indexFound = this.findIndexOrFail(entity);
    this.items[indexFound] = entity;
  }

  async delete(entityId: EntityId): Promise<void> {
    const indexFound = this.findIndexOrFail(entityId);
    this.items.splice(indexFound, 1);
  }

  async findById(entityId: EntityId): Promise<E | null> {
    return this.items.find((item) => item.entityId.equals(entityId)) ?? null;
  }

  async findAll(): Promise<E[]> {
    return this.items;
  }

  async findByIds(ids: EntityId[]): Promise<E[]> {
    //avoid to return repeated items
    return this.items.filter((entity) => {
      return ids.some((id) => entity.entityId.equals(id));
    });
  }

  async existsById(ids: EntityId[]): Promise<{ exists: EntityId[]; not_exists: EntityId[] }> {
    if (!ids.length) {
      throw new InvalidArgumentError('ids must be an array with at least one element');
    }
    if (this.items.length === 0) {
      return {
        exists: [],
        not_exists: ids,
      };
    }
    const existsId = new Set<EntityId>();
    const notExistsId = new Set<EntityId>();
    ids.forEach((id) => {
      const item = this.items.find((entity) => entity.entityId.equals(id));
      item ? existsId.add(id) : notExistsId.add(id);
    });
    return {
      exists: Array.from(existsId.values()),
      not_exists: Array.from(notExistsId.values()),
    };
  }

  private findIndexOrFail(value: E | EntityId): number {
    const entityId = value instanceof Entity ? value.entityId : value;
    const indexFound = this.items.findIndex((item) => item.entityId.equals(entityId));
    if (indexFound < 0) throw new NotFoundError(entityId, this.getEntity());
    return indexFound;
  }

  abstract getEntity(): new (...args: any[]) => E;
}

export abstract class InMemorySearchableRepository<E extends Entity, EntityId extends ValueObject, Filter = string>
  extends InMemoryRepository<E, EntityId>
  implements ISearchableRepository<E, EntityId, Filter>
{
  sortableFields: string[];

  async search(props: SearchParams<Filter>): Promise<SearchResult<E>> {
    const itemsFiltered = await this.applyFilter(this.items, props.filter);
    const itemsSorted = this.applySort(itemsFiltered, props.sort, props.sort_dir);
    const itemsPaginated = this.applyPaginate(itemsSorted, props.page, props.per_page);
    return Promise.resolve(
      new SearchResult({
        items: itemsPaginated,
        total: itemsFiltered.length,
        current_page: props.page,
        per_page: props.per_page,
      }),
    );
  }

  protected applySort(
    items: E[],
    sort: string | null,
    sort_dir: SortDirection | null,
    customGetter?: (sort: string, item: E) => any,
  ): E[] {
    if (!sort || !this.sortableFields.includes(sort)) {
      return items;
    }
    return [...items].sort((a, b) => {
      //eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const aValue = customGetter ? customGetter(sort, a) : a[sort];
      //eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const bValue = customGetter ? customGetter(sort, b) : b[sort];
      if (aValue < bValue) return sort_dir === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort_dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  protected abstract applyFilter(items: E[], filter: Filter | null): Promise<E[]>;

  protected applyPaginate(items: E[], page: SearchParams['page'], per_page: SearchParams['per_page']): E[] {
    const start = (page - 1) * per_page;
    const limit = start + per_page;
    return items.slice(start, limit);
  }
}
