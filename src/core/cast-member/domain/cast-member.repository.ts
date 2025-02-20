import {
  CastMemberType,
  CastMemberTypes,
  InvalidCastMemberTypeError,
} from '@/core/cast-member/domain/cast-member-type.vo';
import { CastMember, CastMemberId } from '@/core/cast-member/domain/cast-member.aggregate';
import { Either } from '@/core/shared/domain/either';
import { ISearchableRepository } from '@/core/shared/domain/repository/repository-interface';
import { SearchParams, SearchParamsConstructor } from '@/core/shared/domain/repository/search-params';
import { SearchResult } from '@/core/shared/domain/repository/search-result';
import { SearchValidationError } from '@/core/shared/domain/validators/validation.error';

export type CastMemberFilter = {
  name?: string | null;
  type?: CastMemberType | null;
};

export class CastMemberSearchParams extends SearchParams<CastMemberFilter> {
  private constructor(props: SearchParamsConstructor<CastMemberFilter> = {}) {
    super(props);
  }

  static create(
    props: Omit<SearchParamsConstructor<CastMemberFilter>, 'filter'> & {
      filter?: {
        name?: string | null;
        type?: CastMemberTypes | null;
      };
    } = {},
  ) {
    const [type, errorCastMemberType] = Either.of(props.filter?.type)
      .map((type) => type || null)
      .chain<CastMemberType | null, InvalidCastMemberTypeError>((type) =>
        type ? CastMemberType.create(type) : Either.of(null),
      )
      .asArray();

    if (errorCastMemberType) {
      const error = new SearchValidationError([{ type: [errorCastMemberType.message] }]);
      throw error;
    }

    return new CastMemberSearchParams({
      ...props,
      filter: {
        name: props.filter?.name,
        type: type,
      },
    });
  }

  get filter(): CastMemberFilter | null {
    return this._filter;
  }

  protected set filter(value: CastMemberFilter | null) {
    const _value = !value || (value as unknown) === '' || typeof value !== 'object' ? null : value;

    const filter = {
      ...(_value && _value.name && { name: `${_value?.name}` }),
      ...(_value && _value.type && { type: _value.type }),
    };

    this._filter = Object.keys(filter).length === 0 ? null : filter;
  }
}

export class CastMemberSearchResult extends SearchResult<CastMember> {}

export interface ICastMemberRepository
  extends ISearchableRepository<
    CastMember,
    CastMemberId,
    CastMemberFilter,
    CastMemberSearchParams,
    CastMemberSearchResult
  > {}
