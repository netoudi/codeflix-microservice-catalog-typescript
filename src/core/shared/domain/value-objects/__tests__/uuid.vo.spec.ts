import { validate as uuidValidate } from 'uuid';
import { InvalidUuidError, Uuid } from '@/core/shared/domain/value-objects/uuid.vo';

describe('Uuid Unit Tests', () => {
  const validateSpy = jest.spyOn(Uuid.prototype as any, 'validate');

  test('should throw error when uuid is invalid', () => {
    expect(() => {
      new Uuid('invalid_uuid');
    }).toThrow(new InvalidUuidError());
    expect(validateSpy).toHaveBeenCalledTimes(1);
  });

  test('should create a valid uuid', () => {
    const uuid = new Uuid();
    expect(uuid.value).toBeDefined();
    expect(uuidValidate(uuid.value)).toBe(true);
    expect(validateSpy).toHaveBeenCalledTimes(1);
  });

  test('should accept a valid uuid', () => {
    const uuid = new Uuid('6692fb7f-a062-46f7-b841-80504ad35900');
    expect(uuid.value).toBe('6692fb7f-a062-46f7-b841-80504ad35900');
    expect(validateSpy).toHaveBeenCalledTimes(1);
  });
});
