import { MaxLength } from 'class-validator';
import { Category } from '@/core/category/domain/category.entity';
import { ClassValidatorFields } from '@/core/shared/domain/validators/class-validator-fields';
import { Notification } from '@/core/shared/domain/validators/notification';

export class NestedCategoryRules {
  @MaxLength(255, { groups: ['name'] })
  name: string;

  constructor(entity: Category) {
    Object.assign(this, entity);
  }
}

export class NestedCategoryValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : ['name'];
    return super.validate(notification, new NestedCategoryRules(data), newFields);
  }
}

export class NestedCategoryValidatorFactory {
  static create() {
    return new NestedCategoryValidator();
  }
}

export default NestedCategoryValidatorFactory;
