import { CastMemberFakeBuilder } from '@/core/cast-member/domain/cast-member-fake.builder';
import { CastMemberType } from '@/core/cast-member/domain/cast-member-type.vo';
import { CastMember } from '@/core/cast-member/domain/cast-member.aggregate';
import { CastMemberInMemoryRepository } from '@/core/cast-member/infra/db/in-memory/cast-member-in-memory.repository';

describe('CastMemberInMemoryRepository', () => {
  let repository: CastMemberInMemoryRepository;

  beforeEach(() => (repository = new CastMemberInMemoryRepository()));

  it('should no filter items when filter object is null', async () => {
    const items = [CastMemberFakeBuilder.anActor().build()];

    const itemsFiltered = await repository['applyFilter'](items, null);
    expect(itemsFiltered).toStrictEqual(items);
  });

  it('should filter items by name', async () => {
    const faker = CastMember.fake().anActor();
    const items = [faker.withName('test').build(), faker.withName('TEST').build(), faker.withName('fake').build()];
    const filterSpy = jest.spyOn(items, 'filter' as any);

    const itemsFiltered = await repository['applyFilter'](items, {
      name: 'TEST',
    });
    expect(filterSpy).toHaveBeenCalledTimes(1);
    expect(itemsFiltered).toStrictEqual([items[0], items[1]]);
  });

  it('should filter items by type', async () => {
    const items = [CastMemberFakeBuilder.anActor().build(), CastMemberFakeBuilder.aDirector().build()];
    const filterSpy = jest.spyOn(items, 'filter' as any);

    const itemsFiltered = await repository['applyFilter'](items, {
      type: CastMemberType.createAnActor(),
    });
    expect(filterSpy).toHaveBeenCalledTimes(1);
    expect(itemsFiltered).toStrictEqual([items[0]]);
  });

  it('should sort by created_at when sort param is null', async () => {
    const created_at = new Date();
    const faker = CastMemberFakeBuilder.anActor();
    const items = [
      faker.withName('test').withCreatedAt(created_at).build(),
      faker
        .withName('TEST')
        .withCreatedAt(new Date(created_at.getTime() + 100))
        .build(),
      faker
        .withName('fake')
        .withCreatedAt(new Date(created_at.getTime() + 200))
        .build(),
    ];

    const itemsSorted = await repository['applySort'](items, null, null);
    expect(itemsSorted).toStrictEqual([items[2], items[1], items[0]]);
  });

  it('should sort by name', async () => {
    const items = [
      CastMember.fake().anActor().withName('c').build(),
      CastMember.fake().anActor().withName('b').build(),
      CastMember.fake().anActor().withName('a').build(),
    ];

    let itemsSorted = await repository['applySort'](items, 'name', 'asc');
    expect(itemsSorted).toStrictEqual([items[2], items[1], items[0]]);

    itemsSorted = await repository['applySort'](items, 'name', 'desc');
    expect(itemsSorted).toStrictEqual([items[0], items[1], items[2]]);
  });
});
