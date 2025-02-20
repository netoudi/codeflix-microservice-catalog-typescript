import { CastMemberFakeBuilder } from '@/core/cast-member/domain/cast-member-fake.builder';
import { CastMemberType } from '@/core/cast-member/domain/cast-member-type.vo';
import CastMemberValidatorFactory from '@/core/cast-member/domain/cast-member.validator';
import { AggregateRoot } from '@/core/shared/domain/aggregate-root';
import { Uuid } from '@/core/shared/domain/value-objects/uuid.vo';

export type CastMemberConstructorProps = {
  cast_member_id: CastMemberId;
  name: string;
  type: CastMemberType;
  created_at: Date;
  deleted_at?: Date | null;
};

export type CastMemberCreateCommand = {
  cast_member_id: CastMemberId;
  name: string;
  type: CastMemberType;
  created_at: Date;
};

export class CastMemberId extends Uuid {}

export class CastMember extends AggregateRoot {
  cast_member_id: CastMemberId;
  name: string;
  type: CastMemberType;
  created_at: Date;
  deleted_at: Date | null = null;

  constructor(props: CastMemberConstructorProps) {
    super();
    this.cast_member_id = props.cast_member_id;
    this.name = props.name;
    this.type = props.type;
    this.created_at = props.created_at;
    this.deleted_at = props.deleted_at ?? null;
  }

  static create(props: CastMemberCreateCommand) {
    const cast_member = new CastMember(props);
    cast_member.validate(['name']);
    return cast_member;
  }

  changeName(name: string): void {
    this.name = name;
    this.validate(['name']);
  }

  changeType(type: CastMemberType): void {
    this.type = type;
  }

  changeCreatedAt(created_at: Date): void {
    this.created_at = created_at;
  }

  validate(fields?: string[]) {
    const validator = CastMemberValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  markAsDeleted() {
    this.deleted_at = new Date();
  }

  markAsNotDeleted() {
    this.deleted_at = null;
  }

  static fake() {
    return CastMemberFakeBuilder;
  }

  get entityId() {
    return this.cast_member_id;
  }

  toJSON() {
    return {
      cast_member_id: this.cast_member_id.id,
      name: this.name,
      type: this.type.type,
      created_at: this.created_at,
      deleted_at: this.deleted_at,
    };
  }
}
