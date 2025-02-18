import { ICriteria } from '@/core/shared/domain/repository/criteria.interface';

export class SoftDeleteInMemoryCriteria implements ICriteria {
  applyCriteria(data: any[]): any[] {
    return data.filter((item) => !this.isDeleted(item));
  }

  private isDeleted(entity: any): boolean {
    return 'deleted_at' in entity ? entity.deleted_at !== null : false;
  }
}
