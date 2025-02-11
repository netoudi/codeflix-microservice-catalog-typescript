import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Category, CategoryId } from '@/core/category/domain/category.entity';
import {
  CategorySearchParams,
  CategorySearchResult,
  ICategoryRepository,
} from '@/core/category/domain/category.repository';
import { CategoryElasticSearchMapper } from '@/core/category/infra/db/elastic-search/category-elastic-search.mapper';
import { SortDirection } from '@/core/shared/domain/repository/search-params';

export class CategoryElasticSearchRepository implements ICategoryRepository {
  sortableFields: string[] = ['name', 'created_at'];

  constructor(
    private esClient: ElasticsearchService,
    private index: string,
  ) {}

  async search(props: CategorySearchParams): Promise<CategorySearchResult> {
    throw new Error('Method not implemented.');
  }

  async insert(entity: Category): Promise<void> {
    await this.esClient.index({
      index: this.index,
      id: entity.id.value,
      body: CategoryElasticSearchMapper.toDocument(entity),
      refresh: true,
    });
  }

  async bulkInsert(entities: Category[]): Promise<void> {
    await this.esClient.bulk({
      index: this.index,
      body: entities.flatMap((entity) => [
        { index: { _id: entity.id.value } },
        CategoryElasticSearchMapper.toDocument(entity),
      ]),
      refresh: true,
    });
  }

  async update(entity: Category): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async delete(entityId: CategoryId): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async findById(entityId: CategoryId): Promise<Category | null> {
    throw new Error('Method not implemented.');
  }

  async findOneBy(filter: Partial<Category>): Promise<Category | null> {
    throw new Error('Method not implemented.');
  }

  async findBy(filter: Partial<Category>, order?: { field: string; direction: SortDirection }): Promise<Category[]> {
    throw new Error('Method not implemented.');
  }

  async findAll(): Promise<Category[]> {
    throw new Error('Method not implemented.');
  }

  async findByIds(ids: CategoryId[]): Promise<{ exists: Category[]; not_exists: CategoryId[] }> {
    throw new Error('Method not implemented.');
  }

  async existsById(ids: CategoryId[]): Promise<{ exists: CategoryId[]; not_exists: CategoryId[] }> {
    throw new Error('Method not implemented.');
  }
  getEntity(): new (...args: any[]) => Category {
    throw new Error('Method not implemented.');
  }
}
