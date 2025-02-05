import { MaxLength } from 'class-validator';
import { Category } from '@/core/category/domain/category.entity';
import { ClassValidatorFields } from '@/core/shared/domain/validators/class-validator-fields';
import { Notification } from '@/core/shared/domain/validators/notification';

export class CategoryRules {
  @MaxLength(255, { groups: ['name'] })
  name: string;

  constructor(category: Category) {
    Object.assign(this, category);
  }
}

export class CategoryValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : ['name'];
    return super.validate(notification, new CategoryRules(data), newFields);
  }
}

export class CategoryValidatorFactory {
  static create(): CategoryValidator {
    return new CategoryValidator();
  }
}
