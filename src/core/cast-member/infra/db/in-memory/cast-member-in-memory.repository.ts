import { CastMember, CastMemberId } from '@/core/cast-member/domain/cast-member.aggregate';
import { CastMemberFilter, ICastMemberRepository } from '@/core/cast-member/domain/cast-member.repository';
import { SortDirection } from '@/core/shared/domain/repository/search-params';
import { InMemorySearchableRepository } from '@/core/shared/infra/db/in-memory/in-memory.repository';

export class CastMemberInMemoryRepository
  extends InMemorySearchableRepository<CastMember, CastMemberId, CastMemberFilter>
  implements ICastMemberRepository
{
  sortableFields: string[] = ['name', 'created_at'];

  getEntity(): new (...args: any[]) => CastMember {
    return CastMember;
  }

  protected async applyFilter(items: CastMember[], filter: CastMemberFilter | null): Promise<CastMember[]> {
    const _items = this.applyScopes(items);
    if (!filter) {
      return _items;
    }

    return _items.filter((i: CastMember) => {
      const containsName = filter.name && i.name.toLowerCase().includes(filter.name.toLowerCase());
      const hasType = filter.type && i.type.equals(filter.type);
      return filter.name && filter.type ? containsName && hasType : filter.name ? containsName : hasType;
    });
  }

  protected applySort(items: CastMember[], sort: string | null, sort_dir: SortDirection | null): CastMember[] {
    return sort ? super.applySort(items, sort, sort_dir) : super.applySort(items, 'created_at', 'desc');
  }
}
