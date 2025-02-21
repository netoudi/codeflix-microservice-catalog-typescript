import { GetGetResult, QueryDslQueryContainer } from '@elastic/elasticsearch/api/types';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Genre, GenreId } from '@/core/genre/domain/genre.aggregate';
import { IGenreRepository } from '@/core/genre/domain/genre.repository';
import {
  GENRE_DOCUMENT_TYPE_NAME,
  GenreDocument,
  GenreElasticSearchMapper,
} from '@/core/genre/infra/db/elastic-search/genre-elastic-search.mapper';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { ICriteria } from '@/core/shared/domain/repository/criteria.interface';
import { SortDirection } from '@/core/shared/domain/repository/search-params';
import { SoftDeleteElasticSearchCriteria } from '@/core/shared/infra/db/elastic-search/soft-delete-elastic-search.criteria';

export class GenreElasticSearchRepository implements IGenreRepository {
  constructor(
    private readonly esClient: ElasticsearchService,
    private index: string,
  ) {}
  scopes: Map<string, ICriteria> = new Map();
  sortableFields: string[] = ['name', 'created_at'];
  sortableFieldsMap: { [key: string]: string } = {
    name: 'genre_name',
    created_at: 'created_at',
  };

  async insert(entity: Genre): Promise<void> {
    await this.esClient.index({
      index: this.index,
      id: entity.genre_id.id,
      body: GenreElasticSearchMapper.toDocument(entity),
      refresh: true,
    });
  }

  async bulkInsert(entities: Genre[]): Promise<void> {
    await this.esClient.bulk({
      index: this.index,
      body: entities.flatMap((entity) => [
        { index: { _id: entity.genre_id.id } },
        GenreElasticSearchMapper.toDocument(entity),
      ]),
      refresh: true,
    });
  }

  async findById(id: GenreId): Promise<Genre | null> {
    const query = {
      bool: {
        must: [
          {
            match: {
              _id: id.id,
            },
          },
          {
            match: {
              type: GENRE_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query: scopedQuery,
      },
    });

    const docs = result.body.hits.hits as GetGetResult<GenreDocument>[];

    if (docs.length === 0) {
      return null;
    }

    const document = docs[0]._source!;

    if (!document) {
      return null;
    }

    return GenreElasticSearchMapper.toEntity(id.id, document);
  }

  async findAll(): Promise<Genre[]> {
    const query = {
      bool: {
        must: [
          {
            match: {
              type: GENRE_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query: scopedQuery,
      },
    });
    return result.body.hits.hits.map((hit) => GenreElasticSearchMapper.toEntity(hit._id, hit._source!));
  }

  async findByIds(ids: GenreId[]): Promise<{ exists: Genre[]; not_exists: GenreId[] }> {
    const query = {
      bool: {
        must: [
          {
            ids: {
              values: ids.map((id) => id.id),
            },
          },
          {
            match: {
              type: GENRE_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query: scopedQuery,
      },
    });

    const docs = result.body.hits.hits as GetGetResult<GenreDocument>[];
    return {
      exists: docs.map((doc) => GenreElasticSearchMapper.toEntity(doc._id as string, doc._source!)),
      not_exists: ids.filter((id) => !docs.some((doc) => doc._id === id.id)),
    };
  }

  async findOneBy(filter: { genre_id?: GenreId; is_active?: boolean }): Promise<Genre | null> {
    const query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: GENRE_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };

    if (filter.genre_id) {
      //@ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          _id: filter.genre_id.id,
        },
      });
    }

    if (filter.is_active !== undefined) {
      //@ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          is_active: filter.is_active,
        },
      });
    }
    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query: scopedQuery,
      },
    });

    const docs = result.body.hits.hits as GetGetResult<GenreDocument>[];

    if (!docs.length) {
      return null;
    }

    return GenreElasticSearchMapper.toEntity(docs[0]._id as string, docs[0]._source!);
  }

  async findBy(
    filter: {
      genre_id?: GenreId;
      is_active?: boolean;
    },
    order?: {
      field: 'name' | 'created_at';
      direction: SortDirection;
    },
  ): Promise<Genre[]> {
    const query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: GENRE_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };

    if (filter.genre_id) {
      //@ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          _id: filter.genre_id.id,
        },
      });
    }

    if (filter.is_active !== undefined) {
      //@ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          is_active: filter.is_active,
        },
      });
    }
    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.search({
      index: this.index,
      body: {
        query: scopedQuery,
        sort:
          order && this.sortableFieldsMap.hasOwnProperty(order.field)
            ? { [this.sortableFieldsMap[order.field]]: order.direction }
            : undefined,
      },
    });

    return result.body.hits.hits.map((hit) => GenreElasticSearchMapper.toEntity(hit._id, hit._source!));
  }

  async existsById(ids: GenreId[]): Promise<{ exists: GenreId[]; not_exists: GenreId[] }> {
    const query = {
      bool: {
        must: [
          {
            ids: {
              values: ids.map((id) => id.id),
            },
          },
          {
            match: {
              type: GENRE_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.search({
      index: this.index,
      _source: false as any,
      body: {
        query: scopedQuery,
      },
    });

    const docs = result.body.hits.hits as GetGetResult<GenreDocument>[];
    const existsGenreIds = docs.map((m) => new GenreId(m._id as string));
    const notExistsGenreIds = ids.filter((id) => !existsGenreIds.some((e) => e.equals(id)));
    return {
      exists: existsGenreIds,
      not_exists: notExistsGenreIds,
    };
  }

  async update(entity: Genre): Promise<void> {
    const query = {
      bool: {
        must: [
          {
            match: {
              _id: entity.genre_id.id,
            },
          },
          {
            match: {
              type: GENRE_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.updateByQuery({
      index: this.index,
      body: {
        query: scopedQuery,
        script: {
          source: `
          ctx._source.genre_name = params.genre_name;
          ctx._source.categories = params.categories;
          ctx._source.is_active = params.is_active;
          ctx._source.created_at = params.created_at;
          ctx._source.deleted_at = params.deleted_at;
        `,
          params: {
            ...GenreElasticSearchMapper.toDocument(entity),
          },
        },
      },
      refresh: true,
    });

    if (result.body.updated == 0) {
      throw new NotFoundError(entity.genre_id.id, this.getEntity());
    }
  }

  async delete(id: GenreId): Promise<void> {
    const query = {
      bool: {
        must: [
          {
            match: {
              _id: id.id,
            },
          },
          {
            match: {
              type: GENRE_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.deleteByQuery({
      index: this.index,
      body: {
        query: scopedQuery,
      },
      refresh: true,
    });
    if (result.body.deleted == 0) {
      throw new NotFoundError(id.id, this.getEntity());
    }
  }

  ignoreSoftDeleted(): this {
    this.scopes.set(SoftDeleteElasticSearchCriteria.name, new SoftDeleteElasticSearchCriteria());
    return this;
  }

  clearScopes(): this {
    this.scopes.clear();
    return this;
  }

  protected applyScopes(query: QueryDslQueryContainer) {
    return Array.from(this.scopes.values()).reduce((acc, criteria) => criteria.applyCriteria(acc), query);
  }

  getEntity(): new (...args: any[]) => Genre {
    return Genre;
  }
}
