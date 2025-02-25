import { GetGetResult, QueryDslQueryContainer, SearchTotalHits } from '@elastic/elasticsearch/api/types';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { ICriteria } from '@/core/shared/domain/repository/criteria.interface';
import { SortDirection } from '@/core/shared/domain/repository/search-params';
import { SoftDeleteElasticSearchCriteria } from '@/core/shared/infra/db/elastic-search/soft-delete-elastic-search.criteria';
import { Video, VideoId } from '@/core/video/domain/video.aggregate';
import { IVideoRepository, VideoSearchParams, VideoSearchResult } from '@/core/video/domain/video.repository';
import {
  VIDEO_DOCUMENT_TYPE_NAME,
  VideoDocument,
  VideoElasticSearchMapper,
} from '@/core/video/infra/db/elastic-search/video-elastic-search.mapper';

export class VideoElasticSearchRepository implements IVideoRepository {
  constructor(
    private readonly esClient: ElasticsearchService,
    private index: string,
  ) {}

  sortableFields: string[] = ['title', 'created_at'];
  sortableFieldsMap: { [key: string]: string } = {
    title: 'video_title_keyword',
    created_at: 'created_at',
  };
  scopes: Map<string, ICriteria> = new Map();

  async insert(entity: Video): Promise<void> {
    await this.esClient.index({
      index: this.index,
      id: entity.video_id.id,
      body: VideoElasticSearchMapper.toDocument(entity),
      refresh: true,
    });
  }

  async bulkInsert(entities: Video[]): Promise<void> {
    await this.esClient.bulk({
      index: this.index,
      body: entities.flatMap((entity) => [
        { index: { _id: entity.video_id.id } },
        VideoElasticSearchMapper.toDocument(entity),
      ]),
      refresh: true,
    });
  }

  async findById(id: VideoId): Promise<Video | null> {
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
              type: VIDEO_DOCUMENT_TYPE_NAME,
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

    const docs = result.body.hits.hits as GetGetResult<VideoDocument>[];

    if (docs.length === 0) {
      return null;
    }

    const document = docs[0]._source!;

    if (!document) {
      return null;
    }

    return VideoElasticSearchMapper.toEntity(id.id, document);
  }

