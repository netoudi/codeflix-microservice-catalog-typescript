import { Notification } from '@/core/shared/domain/validators/notification';

export type FieldsErrors = string | { [field: string]: string[] };

export interface IValidatorFields {
  validate(notification: Notification, data: any, fields: string[]): boolean;
}
