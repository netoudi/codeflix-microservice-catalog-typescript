import { FieldsErrors } from '@/core/shared/domain/validators/validator-fields-interface';

export abstract class BaseValidationError extends Error {
  constructor(
    public errors: FieldsErrors[],
    message = 'Validation Error',
  ) {
    super(message);
  }

  count() {
    return Object.keys(this.errors).length;
  }
}

export class ValidationError extends Error {}

export class EntityValidationError extends BaseValidationError {
  constructor(public errors: FieldsErrors[]) {
    super(errors, 'Entity Validation Error');
    this.name = 'EntityValidationError';
  }
}

export class SearchValidationError extends BaseValidationError {
  constructor(errors: FieldsErrors[]) {
    super(errors, 'Search Validation Error');
    this.name = 'SearchValidationError';
  }
}

export class LoadEntityError extends BaseValidationError {
  constructor(public errors: FieldsErrors[]) {
    super(errors, 'LoadEntityError');
    this.name = 'LoadEntityError';
  }
}
