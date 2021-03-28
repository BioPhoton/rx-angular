import { Notification } from 'rxjs';

export enum RxNotificationKind {
  suspense = 'suspense',
  next = 'next',
  error = 'error',
  complete = 'complete',
}

export type RxNotificationValue = 'value' | 'hasValue';

export type RxNextNotification<T> = Pick<
  Notification<T>,
  RxNotificationValue
  > & {
  kind: RxNotificationKind;
} & { error: boolean } & { complete: boolean };
export type RxSuspenseNotification<T> = Pick<
  Notification<T>,
  RxNotificationValue
  > & { kind: RxNotificationKind.suspense } & { error: false } & {
  complete: false;
};
export type RxErrorNotification<T> = Pick<
  Notification<T>,
  RxNotificationValue
  > & { kind: RxNotificationKind.error } & { error: any } & { complete: false };
export type RxCompleteNotification<T> = Pick<
  Notification<T>,
  RxNotificationValue
  > & { kind: RxNotificationKind.complete } & { complete: boolean } & {
  error: false;
};
export type RxNotification<T> =
  | RxNextNotification<T>
  | RxSuspenseNotification<T>
  | RxErrorNotification<T>
  | RxCompleteNotification<T>;

