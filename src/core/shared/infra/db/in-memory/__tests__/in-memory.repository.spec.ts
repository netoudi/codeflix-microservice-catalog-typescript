import { AggregateRoot } from '@/core/shared/domain/aggregate-root';
import { NotFoundError } from '@/core/shared/domain/errors/not-found';
import { ValueObject } from '@/core/shared/domain/value-object';
import { Uuid } from '@/core/shared/domain/value-objects/uuid.vo';
import { InMemoryRepository } from '@/core/shared/infra/db/in-memory/in-memory.repository';

type StubAggregateConstructor = {
  id?: Uuid;
  name: string;
  price: number;
};

class StubAggregate extends AggregateRoot {
  id: Uuid;
  name: string;
  price: number;

  constructor(props: StubAggregateConstructor) {
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

class StubInMemoryRepository extends InMemoryRepository<StubAggregate, Uuid> {
  getEntity(): new (...args: any[]) => StubAggregate {
    return StubAggregate;
  }
}

describe('InMemoryRepository Unit Tests', () => {
  let repository: StubInMemoryRepository;

  beforeEach(() => {
    repository = new StubInMemoryRepository();
  });

  it('should insert a new entity', async () => {
    const entity = new StubAggregate({ name: 'name value', price: 5 });
    await repository.insert(entity);
    expect(entity.toJSON()).toStrictEqual(repository.items[0].toJSON());
  });

  it('should find a entity by id', async () => {
    let entityFound = await repository.findById(new Uuid());
    expect(entityFound).toBeNull();
    const entity = new StubAggregate({ name: 'name value', price: 5 });
    await repository.insert(entity);
    entityFound = await repository.findById(entity.id);
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());
  });

  it('should find a entity by filter', async () => {
    const entity = new StubAggregate({ name: 'name value', price: 5 });
    await repository.insert(entity);
    let entityFound = await repository.findOneBy({ name: 'name value' });
    expect(entity.toJSON()).toStrictEqual(entityFound!.toJSON());
    entityFound = await repository.findOneBy({ name: 'not found' });
    expect(entityFound).toBeNull();
  });

  it('should find entities by filter', async () => {
    const entity = new StubAggregate({ name: 'name value', price: 5 });
    await repository.insert(entity);
    let entitiesFound = await repository.findBy({ name: 'name value' });
    expect(entitiesFound).toStrictEqual([entity]);
    entitiesFound = await repository.findBy({ name: 'not found' });
    expect(entitiesFound).toStrictEqual([]);
  });

  it('should find entities by filter and order', async () => {
    const entity1 = new StubAggregate({ name: 'name value', price: 5 });
    const entity2 = new StubAggregate({ name: 'name value', price: 10 });
    await repository.bulkInsert([entity1, entity2]);
    let entitiesFound = await repository.findBy({ name: 'name value' }, { field: 'price', direction: 'asc' });
    expect(entitiesFound).toStrictEqual([entity1, entity2]);
    entitiesFound = await repository.findBy({ name: 'name value' }, { field: 'price', direction: 'desc' });
    expect(entitiesFound).toStrictEqual([entity2, entity1]);
  });

  it('should return all entities', async () => {
    const entity = new StubAggregate({ name: 'name value', price: 5 });
    await repository.insert(entity);
    const entities = await repository.findAll();
    expect(entities).toStrictEqual([entity]);
  });

  it('should throw error on update when entity not found', async () => {
    const entity = new StubAggregate({ name: 'name value', price: 5 });
    expect(repository.update(entity)).rejects.toThrow(new NotFoundError(entity.id, StubAggregate));
  });

  it('should update an entity', async () => {
    const entity = new StubAggregate({ name: 'name value', price: 5 });
    await repository.insert(entity);
    const entityUpdated = new StubAggregate({
      id: entity.id,
      name: 'updated',
      price: 1,
    });
    await repository.update(entityUpdated);
    expect(entityUpdated.toJSON()).toStrictEqual(repository.items[0].toJSON());
  });

  it('should throw error on delete when entity not found', async () => {
    const uuid = new Uuid();
    expect(repository.delete(uuid)).rejects.toThrow(new NotFoundError(uuid.value, StubAggregate));
    expect(repository.delete(new Uuid('9366b7dc-2d71-4799-b91c-c64adb205104'))).rejects.toThrow(
      new NotFoundError('9366b7dc-2d71-4799-b91c-c64adb205104', StubAggregate),
    );
  });

  it('should delete an entity', async () => {
    const entity = new StubAggregate({ name: 'name value', price: 5 });
    await repository.insert(entity);
    await repository.delete(entity.id);
    expect(repository.items).toHaveLength(0);
  });
});
