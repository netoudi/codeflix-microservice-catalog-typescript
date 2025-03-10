import { AggregateRoot } from '@/core/shared/domain/aggregate-root';
import { Entity } from '@/core/shared/domain/entity';
import { InvalidArgumentError } from '@/core/shared/domain/errors/invalid-argument.error';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { ICriteria } from '@/core/shared/domain/repository/criteria.interface';
import { IRepository, ISearchableRepository } from '@/core/shared/domain/repository/repository-interface';
import { SearchParams, SortDirection } from '@/core/shared/domain/repository/search-params';
import { SearchResult } from '@/core/shared/domain/repository/search-result';
import { ValueObject } from '@/core/shared/domain/value-object';
import { SoftDeleteInMemoryCriteria } from '@/core/shared/infra/db/in-memory/soft-delete-in-memory.criteria';

export abstract class InMemoryRepository<E extends AggregateRoot, EntityId extends ValueObject>
  implements IRepository<E, EntityId>
{
  public sortableFields: string[];
  public scopes: Map<string, ICriteria> = new Map();
  public items: E[] = [];

  async insert(entity: E): Promise<void> {
    this.items.push(this.clone(entity));
  }

  async bulkInsert(entities: E[]): Promise<void> {
    this.items.push(...entities.map((entity) => this.clone(entity)));
  }

  async update(entity: E): Promise<void> {
    const indexFound = this.findIndexOrFail(entity);
    this.items[indexFound] = this.clone(entity);
  }

  async delete(entityId: EntityId): Promise<void> {
    const indexFound = this.findIndexOrFail(entityId);
    this.items.splice(indexFound, 1);
  }

  async findById(entityId: EntityId): Promise<E | null> {
    const entity = this.applyScopes(this.items).find((item: E) => item.entityId.equals(entityId));
    return entity ? this.clone(entity) : null;
  }

  async findOneBy(filter: Partial<E>): Promise<E | null> {
    const entity = this.applyScopes(this.items).find((item: E) => {
      return Object.entries(filter).every(([key, value]) => {
        return value instanceof ValueObject ? item[key].equals(value) : item[key] === value;
      });
    });
    return entity ? this.clone(entity) : null;
  }

  async findBy(filter: Partial<E>, order?: { field: string; direction: SortDirection }): Promise<E[]> {
    let items = this.applyScopes(this.items).filter((entity: E) => {
      return Object.entries(filter).every(([key, value]) => {
        return value instanceof ValueObject ? entity[key].equals(value) : entity[key] === value;
      });
    });
    if (order) {
      items = items.sort((a, b) => {
        const aValue = a[order.field];
        const bValue = b[order.field];
        if (aValue < bValue) return order.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return order.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items.map(this.clone);
  }

  async findAll(): Promise<E[]> {
    return this.applyScopes(this.items).map(this.clone);
  }

  async findByIds(ids: EntityId[]): Promise<{ exists: E[]; not_exists: EntityId[] }> {
    //avoid to return repeated items
    const foundItems = this.items.filter((entity) => ids.some((id) => entity.entityId.equals(id)));
    const notFoundIds = ids.filter((id) => !foundItems.some((entity) => entity.entityId.equals(id)));
    return { exists: foundItems.map(this.clone), not_exists: notFoundIds };
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
      const item = this.applyScopes(this.items).find((entity: E) => entity.entityId.equals(id));
      item ? existsId.add(id) : notExistsId.add(id);
    });
    return {
      exists: Array.from(existsId.values()),
      not_exists: Array.from(notExistsId.values()),
    };
  }

  ignoreSoftDeleted(): this {
    this.scopes.set(SoftDeleteInMemoryCriteria.name, new SoftDeleteInMemoryCriteria());
    return this;
  }

  clearScopes(): this {
    this.scopes.clear();
    return this;
  }

  protected applyScopes(context: E[]): any {
    let items = context;
    for (const criteria of this.scopes.values()) {
      items = criteria.applyCriteria(items);
    }
    return items;
  }

  private findIndexOrFail(value: E | EntityId): number {
    const entityId = value instanceof Entity ? value.entityId : value;
    const indexFound = this.applyScopes(this.items).findIndex((item: E) => item.entityId.equals(entityId));
    if (indexFound < 0) throw new NotFoundError(entityId, this.getEntity());
    return indexFound;
  }

  private clone(obj: E): E {
    return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  searchByCriteria(criterias: ICriteria[]): Promise<SearchResult<E>> {
    throw new Error('Method not implemented.');
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
