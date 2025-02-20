import { DeleteCastMemberUseCase } from '@/core/cast-member/application/use-cases/delete-cast-member/delete-cast-member.use-case';
import { CastMemberType } from '@/core/cast-member/domain/cast-member-type.vo';
import { CastMember, CastMemberId } from '@/core/cast-member/domain/cast-member.aggregate';
import { CastMemberInMemoryRepository } from '@/core/cast-member/infra/db/in-memory/cast-member-in-memory.repository';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';

describe('DeleteCastMemberUseCase Unit Tests', () => {
  let useCase: DeleteCastMemberUseCase;
  let repository: CastMemberInMemoryRepository;

  beforeEach(() => {
    repository = new CastMemberInMemoryRepository();
    useCase = new DeleteCastMemberUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const castMemberId = new CastMemberId();

    await expect(() => useCase.execute(castMemberId.id)).rejects.toThrow(
      new NotFoundError(castMemberId.id, CastMember),
    );
  });

  it('should delete a cast member', async () => {
    const items = [
      new CastMember({
        cast_member_id: new CastMemberId(),
        name: 'Movie',
        type: CastMemberType.createAnActor(),
        created_at: new Date(),
      }),
    ];
    repository.items = items;
    await useCase.execute(items[0].cast_member_id.id);
    expect(repository.ignoreSoftDeleted().findAll()).resolves.toHaveLength(0);
  });
});
