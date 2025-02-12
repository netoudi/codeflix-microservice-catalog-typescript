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
import { SortDirection } from '@/core/shared/domain/repository/search-params';

export class CategoryElasticSearchRepository implements ICategoryRepository {
  sortableFields: string[] = ['name', 'created_at'];
  sortableFieldsMap: Record<string, string> = { name: 'category_name', created_at: 'created_at' };

  constructor(
    private esClient: ElasticsearchService,
    private index: string,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async search(props: CategorySearchParams): Promise<CategorySearchResult> {
    throw new Error('Method not implemented.');
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

  async update(entity: Category): Promise<void> {
    const result = await this.esClient.updateByQuery({
      index: this.index,
      body: {
        query: {
          match: {
            _id: entity.id.value,
          },
        },
        script: {
          source: `
            ctx._source.category_name = params.category_name;
            ctx._source.category_description = params.category_description;
            ctx._source.is_active = params.is_active;
            ctx._source.created_at = params.created_at;
          `,
          params: CategoryElasticSearchMapper.toDocument(entity),
        },
      },
      refresh: true,
    });
    if (result.body.updated !== 1) {
      throw new NotFoundError(entity.id.value, Category);
    }
  }

  async delete(entityId: CategoryId): Promise<void> {
    const result = await this.esClient.delete({
      index: this.index,
      id: entityId.value,
      refresh: true,
    });
    if (result.body.result !== 'deleted') {
      throw new NotFoundError(entityId.value, Category);
    }
  }

  async findById(entityId: CategoryId): Promise<Category | null> {
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query: {
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
        },
      },
    });
    const docs = result.body.hits.hits as GetGetResult<CategoryDocument>[];
    if (docs.length === 0 || docs[0]._source === undefined) {
      return null;
    }
    return CategoryElasticSearchMapper.toEntity(entityId.value, docs[0]._source);
  }

  async findOneBy(filter: Partial<Category>): Promise<Category | null> {
    const query: QueryDslQueryContainer = {
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
    const query: QueryDslQueryContainer = {
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
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query,
        sort: order ? [{ [this.sortableFieldsMap[order.field]]: order.direction }] : undefined,
      },
    });
    return result.body.hits.hits.map((doc: any) => CategoryElasticSearchMapper.toEntity(doc._id, doc._source));
  }

  async findAll(): Promise<Category[]> {
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query: {
          match: {
            type: CATEGORY_DOCUMENT_TYPE_NAME,
          },
        },
      },
    });
    return result.body.hits.hits.map((doc: any) => CategoryElasticSearchMapper.toEntity(doc._id, doc._source));
  }

  async findByIds(ids: CategoryId[]): Promise<{ exists: Category[]; not_exists: CategoryId[] }> {
    const result = await this.esClient.search({
      body: {
        query: {
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
        },
      },
    });
    const docs = result.body.hits.hits as GetGetResult<CategoryDocument>[];
    return {
      exists: docs.map((doc) => CategoryElasticSearchMapper.toEntity(doc._id as string, doc._source!)),
      not_exists: ids.filter((id) => !docs.some((doc) => doc._id === id.value)),
    };
  }

  async existsById(ids: CategoryId[]): Promise<{ exists: CategoryId[]; not_exists: CategoryId[] }> {
    const result = await this.esClient.search({
      index: this.index,
      _source: false as any,
      body: {
        query: {
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
        },
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
}
