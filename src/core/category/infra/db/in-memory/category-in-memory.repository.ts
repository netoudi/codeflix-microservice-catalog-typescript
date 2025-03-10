import { Category, CategoryId } from '@/core/category/domain/category.entity';
import { CategoryFilter, ICategoryRepository } from '@/core/category/domain/category.repository';
import { SortDirection } from '@/core/shared/domain/repository/search-params';
import { InMemorySearchableRepository } from '@/core/shared/infra/db/in-memory/in-memory.repository';

export class CategoryInMemoryRepository
  extends InMemorySearchableRepository<Category, CategoryId, CategoryFilter>
  implements ICategoryRepository
{
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasOnlyOneActivateInRelated(categoryId: CategoryId): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasOnlyOneNotDeletedInRelated(categoryId: CategoryId): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  sortableFields: string[] = ['name', 'created_at'];

  protected async applyFilter(items: Category[], filter: CategoryFilter | null): Promise<Category[]> {
    if (!filter) return items;
    return items.filter((i) => {
      return i.name.toLowerCase().includes(filter.name!.toLowerCase());
    });
  }

  protected applySort(items: Category[], sort: string | null, sort_dir: SortDirection | null): Category[] {
    return sort ? super.applySort(items, sort, sort_dir) : super.applySort(items, 'created_at', 'desc');
  }

  getEntity(): new (...args: any[]) => Category {
    return Category;
  }
}
