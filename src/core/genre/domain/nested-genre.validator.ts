import { MaxLength } from 'class-validator';
import { Genre } from '@/core/genre/domain/genre.aggregate';
import { ClassValidatorFields } from '@/core/shared/domain/validators/class-validator-fields';
import { Notification } from '@/core/shared/domain/validators/notification';

export class NestedGenreRules {
  @MaxLength(255, { groups: ['name'] })
  name: string;

  constructor(entity: Genre) {
    Object.assign(this, entity);
  }
}

export class NestedGenreValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : ['name'];
    return super.validate(notification, new NestedGenreRules(data), newFields);
  }
}

export class NestedGenreValidatorFactory {
  static create() {
    return new NestedGenreValidator();
  }
}

export default NestedGenreValidatorFactory;
