import { SortDirection } from '@/core/shared/domain/repository/search-params';
import { SearchResult } from '@/core/shared/domain/repository/search-result';
import { InMemorySearchableRepository } from '@/core/shared/infra/db/in-memory/in-memory.repository';
import { Video, VideoId } from '@/core/video/domain/video.aggregate';
import { IVideoRepository, VideoFilter, VideoSearchParams } from '@/core/video/domain/video.repository';

export class VideoInMemoryRepository
  extends InMemorySearchableRepository<Video, VideoId, VideoFilter>
  implements IVideoRepository
{
  sortableFields: string[] = ['name', 'created_at'];

  getEntity(): new (...args: any[]) => Video {
    return Video;
  }

  /**
   * @deprecated Not use this method for tests, the memory repository cannot simulate the filter of Elasticsearch
   */
  async search(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    props: VideoSearchParams,
  ): Promise<SearchResult<Video>> {
    throw new Error('Not use this method for tests, the memory repository cannot simulate the filter of Elasticsearch');
  }

  /**
   * @deprecated Not use this method for tests, the memory repository cannot simulate the filter of Elasticsearch
   */
  protected async applyFilter(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    items: Video[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    filter: VideoFilter | null,
  ): Promise<Video[]> {
    throw new Error('Not use this method for tests, the memory repository cannot simulate the filter of Elasticsearch');
  }

  /**
   * @deprecated Not use this method for tests, the memory repository cannot simulate the filter of Elasticsearch
   */
  protected applySort(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    items: Video[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sort: string | null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sort_dir: SortDirection | null,
  ): Video[] {
    throw new Error('Not use this method for tests, the memory repository cannot simulate the filter of Elasticsearch');
  }
}
