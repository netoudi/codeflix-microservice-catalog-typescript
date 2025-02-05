import { CategoryFakeBuilder } from '@/core/category/domain/category-fake.builder';
import { CategoryValidatorFactory } from '@/core/category/domain/category.validator';
import { AggregateRoot } from '@/core/shared/domain/aggregate-root';
import { ValueObject } from '@/core/shared/domain/value-object';
import { Uuid } from '@/core/shared/domain/value-objects/uuid.vo';

export type CategoryConstructor = {
  id?: CategoryId;
  name: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: Date;
};

export type CategoryCreateCommand = {
  name: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: Date;
};

export class CategoryId extends Uuid {}

export class Category extends AggregateRoot {
  id: CategoryId;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;

  constructor(props: CategoryConstructor) {
    super();
    this.id = props.id ?? new CategoryId();
    this.name = props.name;
    this.description = props.description ?? null;
    this.is_active = props.is_active ?? true;
    this.created_at = props.created_at ?? new Date();
  }

  get entityId(): ValueObject {
    return this.id;
  }

  static create(props: CategoryCreateCommand): Category {
    const category = new Category(props);
    category.validate(['name']);
    return category;
  }

  changeName(name: string): void {
    this.name = name;
    this.validate(['name']);
  }

  changeDescription(description: string | null): void {
    this.description = description;
  }

  activate(): void {
    this.is_active = true;
  }

  deactivate(): void {
    this.is_active = false;
  }

  validate(fields?: string[]): boolean {
    const validator = CategoryValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  static fake() {
    return CategoryFakeBuilder;
  }

  toJSON() {
    return {
      id: this.id.value,
      name: this.name,
      description: this.description,
      is_active: this.is_active,
      created_at: this.created_at,
    };
  }
}
