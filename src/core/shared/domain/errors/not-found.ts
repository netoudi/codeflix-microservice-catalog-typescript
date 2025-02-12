import { Entity } from '@/core/shared/domain/entity';

export class NotFoundError extends Error {
  constructor(id: any[] | any, entityClass: new (...args: any[]) => Entity) {
    const idsMessage = Array.isArray(id) ? id.join(', ') : id;
    super(`Entity ${entityClass.name} with id ${idsMessage} not found`);
    this.name = 'NotFoundError';
  }
}
