import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { ValueObject } from '@/core/shared/domain/value-object';

export class Uuid extends ValueObject {
  public readonly value: string;

  constructor(value?: string) {
    super();
    this.value = value || uuidv4();
    this.validate();
  }

  private validate() {
    const isValid = uuidValidate(this.value);
    if (!isValid) {
      throw new InvalidUuidError();
    }
  }

  toString(): string {
    return this.value;
  }
}

export class InvalidUuidError extends Error {
  constructor(message?: string) {
    super(message || 'Id must be a valid uuid');
    this.name = 'InvalidUuidError';
  }
}
