import {
  RxSuspenseNotification,
  RxNotificationKind,
  RxErrorNotification,
  RxCompleteNotification,
} from './model';

export function toRxErrorNotification<T>(
  error?: any,
  value?: T
): RxErrorNotification<T> {
  return {
    kind: RxNotificationKind.error,
    hasValue: !!value || false,
    value: value,
    complete: false,
    error: error || true,
  };
}
export function toRxSuspenseNotification<T>(
  value?: T
): RxSuspenseNotification<T> {
  return {
    kind: RxNotificationKind.suspense,
    hasValue: !!value || false,
    value,
    complete: false,
    error: false,
  };
}
export function toRxCompleteNotification<T>(
  value?: T
): RxCompleteNotification<T> {
  return {
    kind: RxNotificationKind.complete,
    hasValue: !!value || false,
    value,
    complete: true,
    error: false,
  };
}
