import { SaveCastMemberInput } from '@/core/cast-member/application/use-cases/save-cast-member/save-cast-member.input';
import { CastMemberType } from '@/core/cast-member/domain/cast-member-type.vo';
import { CastMember, CastMemberId } from '@/core/cast-member/domain/cast-member.aggregate';
import { ICastMemberRepository } from '@/core/cast-member/domain/cast-member.repository';
import { IUseCase } from '@/core/shared/application/use-case.interface';
import { EntityValidationError } from '@/core/shared/domain/validators/validation.error';

export class SaveCastMemberUseCase implements IUseCase<SaveCastMemberInput, SaveCastMemberOutput> {
  constructor(private castMemberRepo: ICastMemberRepository) {}

  async execute(input: SaveCastMemberInput): Promise<SaveCastMemberOutput> {
    const castMemberId = new CastMemberId(input.cast_member_id);
    const castMember = await this.castMemberRepo.findById(castMemberId);

    return castMember ? this.updateCastMember(input, castMember) : this.createCastMember(input);
  }

  private async createCastMember(input: SaveCastMemberInput) {
    const [type, errorCastMemberType] = CastMemberType.create(input.type).asArray();

    if (errorCastMemberType) {
      throw new EntityValidationError([{ type: [errorCastMemberType.message] }]);
    }

    const entity = CastMember.create({
      ...input,
      cast_member_id: new CastMemberId(input.cast_member_id),
      type,
    });

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.castMemberRepo.insert(entity);

    return { id: entity.cast_member_id.id, created: true };
  }

  private async updateCastMember(input: SaveCastMemberInput, castMember: CastMember) {
    const [type, errorCastMemberType] = CastMemberType.create(input.type).asArray();

    if (errorCastMemberType) {
      throw new EntityValidationError([{ type: [errorCastMemberType.message] }]);
    }

    castMember.changeName(input.name);

    castMember.changeType(type);

    castMember.changeCreatedAt(input.created_at);

    if (castMember.notification.hasErrors()) {
      throw new EntityValidationError(castMember.notification.toJSON());
    }

    await this.castMemberRepo.update(castMember);

    return { id: castMember.cast_member_id.id, created: false };
  }
}

export type SaveCastMemberOutput = { id: string; created: boolean };
