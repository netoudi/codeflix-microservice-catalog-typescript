import { Chance } from 'chance';
import { CategoryFakeBuilder } from '@/core/category/domain/category-fake.builder';
import { CategoryId } from '@/core/category/domain/category.entity';

describe('CategoryFakerBuilder Unit Tests', () => {
  describe('category_id prop', () => {
    const faker = CategoryFakeBuilder.aCategory();

    test('should be a function', () => {
      expect(typeof faker['_category_id']).toBe('function');
    });

    test('should return a CategoryId instance', () => {
      //@ts-expect-error _category_id is a callable
      const category_id = faker['_category_id']();
      expect(category_id).toBeInstanceOf(CategoryId);
    });

    test('withCategoryId', () => {
      const category_id = new CategoryId();
      const $this = faker.withCategoryId(category_id);
      expect($this).toBeInstanceOf(CategoryFakeBuilder);
      expect(faker['_category_id']).toBe(category_id);

      faker.withCategoryId(() => category_id);
      //@ts-expect-error _category_id is a callable
      expect(faker['_category_id']()).toBe(category_id);

      expect(faker.category_id).toBe(category_id);
    });

    test('should pass index to category_id factory', () => {
      let mockFactory = jest.fn(() => new CategoryId());
      faker.withCategoryId(mockFactory);
      faker.build();
      expect(mockFactory).toHaveBeenCalledTimes(1);

      const categoryId = new CategoryId();
      mockFactory = jest.fn(() => categoryId);
      const fakerMany = CategoryFakeBuilder.theCategories(2);
      fakerMany.withCategoryId(mockFactory);
      fakerMany.build();

      expect(mockFactory).toHaveBeenCalledTimes(2);
      expect(fakerMany.build()[0].id).toBe(categoryId);
      expect(fakerMany.build()[1].id).toBe(categoryId);
    });
  });

  describe('name prop', () => {
    const faker = CategoryFakeBuilder.aCategory();
    test('should be a function', () => {
      expect(typeof faker['_name']).toBe('function');
    });

    test('should call the word method', () => {
      const chance = Chance();
      const spyWordMethod = jest.spyOn(chance, 'word');
      faker['chance'] = chance;
      faker.build();

      expect(spyWordMethod).toHaveBeenCalled();
    });

    test('withName', () => {
      const $this = faker.withName('test name');
      expect($this).toBeInstanceOf(CategoryFakeBuilder);
      expect(faker['_name']).toBe('test name');

      faker.withName(() => 'test name');
      //@ts-expect-error name is callable
      expect(faker['_name']()).toBe('test name');

      expect(faker.name).toBe('test name');
    });

    test('should pass index to name factory', () => {
      faker.withName((index) => `test name ${index}`);
      const category = faker.build();
      expect(category.name).toBe(`test name 0`);

      const fakerMany = CategoryFakeBuilder.theCategories(2);
      fakerMany.withName((index) => `test name ${index}`);
      const categories = fakerMany.build();

      expect(categories[0].name).toBe(`test name 0`);
      expect(categories[1].name).toBe(`test name 1`);
    });

    test('invalid too long case', () => {
      const $this = faker.withInvalidNameTooLong();
      expect($this).toBeInstanceOf(CategoryFakeBuilder);
      expect(faker['_name'].length).toBe(256);

      const tooLong = 'a'.repeat(256);
      faker.withInvalidNameTooLong(tooLong);
      expect(faker['_name'].length).toBe(256);
      expect(faker['_name']).toBe(tooLong);
    });
  });

  describe('description prop', () => {
    const faker = CategoryFakeBuilder.aCategory();
    test('should be a function', () => {
      expect(typeof faker['_description']).toBe('function');
    });

    test('should call the paragraph method', () => {
      const chance = Chance();
      const spyParagraphMethod = jest.spyOn(chance, 'paragraph');
      faker['chance'] = chance;
      faker.build();
      expect(spyParagraphMethod).toHaveBeenCalled();
    });

    test('withDescription', () => {
      const $this = faker.withDescription('test description');
      expect($this).toBeInstanceOf(CategoryFakeBuilder);
      expect(faker['_description']).toBe('test description');

      faker.withDescription(() => 'test description');
      //@ts-expect-error description is callable
      expect(faker['_description']()).toBe('test description');

      expect(faker.description).toBe('test description');
    });

    test('should pass index to description factory', () => {
      faker.withDescription((index) => `test description ${index}`);
      const category = faker.build();
      expect(category.description).toBe(`test description 0`);

      const fakerMany = CategoryFakeBuilder.theCategories(2);
      fakerMany.withDescription((index) => `test description ${index}`);
      const categories = fakerMany.build();

      expect(categories[0].description).toBe(`test description 0`);
      expect(categories[1].description).toBe(`test description 1`);
    });
  });

  describe('is_active prop', () => {
    const faker = CategoryFakeBuilder.aCategory();
    test('should be a function', () => {
      expect(typeof faker['_is_active']).toBe('function');
    });

    test('activate', () => {
      const $this = faker.activate();
      expect($this).toBeInstanceOf(CategoryFakeBuilder);
      expect(faker['_is_active']).toBe(true);
      expect(faker.is_active).toBe(true);
    });

    test('deactivate', () => {
      const $this = faker.deactivate();
      expect($this).toBeInstanceOf(CategoryFakeBuilder);
      expect(faker['_is_active']).toBe(false);
      expect(faker.is_active).toBe(false);
    });
  });

  describe('created_at prop', () => {
    const faker = CategoryFakeBuilder.aCategory();

    test('should be a function', () => {
      expect(typeof faker['_created_at']).toBe('function');
    });

    test('should return a Date instance', () => {
      //@ts-expect-error _created_at is a callable
      const created_at = faker['_created_at']();
      expect(created_at).toBeInstanceOf(Date);
    });

    test('withCreatedAt', () => {
      const date = new Date();
      const $this = faker.withCreatedAt(date);
      expect($this).toBeInstanceOf(CategoryFakeBuilder);
      expect(faker['_created_at']).toBe(date);

      faker.withCreatedAt(() => date);
      //@ts-expect-error _created_at is a callable
      expect(faker['_created_at']()).toBe(date);
      expect(faker.created_at).toBe(date);
    });

    test('should pass index to created_at factory', () => {
      const date = new Date();
      faker.withCreatedAt((index) => new Date(date.getTime() + index + 2));
      const category = faker.build();
      expect(category.created_at.getTime()).toBe(date.getTime() + 2);

      const fakerMany = CategoryFakeBuilder.theCategories(2);
      fakerMany.withCreatedAt((index) => new Date(date.getTime() + index + 2));
      const categories = fakerMany.build();

      expect(categories[0].created_at.getTime()).toBe(date.getTime() + 2);
      expect(categories[1].created_at.getTime()).toBe(date.getTime() + 3);
    });
  });

  describe('deleted_at prop', () => {
    const faker = CategoryFakeBuilder.aCategory();
    test('should be a function', () => {
      expect(typeof faker['_deleted_at']).toBe('function');
    });

    test('deleted', () => {
      const $this = faker.deleted();
      expect($this).toBeInstanceOf(CategoryFakeBuilder);
      expect(faker['_deleted_at']).toBeInstanceOf(Date);
      expect(faker.deleted_at).toBeInstanceOf(Date);
    });

    test('undeleted', () => {
      const $this = faker.undeleted();
      expect($this).toBeInstanceOf(CategoryFakeBuilder);
      expect(faker['_deleted_at']).toBe(null);
      expect(faker.deleted_at).toBe(null);
    });
  });

  test('should create a category', () => {
    const faker = CategoryFakeBuilder.aCategory();
    let category = faker.build();

    expect(category.id).toBeInstanceOf(CategoryId);
    expect(typeof category.name === 'string').toBeTruthy();
    expect(typeof category.description === 'string').toBeTruthy();
    expect(category.is_active).toBe(true);
    expect(category.created_at).toBeInstanceOf(Date);

    const created_at = new Date();
    const category_id = new CategoryId();
    category = faker
      .withCategoryId(category_id)
      .withName('name test')
      .withDescription('description test')
      .deactivate()
      .withCreatedAt(created_at)
      .build();

    expect(category.id.value).toBe(category_id.value);
    expect(category.name).toBe('name test');
    expect(category.description).toBe('description test');
    expect(category.is_active).toBe(false);
    expect(category.created_at).toBe(created_at);
  });

  test('should create many categories', () => {
    const faker = CategoryFakeBuilder.theCategories(2);
    let categories = faker.build();

    categories.forEach((category) => {
      expect(category.id).toBeInstanceOf(CategoryId);
      expect(typeof category.name === 'string').toBeTruthy();
      expect(typeof category.description === 'string').toBeTruthy();
      expect(category.is_active).toBe(true);
      expect(category.created_at).toBeInstanceOf(Date);
    });

    const created_at = new Date();
    const category_id = new CategoryId();
    categories = faker
      .withCategoryId(category_id)
      .withName('name test')
      .withDescription('description test')
      .deactivate()
      .withCreatedAt(created_at)
      .build();

    categories.forEach((category) => {
      expect(category.id.value).toBe(category_id.value);
      expect(category.name).toBe('name test');
      expect(category.description).toBe('description test');
      expect(category.is_active).toBe(false);
      expect(category.created_at).toBe(created_at);
    });
  });
});