  async findAll(): Promise<Video[]> {
    const query = {
      bool: {
        must: [
          {
            match: {
              type: VIDEO_DOCUMENT_TYPE_NAME,
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
    return result.body.hits.hits.map((hit) => VideoElasticSearchMapper.toEntity(hit._id, hit._source!));
  }

  async findByIds(ids: VideoId[]): Promise<{ exists: Video[]; not_exists: VideoId[] }> {
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
              type: VIDEO_DOCUMENT_TYPE_NAME,
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

    const docs = result.body.hits.hits as GetGetResult<VideoDocument>[];
    return {
      exists: docs.map((doc) => VideoElasticSearchMapper.toEntity(doc._id as string, doc._source!)),
      not_exists: ids.filter((id) => !docs.some((doc) => doc._id === id.id)),
    };
  }

  async findOneBy(filter: { video_id?: VideoId }): Promise<Video | null> {
    const query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: VIDEO_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };

    if (filter.video_id) {
      //@ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          _id: filter.video_id.id,
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

    const docs = result.body.hits.hits as GetGetResult<VideoDocument>[];

    if (!docs.length) {
      return null;
    }

    return VideoElasticSearchMapper.toEntity(docs[0]._id as string, docs[0]._source!);
  }

  async findBy(
    filter: {
      video_id?: VideoId;
      is_active?: boolean;
    },
    order?: {
      field: 'name' | 'created_at';
      direction: SortDirection;
    },
  ): Promise<Video[]> {
    const query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: VIDEO_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };

    if (filter.video_id) {
      //@ts-expect-error - must is an array
      query.bool.must.push({
        match: {
          _id: filter.video_id.id,
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
            ? ([{ [this.sortableFieldsMap[order.field]]: order.direction }] as any)
            : undefined,
      },
    });

    return result.body.hits.hits.map((hit) => VideoElasticSearchMapper.toEntity(hit._id, hit._source!));
  }

  async existsById(ids: VideoId[]): Promise<{ exists: VideoId[]; not_exists: VideoId[] }> {
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
              type: VIDEO_DOCUMENT_TYPE_NAME,
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
      _source: false as any,
    });

    const docs = result.body.hits.hits as GetGetResult<VideoDocument>[];
    const existsVideoIds = docs.map((m) => new VideoId(m._id as string));
    const notExistsVideoIds = ids.filter((id) => !existsVideoIds.some((e) => e.equals(id)));
    return {
      exists: existsVideoIds,
      not_exists: notExistsVideoIds,
    };
  }

  async update(entity: Video): Promise<void> {
    const query = {
      bool: {
        must: [
          {
            match: {
              _id: entity.video_id.id,
            },
          },
          {
            match: {
              type: VIDEO_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };
    const scopedQuery = this.applyScopes(query);
    const response = await this.esClient.updateByQuery({
      index: this.index,
      body: {
        query: scopedQuery,
        script: {
          source: `
          ctx._source.video_title = params.video_title;
          ctx._source.video_title_keyword = params.video_title_keyword;
          ctx._source.video_description = params.video_description;
          ctx._source.year_launched = params.year_launched;
          ctx._source.duration = params.duration;
          ctx._source.rating = params.rating;
          ctx._source.is_opened = params.is_opened;
          ctx._source.is_published = params.is_published;
          ctx._source.banner_url = params.banner_url;
          ctx._source.thumbnail_url = params.thumbnail_url;
          ctx._source.thumbnail_half_url = params.thumbnail_half_url;
          ctx._source.trailer_url = params.trailer_url;
          ctx._source.video_url = params.video_url;
          ctx._source.categories = params.categories;
          ctx._source.genres = params.genres;
          ctx._source.cast_members = params.cast_members;
          ctx._source.created_at = params.created_at;
          ctx._source.deleted_at = params.deleted_at;
        `,
          params: {
            ...VideoElasticSearchMapper.toDocument(entity),
          },
        },
      },
      refresh: true,
    });

    if (response.body.updated == 0) {
      throw new NotFoundError(entity.video_id.id, this.getEntity());
    }
  }

  async delete(id: VideoId): Promise<void> {
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
              type: VIDEO_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };

    const scopedQuery = this.applyScopes(query);
    const response = await this.esClient.deleteByQuery({
      index: this.index,
      body: {
        query: scopedQuery,
      },
      refresh: true,
    });
    if (response.body.deleted == 0) {
      throw new NotFoundError(id.id, this.getEntity());
    }
  }

  async search(props: VideoSearchParams): Promise<VideoSearchResult> {
    const offset = (props.page - 1) * props.per_page;
    const limit = props.per_page;

    const query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: VIDEO_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };

    if (props.filter) {
      if (props.filter.title_or_description) {
        //@ts-expect-error - must is an array
        query.bool.must.push({
          multi_match: {
            query: props.filter.title_or_description,
            type: 'most_fields',
            fields: ['video_title', 'video_description'],
            fuzziness: 'AUTO',
          },
        });
      }

      if (props.filter.categories_id) {
        //@ts-expect-error - must is an array
        query.bool.must.push({
          nested: {
            path: 'categories',
            query: {
              terms: {
                'categories.category_id': props.filter.categories_id.map((c) => c.id),
              },
            },
          },
        });
      }

      if (props.filter.genres_id) {
        //@ts-expect-error - must is an array
        query.bool.must.push({
          nested: {
            path: 'genres',
            query: {
              terms: {
                'genres.genre_id': props.filter.genres_id.map((g) => g.id),
              },
            },
          },
        });
      }

      if (props.filter.cast_members_id) {
        //@ts-expect-error - must is an array
        query.bool.must.push({
          nested: {
            path: 'cast_members',
            query: {
              terms: {
                'cast_members.cast_member_id': props.filter.cast_members_id.map((c) => c.id),
              },
            },
          },
        });
      }
      if (props.filter.is_published !== undefined) {
        //@ts-expect-error - must is an array
        query.bool.must.push({
          match: {
            is_published: props.filter.is_published,
          },
        });
      }
    }

    const scopedQuery = this.applyScopes(query);
    const result = await this.esClient.search({
      index: this.index,
      from: offset,
      size: limit,
      body: {
        query: scopedQuery,
        sort:
          props.sort && this.sortableFieldsMap.hasOwnProperty(props.sort)
            ? [{ [this.sortableFieldsMap[props.sort]]: props.sort_dir! }]
            : [{ created_at: 'desc' }],
      },
    });
    const docs = result.body.hits.hits as GetGetResult<VideoDocument>[];
    const entities = docs.map((doc) => VideoElasticSearchMapper.toEntity(doc._id as string, doc._source!));
    const total = result.body.hits.total as SearchTotalHits;
    return new VideoSearchResult({
      total: total.value,
      current_page: props.page,
      per_page: props.per_page,
      items: entities,
    });
  }

  async searchByCriteria(criterias: ICriteria[], searchParams: VideoSearchParams): Promise<VideoSearchResult> {
    const offset = (searchParams.page - 1) * searchParams.per_page;
    const limit = searchParams.per_page;

    let query: QueryDslQueryContainer = {
      bool: {
        must: [
          {
            match: {
              type: VIDEO_DOCUMENT_TYPE_NAME,
            },
          },
        ],
      },
    };

    for (const criteria of criterias) {
      query = criteria.applyCriteria(query);
    }

    const result = await this.esClient.search({
      index: this.index,
      body: {
        query,
        from: offset,
        size: limit,
        sort:
          searchParams.sort && this.sortableFieldsMap.hasOwnProperty(searchParams.sort)
            ? ([
                {
                  [this.sortableFieldsMap[searchParams.sort]]: searchParams.sort_dir!,
                },
              ] as any)
            : ([{ created_at: 'desc' }] as any),
      },
    });
    const docs = result.body.hits.hits as GetGetResult<VideoDocument>[];
    const entities = docs.map((doc) => VideoElasticSearchMapper.toEntity(doc._id as string, doc._source!));
    const total = result.body.hits.total as SearchTotalHits;
    return new VideoSearchResult({
      total: total.value,
      current_page: searchParams.page,
      per_page: searchParams.per_page,
      items: entities,
    });
  }

  getEntity(): new (...args: any[]) => Video {
    return Video;
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
