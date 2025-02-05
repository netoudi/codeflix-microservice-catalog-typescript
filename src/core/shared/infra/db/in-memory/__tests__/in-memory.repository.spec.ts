import { Entity } from '@/core/shared/domain/entity';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { ValueObject } from '@/core/shared/domain/value-object';
import { Uuid } from '@/core/shared/domain/value-objects/uuid.vo';
import { InMemoryRepository } from '@/core/shared/infra/db/in-memory/in-memory.repository';

type StubEntityConstructor = {
  id?: Uuid;
  name: string;
  price: number;
};

class StubEntity extends Entity {
  id: Uuid;
  name: string;
  price: number;

  constructor(props: StubEntityConstructor) {
    super();
    this.id = props.id || new Uuid();
    this.name = props.name;
    this.price = props.price;
  }

  get entityId(): ValueObject {
    return this.id;
  }

  toJSON() {
    return {
      id: this.id.value,
      name: this.name,
      price: this.price,
    };
  }
}

class StubInMemoryRepository extends InMemoryRepository<StubEntity, Uuid> {
  getEntity(): new (...args: any[]) => StubEntity {
    return StubEntity;
  }
}

describe('InMemoryRepository Unit Tests', () => {
  let repository: StubInMemoryRepository;

  beforeEach(() => {
    repository = new StubInMemoryRepository();
  });

  it('should insert a new entity', async () => {
    const entity = new StubEntity({
      id: new Uuid(),
      name: 'test',
      price: 100,
    });
    await repository.insert(entity);
    expect(repository.items.length).toBe(1);
    expect(repository.items[0]).toBe(entity);
  });

  it('should bulk insert entities', async () => {
    const entities = [
      new StubEntity({
        id: new Uuid(),
        name: 'test',
        price: 100,
      }),
      new StubEntity({
        id: new Uuid(),
        name: 'test',
        price: 100,
      }),
    ];
    await repository.bulkInsert(entities);
    expect(repository.items.length).toBe(2);
    expect(repository.items).toStrictEqual(entities);
  });

  it('should return all entities', async () => {
    const entity = new StubEntity({
      id: new Uuid(),
      name: 'test',
      price: 100,
    });
    await repository.insert(entity);
    const entities = await repository.findAll();
    expect(entities).toStrictEqual([entity]);
  });

  it('should throw error on update when entity not found', async () => {
    const entity = new StubEntity({ name: 'test', price: 100 });
    await expect(repository.update(entity)).rejects.toThrow(new NotFoundError(entity.entityId, StubEntity));
  });

  it('should update an entity', async () => {
    const entity = new StubEntity({ name: 'test', price: 100 });
    await repository.insert(entity);
    const entityUpdated = new StubEntity({
      id: entity.id,
      name: 'test-updated',
      price: 200,
    });
    await repository.update(entityUpdated);
    expect(entityUpdated.toJSON()).toStrictEqual(repository.items[0].toJSON());
  });

  it('should throw error on delete when entity not found', async () => {
    const entity = new StubEntity({ name: 'test', price: 100 });
    await expect(repository.delete(entity.id)).rejects.toThrow(new NotFoundError(entity.entityId, StubEntity));
    const uuid = new Uuid();
    await expect(repository.delete(uuid)).rejects.toThrow(new NotFoundError(uuid.value, StubEntity));
  });

  it('should delete an entity', async () => {
    const entity = new StubEntity({ name: 'test', price: 100 });
    await repository.insert(entity);
    await repository.delete(entity.id);
    expect(repository.items).toHaveLength(0);
  });
});
