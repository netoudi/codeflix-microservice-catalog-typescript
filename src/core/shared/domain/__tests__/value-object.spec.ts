import { ValueObject } from '@/core/shared/domain/value-object';

class StringValueObject extends ValueObject {
  constructor(readonly value: string) {
    super();
  }
}

class ComplexValueObject extends ValueObject {
  constructor(
    readonly prop1: string,
    readonly prop2: number,
  ) {
    super();
  }
}

describe('ValueObject Unit Tests', () => {
  test('should be equals', () => {
    const vo1 = new StringValueObject('any_value');
    const vo2 = new StringValueObject('any_value');
    expect(vo1.equals(vo2)).toBe(true);
    const vo3 = new ComplexValueObject('any_value', 1);
    const vo4 = new ComplexValueObject('any_value', 1);
    expect(vo3.equals(vo4)).toBe(true);
  });

  test('should not be equals', () => {
    const vo1 = new StringValueObject('any_value');
    const vo2 = new StringValueObject('any_other_value');
    expect(vo1.equals(vo2)).toBe(false);
    const vo3 = new ComplexValueObject('any_value', 1);
    const vo4 = new ComplexValueObject('any_value', 2);
    expect(vo3.equals(vo4)).toBe(false);
  });
});
