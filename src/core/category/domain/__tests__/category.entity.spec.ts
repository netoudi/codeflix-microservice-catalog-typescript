import { Category, CategoryId } from '@/core/category/domain/category.entity';

describe('Category Unit Tests', () => {
  beforeEach(() => {
    Category.prototype.validate = jest.fn().mockImplementation(Category.prototype.validate);
  });

  describe('constructor', () => {
    test('should create a category with default values', () => {
      const category = new Category({
        name: 'Movie',
      });
      expect(category.id).toBeInstanceOf(CategoryId);
      expect(category.name).toBe('Movie');
      expect(category.description).toBeNull();
      expect(category.is_active).toBeTruthy();
      expect(category.created_at).toBeInstanceOf(Date);
    });

    test('should create a category with all values', () => {
      const created_at = new Date();
      const category = new Category({
        name: 'Movie',
        description: 'Movie description',
        created_at,
      });
      expect(category.id).toBeInstanceOf(CategoryId);
      expect(category.name).toBe('Movie');
      expect(category.description).toBe('Movie description');
      expect(category.is_active).toBeTruthy();
      expect(category.created_at).toBe(created_at);
    });

    test('should create a category with name and description', () => {
      const category = new Category({
        name: 'Movie',
        description: 'Movie description',
      });
      expect(category.id).toBeInstanceOf(CategoryId);
      expect(category.name).toBe('Movie');
      expect(category.description).toBe('Movie description');
      expect(category.is_active).toBeTruthy();
      expect(category.created_at).toBeInstanceOf(Date);
    });
  });

  describe('id field', () => {
    const arrange = [{ id: null }, { id: undefined }, { id: new CategoryId() }];
    test.each(arrange)('when id is %j', ({ id }) => {
      const category = new Category({
        id: id as any,
        name: 'Movie',
      });
      expect(category.id).toBeInstanceOf(CategoryId);
      if (id instanceof CategoryId) {
        expect(category.id).toBe(id);
      }
    });
  });

  describe('create command', () => {
    test('should create a category with default values', () => {
      const category = Category.create({
        name: 'Movie',
      });
      expect(category.id).toBeInstanceOf(CategoryId);
      expect(category.name).toBe('Movie');
      expect(category.description).toBeNull();
      expect(category.is_active).toBeTruthy();
      expect(category.created_at).toBeInstanceOf(Date);
      expect(Category.prototype.validate).toHaveBeenCalledTimes(1);
      expect(category.notification.hasErrors()).toBeFalsy();
    });

    test('should create a category with all values', () => {
      const created_at = new Date();
      const category = Category.create({
        name: 'Movie',
        description: 'Movie description',
        created_at,
      });
      expect(category.id).toBeInstanceOf(CategoryId);
      expect(category.name).toBe('Movie');
      expect(category.description).toBe('Movie description');
      expect(category.is_active).toBeTruthy();
      expect(category.created_at).toBe(created_at);
      expect(Category.prototype.validate).toHaveBeenCalledTimes(1);
      expect(category.notification.hasErrors()).toBeFalsy();
    });

    test('should create a category with name and description', () => {
      const category = Category.create({
        name: 'Movie',
        description: 'Movie description',
      });
      expect(category.id).toBeInstanceOf(CategoryId);
      expect(category.name).toBe('Movie');
      expect(category.description).toBe('Movie description');
      expect(category.is_active).toBeTruthy();
      expect(category.created_at).toBeInstanceOf(Date);
      expect(Category.prototype.validate).toHaveBeenCalledTimes(1);
      expect(category.notification.hasErrors()).toBeFalsy();
    });

    test('should create a category with name and is_active', () => {
      const category = Category.create({
        name: 'Movie',
        is_active: false,
      });
      expect(category.id).toBeInstanceOf(CategoryId);
      expect(category.name).toBe('Movie');
      expect(category.description).toBeNull();
      expect(category.is_active).toBeFalsy();
      expect(category.created_at).toBeInstanceOf(Date);
      expect(Category.prototype.validate).toHaveBeenCalledTimes(1);
      expect(category.notification.hasErrors()).toBeFalsy();
    });
  });

  describe('actions', () => {
    test('should change name', () => {
      const category = Category.create({
        name: 'Movie',
      });
      category.changeName('name-updated');
      expect(category.name).toBe('name-updated');
      expect(Category.prototype.validate).toHaveBeenCalledTimes(2);
      expect(category.notification.hasErrors()).toBeFalsy();
    });

    test('should change description', () => {
      const category = Category.create({
        name: 'Movie',
        description: 'Movie description',
      });
      category.changeDescription('description-updated');
      expect(category.description).toBe('description-updated');
      expect(Category.prototype.validate).toHaveBeenCalledTimes(1);
      expect(category.notification.hasErrors()).toBeFalsy();
    });

    test('should active a category', () => {
      const category = Category.create({
        name: 'Movie',
        is_active: false,
      });
      category.activate();
      expect(category.is_active).toBe(true);
    });

    test('should disable a category', () => {
      const category = Category.create({
        name: 'Movie',
        is_active: true,
      });
      category.deactivate();
      expect(category.is_active).toBe(false);
    });
  });
});

describe('Category Validator', () => {
  describe('create command', () => {
    test('should an invalid category with name property', () => {
      const category = Category.create({ name: 'x'.repeat(256) });
      expect(category.notification.hasErrors()).toBeTruthy();
      expect(category.notification).notificationContainsErrorMessages([
        {
          name: ['name must be shorter than or equal to 255 characters'],
        },
      ]);
    });
  });

  describe('changeName method', () => {
    test('should an invalid category with name property', () => {
      const category = Category.create({ name: 'Movie' });
      category.changeName('x'.repeat(256));
      expect(category.notification.hasErrors()).toBeTruthy();
      expect(category.notification).notificationContainsErrorMessages([
        {
          name: ['name must be shorter than or equal to 255 characters'],
        },
      ]);
    });
  });
});
