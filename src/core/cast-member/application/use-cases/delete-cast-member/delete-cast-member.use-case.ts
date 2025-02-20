import { CastMember, CastMemberId } from '@/core/cast-member/domain/cast-member.aggregate';
import { ICastMemberRepository } from '@/core/cast-member/domain/cast-member.repository';
import { IUseCase } from '@/core/shared/application/use-case.interface';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';

export class DeleteCastMemberUseCase implements IUseCase<string, void> {
  constructor(private castMemberRepository: ICastMemberRepository) {}

  async execute(id: string): Promise<void> {
    const castMember = await this.castMemberRepository.findById(new CastMemberId(id));

    if (!castMember) {
      throw new NotFoundError(id, CastMember);
    }

    castMember.markAsDeleted();

    await this.castMemberRepository.update(castMember);
  }
}
