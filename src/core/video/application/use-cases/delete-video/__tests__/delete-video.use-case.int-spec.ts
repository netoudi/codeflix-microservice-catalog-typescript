import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { setupElasticsearch } from '@/core/shared/infra/testing/global-helpers';
import { DeleteVideoUseCase } from '@/core/video/application/use-cases/delete-video/delete-video.use-case';
import { Video, VideoId } from '@/core/video/domain/video.aggregate';
import { VideoElasticSearchRepository } from '@/core/video/infra/db/elastic-search/video-elastic-search.repository';

describe('DeleteVideoUseCase Integration Tests', () => {
  let useCase: DeleteVideoUseCase;
  let repository: VideoElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    repository = new VideoElasticSearchRepository(esHelper.esClient, esHelper.indexName);
    useCase = new DeleteVideoUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const genreId = new VideoId();
    await expect(() => useCase.execute(genreId.id)).rejects.toThrow(new NotFoundError(genreId.id, Video));
  });

  it('should delete a genre', async () => {
    const video = Video.fake().aVideoWithAllMedias().build();
    await repository.insert(video);
    await useCase.execute(video.video_id.id);
    const noEntity = await repository.ignoreSoftDeleted().findById(video.video_id);
    expect(noEntity).toBeNull();
  });
});
