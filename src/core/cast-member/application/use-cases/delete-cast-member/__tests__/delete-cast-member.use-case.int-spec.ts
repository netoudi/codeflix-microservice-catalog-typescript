import { DeleteCastMemberUseCase } from '@/core/cast-member/application/use-cases/delete-cast-member/delete-cast-member.use-case';
import { CastMember, CastMemberId } from '@/core/cast-member/domain/cast-member.aggregate';
import { CastMemberElasticSearchRepository } from '@/core/cast-member/infra/db/elastic-search/cast-member-elastic-search';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { setupElasticsearch } from '@/core/shared/infra/testing/global-helpers';

describe('DeleteCastMemberUseCase Integration Tests', () => {
  let useCase: DeleteCastMemberUseCase;
  let repository: CastMemberElasticSearchRepository;

  const esHelper = setupElasticsearch();

  beforeEach(() => {
    repository = new CastMemberElasticSearchRepository(esHelper.esClient, esHelper.indexName);
    useCase = new DeleteCastMemberUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const castMemberId = new CastMemberId();
    await expect(() => useCase.execute(castMemberId.id)).rejects.toThrow(
      new NotFoundError(castMemberId.id, CastMember),
    );
  });

  it('should delete a cast member', async () => {
    const castMember = CastMember.fake().aDirector().build();
    await repository.insert(castMember);
    await useCase.execute(castMember.cast_member_id.id);
    const noEntity = await repository.ignoreSoftDeleted().findById(castMember.cast_member_id);
    expect(noEntity).toBeNull();
  });
});
