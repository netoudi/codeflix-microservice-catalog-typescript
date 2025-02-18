import { CategoryFakeBuilder } from '@/core/category/domain/category-fake.builder';
import { CategoryValidatorFactory } from '@/core/category/domain/category.validator';
import { AggregateRoot } from '@/core/shared/domain/aggregate-root';
import { ValueObject } from '@/core/shared/domain/value-object';
import { Uuid } from '@/core/shared/domain/value-objects/uuid.vo';

export type CategoryConstructor = {
  id: CategoryId;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  deleted_at?: Date | null;
};

export type CategoryCreateCommand = {
  id: CategoryId;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  deleted_at?: Date | null;
};

export class CategoryId extends Uuid {}

export class Category extends AggregateRoot {
  id: CategoryId;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  deleted_at: Date | null;

  constructor(props: CategoryConstructor) {
    super();
    this.id = props.id;
    this.name = props.name;
    this.description = props.description ?? null;
    this.is_active = props.is_active;
    this.created_at = props.created_at;
    this.deleted_at = props.deleted_at ?? null;
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

  changeCreatedAt(created_at: Date): void {
    this.created_at = created_at;
  }

  markAsDeleted(): void {
    this.deleted_at = new Date();
  }

  markAsNotDeleted(): void {
    this.deleted_at = null;
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
