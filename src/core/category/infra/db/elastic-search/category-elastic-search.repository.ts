import { GetGetResult, QueryDslQueryContainer } from '@elastic/elasticsearch/api/types';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Category, CategoryId } from '@/core/category/domain/category.entity';
import {
  CategorySearchParams,
  CategorySearchResult,
  ICategoryRepository,
} from '@/core/category/domain/category.repository';
import {
  CATEGORY_DOCUMENT_TYPE_NAME,
  CategoryDocument,
  CategoryElasticSearchMapper,
} from '@/core/category/infra/db/elastic-search/category-elastic-search.mapper';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { ICriteria } from '@/core/shared/domain/repository/criteria.interface';
import { SortDirection } from '@/core/shared/domain/repository/search-params';
import { SoftDeleteElasticSearchCriteria } from '@/core/shared/infra/db/elastic-search/soft-delete-elastic-search.criteria';

export class CategoryElasticSearchRepository implements ICategoryRepository {
  sortableFields: string[] = ['name', 'created_at'];
  sortableFieldsMap: Record<string, string> = { name: 'category_name', created_at: 'created_at' };
  scopes: Map<string, ICriteria> = new Map();

  constructor(
    private esClient: ElasticsearchService,
    private index: string,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async search(props: CategorySearchParams): Promise<CategorySearchResult> {
    throw new Error('Method not implemented.');
  }

  async searchByCriteria(criterias: ICriteria[]): Promise<CategorySearchResult> {
    let query: QueryDslQueryContainer = {};
    for (const criteria of criterias) {
      query = criteria.applyCriteria(query);
    }
    const result = await this.esClient.search({
      body: {
        query,
      },
    });
    return new CategorySearchResult({
      total: result.body.hits.total.value,
      current_page: 1,
      per_page: 15,
      items: result.body.hits.hits.map((hit: any) => CategoryElasticSearchMapper.toEntity(hit._id, hit._source)),
    });
  }

  async insert(entity: Category): Promise<void> {
    await this.esClient.index({
      index: this.index,
      id: entity.id.value,
      body: CategoryElasticSearchMapper.toDocument(entity),
      refresh: true,
    });
  }

  async bulkInsert(entities: Category[]): Promise<void> {
    await this.esClient.bulk({
      index: this.index,
      body: entities.flatMap((entity) => [
        { index: { _id: entity.id.value } },
        CategoryElasticSearchMapper.toDocument(entity),
      ]),
      refresh: true,
    });
  }

  async hasOnlyOneActivateInRelated(categoryId: CategoryId): Promise<boolean> {
    const query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            nested: {
              path: 'categories',
              query: {
                bool: {
                  must: [
                    {
                      match: {
                        'categories.category_id': categoryId.id,
                      },
                    },
                    {
                      match: {
                        'categories.is_active': true,
                      },
                    },
                  ],
                  must_not: [
                    {
                      exists: {
                        field: 'categories.deleted_at',
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
        filter: {
          script: {
            script: {
              source: `
                def count = 0;
                for(item in doc['categories__is_active']) {
                  if (item == true) {
                    count = count + 1;
                  }
                }
                return count == 1;
              `,
            },
          },
        },
      },
    };
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query,
      },
      _source: false as any,
    });
    return result.body.hits.total.value >= 1;
  }

  async hasOnlyOneNotDeletedInRelated(categoryId: CategoryId): Promise<boolean> {
    const query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            nested: {
              path: 'categories',
              query: {
                bool: {
                  must: [
                    {
                      match: {
                        'categories.category_id': categoryId.id,
                      },
                    },
                  ],
                  must_not: [
                    {
                      exists: {
                        field: 'categories.deleted_at',
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
        filter: {
          script: {
            script: {
              source: `
                def count = 0;
                for(item in doc['categories__is_deleted']) {
                  if (item == false) {
                    count = count + 1;
                  }
                }
                return count == 1;
              `,
            },
          },
        },
      },
    };
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query,
      },
      _source: false as any,
    });
    return result.body.hits.total.value >= 1;
  }

  async update(entity: Category): Promise<void> {
    let query: QueryDslQueryContainer = {
      bool: {
        should: [
          {
            match: {
              _id: entity.id.value,
            },
          },
          {
            nested: {
              path: 'categories',
              query: {
                match: {
                  'categories.category_id': entity.id.value,
                },
              },
            },
          },
        ],
      },
    };
    query = this.applyScopes(query);
    const result = await this.esClient.updateByQuery({
      index: this.index,
      body: {
        query,
        script: {
          source: `
          if (ctx._source.containsKey('categories')) {
            for(item in ctx._source.categories) {
              if (item.category_id == params.category_id) {
                item.category_name = params.category_name;
                item.is_active = params.is_active;
                item.deleted_at = params.deleted_at;
                item.is_deleted = params.is_deleted;
              }
            }
          } else {
            ctx._source.category_name = params.category_name;
            ctx._source.category_description = params.category_description;
            ctx._source.is_active = params.is_active;
            ctx._source.created_at = params.created_at;
            ctx._source.deleted_at = params.deleted_at;
          }
        `,
          params: {
            category_id: entity.id.value,
            ...CategoryElasticSearchMapper.toDocument(entity),
            is_deleted: entity.deleted_at ? true : false,
          },
        },
      },
      refresh: true,
    });
    if (result.body.updated == 0) {
      throw new NotFoundError(entity.id.value, Category);
    }
  }

  async delete(entityId: CategoryId): Promise<void> {
    let query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              _id: entityId.value,
            },
          },
        ],
      },
    };
    query = this.applyScopes(query);
    const result = await this.esClient.deleteByQuery({
      index: this.index,
      body: {
        query,
      },
      refresh: true,
    });
    if (result.body.deleted == 0) {
      throw new NotFoundError(entityId.value, Category);
    }
  }

  async findById(entityId: CategoryId): Promise<Category | null> {
    let query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              _id: entityId.value,
            },
          },
          {
            match: {
              type: CATEGORY_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    query = this.applyScopes(query);
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query,
      },
    });
    const docs = result.body.hits.hits as GetGetResult<CategoryDocument>[];
    if (docs.length === 0 || docs[0]._source === undefined) {
      return null;
    }
    return CategoryElasticSearchMapper.toEntity(entityId.value, docs[0]._source);
  }

  async findOneBy(filter: Partial<Category>): Promise<Category | null> {
    let query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: CATEGORY_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    if (filter.id !== undefined) {
      // @ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          _id: filter.id.value,
        },
      });
    }
    if (filter.is_active !== undefined) {
      // @ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          is_active: filter.is_active,
        },
      });
    }
    query = this.applyScopes(query);
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query,
      },
    });
    const docs = result.body.hits.hits as GetGetResult<CategoryDocument>[];
    if (docs.length === 0 || docs[0]._source === undefined) {
      return null;
    }
    return CategoryElasticSearchMapper.toEntity(docs[0]._id as string, docs[0]._source);
  }

  async findBy(filter: Partial<Category>, order?: { field: string; direction: SortDirection }): Promise<Category[]> {
    let query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: CATEGORY_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    if (filter.id !== undefined) {
      // @ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          _id: filter.id.value,
        },
      });
    }
    if (filter.is_active !== undefined) {
      // @ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          is_active: filter.is_active,
        },
      });
    }
    query = this.applyScopes(query);
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query,
        sort:
          order && this.sortableFieldsMap.hasOwnProperty(order.field)
            ? { [this.sortableFieldsMap[order.field]]: order.direction }
            : undefined,
      },
    });
    return result.body.hits.hits.map((doc: any) => CategoryElasticSearchMapper.toEntity(doc._id, doc._source));
  }

  async findAll(): Promise<Category[]> {
    let query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: CATEGORY_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    query = this.applyScopes(query);
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query,
      },
    });
    return result.body.hits.hits.map((doc: any) => CategoryElasticSearchMapper.toEntity(doc._id, doc._source));
  }

  async findByIds(ids: CategoryId[]): Promise<{ exists: Category[]; not_exists: CategoryId[] }> {
    let query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            ids: {
              values: ids.map((id) => id.value),
            },
          },
          {
            match: {
              type: CATEGORY_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    query = this.applyScopes(query);
    const result = await this.esClient.search({
      body: {
        query,
      },
    });
    const docs = result.body.hits.hits as GetGetResult<CategoryDocument>[];
    return {
      exists: docs.map((doc) => CategoryElasticSearchMapper.toEntity(doc._id as string, doc._source!)),
      not_exists: ids.filter((id) => !docs.some((doc) => doc._id === id.value)),
    };
  }

  async existsById(ids: CategoryId[]): Promise<{ exists: CategoryId[]; not_exists: CategoryId[] }> {
    let query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            ids: {
              values: ids.map((id) => id.value),
            },
          },
          {
            match: {
              type: CATEGORY_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    query = this.applyScopes(query);
    const result = await this.esClient.search({
      index: this.index,
      _source: false as any,
      body: {
        query,
      },
    });
    const docs = result.body.hits.hits as GetGetResult<CategoryDocument>[];
    const existsIds = docs.map((doc) => new CategoryId(doc._id as string));
    const notExistsIds = ids.filter((id) => !existsIds.some((existsId) => existsId.equals(id)));
    return { exists: existsIds, not_exists: notExistsIds };
  }

  getEntity(): new (...args: any[]) => Category {
    return Category;
  }

  ignoreSoftDeleted(): this {
    this.scopes.set(SoftDeleteElasticSearchCriteria.name, new SoftDeleteElasticSearchCriteria());
    return this;
  }

  clearScopes(): this {
    this.scopes.clear();
    return this;
  }

  private applyScopes(query: QueryDslQueryContainer): QueryDslQueryContainer {
    return Array.from(this.scopes.values()).reduce((acc, criteria) => criteria.applyCriteria(acc), query);
  }
}
