import { Notification } from '@/core/shared/domain/validators/notification';
import { FieldsErrors } from '@/core/shared/domain/validators/validator-fields-interface';
import { ValueObject } from '@/core/shared/domain/value-object';

expect.extend({
  notificationContainsErrorMessages(expected: Notification, received: Array<FieldsErrors>) {
    const every = received.every((error) => {
      if (typeof error === 'string') {
        return expected.errors.has(error);
      } else {
        return Object.entries(error).every(([field, messages]) => {
          const fieldMessages = expected.errors.get(field) as string[];
          return fieldMessages && fieldMessages.length && fieldMessages.every((message) => messages.includes(message));
        });
      }
    });
    return every
      ? { pass: true, message: () => '' }
      : {
          pass: false,
          message: () => {
            return `The validation errors not contains ${JSON.stringify(received)}. Current: ${JSON.stringify(expected.toJSON())}`;
          },
        };
  },
  toBeValueObject(expected: ValueObject, received: ValueObject) {
    return expected.equals(received)
      ? { pass: true, message: () => '' }
      : {
          pass: false,
          message: () => {
            return `The values object are not equal. Expected: ${JSON.stringify(expected)} | Received: ${JSON.stringify(received)}`;
          },
        };
  },
});
