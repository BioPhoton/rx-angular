import { Observable, Subject } from 'rxjs';
import { RxNotification } from './model';
import { mergeAll, share } from 'rxjs/operators';
import { coerceAllFactory } from '@rx-angular/cdk/coercing';

/**
 * @internal
 *
 * A factory function returning an object to handle the process of switching templates by Notification channel.
 * You can next a Observable of `RxNotification` multiple times and merge them into the Observable exposed under `trigger$`
 *
 */
export function templateTriggerHandling<T>(): {
  trigger$: Observable<RxNotification<T>>;
  next(templateName: Observable<RxNotification<T>>): void;
} {
  const hotFlattened = coerceAllFactory(
    () => new Subject<Observable<RxNotification<T> | RxNotification<T>>>(),
    mergeAll()
  );
  return {
    next(templateName: Observable<RxNotification<T> | RxNotification<T>>) {
      hotFlattened.next(templateName);
    },
    trigger$: hotFlattened.values$.pipe(share()),
  };
}
