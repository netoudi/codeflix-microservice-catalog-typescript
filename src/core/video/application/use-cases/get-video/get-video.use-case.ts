import { IUseCase } from '@/core/shared/application/use-case.interface';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { VideoOutput, VideoOutputMapper } from '@/core/video/application/use-cases/common/video-output';
import { Video, VideoId } from '@/core/video/domain/video.aggregate';
import { IVideoRepository } from '@/core/video/domain/video.repository';

export class GetVideoUseCase implements IUseCase<GetVideoInput, GetVideoOutput> {
  constructor(private videoRepo: IVideoRepository) {}

  async execute(input: GetVideoInput): Promise<GetVideoOutput> {
    const videoId = new VideoId(input.id);
    const video = await this.videoRepo.ignoreSoftDeleted().findOneBy({
      video_id: videoId,
      is_published: true,
    });
    if (!video) {
      throw new NotFoundError(input.id, Video);
    }

    return VideoOutputMapper.toOutput(video);
  }
}

export type GetVideoInput = {
  id: string;
};

export type GetVideoOutput = VideoOutput;
