import { PaginationOutput, PaginationOutputMapper } from '@/core/shared/application/pagination-output.mapper';
import { IUseCase } from '@/core/shared/application/use-case.interface';
import { VideoOutput, VideoOutputMapper } from '@/core/video/application/use-cases/common/video-output';
import { ListVideosInput } from '@/core/video/application/use-cases/list-videos/list-videos.input';
import { IVideoRepository, VideoSearchParams, VideoSearchResult } from '@/core/video/domain/video.repository';

export class ListVideosUseCase implements IUseCase<ListVideosInput, ListVideosOutput> {
  constructor(private videoRepo: IVideoRepository) {}

  async execute(input: ListVideosInput): Promise<ListVideosOutput> {
    const searchParams = VideoSearchParams.create({
      ...input,
      filter: {
        ...input.filter,
        is_published: true,
      },
    });
    const videos = await this.videoRepo.ignoreSoftDeleted().search(searchParams);

    return this.toOutput(videos);
  }

  private toOutput(searchResult: VideoSearchResult): ListVideosOutput {
    const { items: _items } = searchResult;
    const items = _items.map((i) => {
      return VideoOutputMapper.toOutput(i);
    });
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}

export type ListVideosOutput = PaginationOutput<VideoOutput>;
