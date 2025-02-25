import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { setupElasticsearch } from '@/core/shared/infra/testing/global-helpers';
import { GetVideoUseCase } from '@/core/video/application/use-cases/get-video/get-video.use-case';
import { Video, VideoId } from '@/core/video/domain/video.aggregate';
import { VideoElasticSearchRepository } from '@/core/video/infra/db/elastic-search/video-elastic-search.repository';

describe('GetVideoUseCase Integration Tests', () => {
  let useCase: GetVideoUseCase;
  let repository: VideoElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    repository = new VideoElasticSearchRepository(esHelper.esClient, esHelper.indexName);
    useCase = new GetVideoUseCase(repository);
  });

  it('should throws error when aggregate not found', async () => {
    const videoId = new VideoId();
    await expect(() => useCase.execute({ id: videoId.id })).rejects.toThrow(new NotFoundError(videoId.id, Video));

    const video = Video.fake().aVideoWithAllMedias().build();
    video.markAsDeleted();
    await repository.insert(video);

    await expect(() => useCase.execute({ id: video.video_id.id })).rejects.toThrow(
      new NotFoundError(video.video_id.id, Video),
    );
  });

  it('should return a video', async () => {
    const video = Video.fake().aVideoWithAllMedias().build();
    await repository.insert(video);
    const output = await useCase.execute({ id: video.video_id.id });

    expect(output.title).toEqual(video.title);
  });
});
