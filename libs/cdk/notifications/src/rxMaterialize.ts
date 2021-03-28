import { Notification, Observable, OperatorFunction } from 'rxjs';
import { RxNotification, RxNotificationKind } from './model';
import { map, materialize, tap } from 'rxjs/operators';
import {
  toRxCompleteNotification,
  toRxErrorNotification,
} from './notification-transforms';

const notificationToRxNotification = <T>(
  notification: Notification<T>
): RxNotification<T> => {
  const kind = rxJsToRxA[notification.kind];
  if (kind === RxNotificationKind.error) {
    return toRxErrorNotification(notification.error);
  }
  if (kind === RxNotificationKind.complete) {
    return toRxCompleteNotification(notification.value);
  }

  return {
    ...notification,
    error: false,
    complete: false,
    kind,
  };
};

const rxJsToRxA: Record<'N' | 'E' | 'C', RxNotificationKind> = {
  C: RxNotificationKind.complete,
  E: RxNotificationKind.error,
  N: RxNotificationKind.next,
};

export function rxMaterialize<T>(): OperatorFunction<T, RxNotification<T>> {
  return (o$: Observable<T>): Observable<RxNotification<T>> =>
    o$.pipe(
      materialize(),
      tap(({ kind, error }) => {
        if (kind === 'E') {
          console.error(error);
        }
      }),
      map(notificationToRxNotification)
    );
}
