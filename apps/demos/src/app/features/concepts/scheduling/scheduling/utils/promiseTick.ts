import { Observable } from 'rxjs';
import { Promise } from '@rx-angular/cdk/zone-less';

// @NOTICE replace logic with 7v handling of promises in RxJS

export const promiseTick = () =>
  new Observable<number>((subscriber) => {
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (!cancelled) {
          subscriber.next(0);
          subscriber.complete();
        }
      })
      .catch((e) => {
        subscriber.error(e);
      });
    return () => {
      cancelled = true;
      subscriber.complete();
    };
  });
