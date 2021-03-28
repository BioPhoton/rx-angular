import { MonoTypeOperatorFunction, Observable } from 'rxjs';
import { filter, mapTo, switchMap } from 'rxjs/operators';
import {
  cancelCallback,
  scheduleCallback,
  forceFrameRate,
  UserBlockingPriority,
  ImmediatePriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
  PriorityLevel,
  NoPriority,
} from './scheduler';
import {
  RxCustomStrategyCredentials,
  RxConcurrentStrategyNames,
  RxStrategyCredentials,
} from './model';
import { coalescingManager, coalescingObj } from '@rx-angular/cdk/coalescing';

forceFrameRate(60);

const noPriorityStrategy: RxStrategyCredentials = {
  name: 'noPriority',
  work: (cdRef) => cdRef.detectChanges(),
  behavior: (work: any, scope: any) => {
    return (o$) =>
      o$.pipe(scheduleOnQueue(work, { priority: NoPriority, scope }));
  },
};

const immediateStrategy: RxStrategyCredentials = {
  name: 'immediate',
  work: (cdRef) => cdRef.detectChanges(),
  behavior: (work: any, scope: any) => {
    return (o$) =>
      o$.pipe(
        scheduleOnQueue(work, {
          priority: ImmediatePriority,
          scope,
        })
      );
  },
};

const userBlockingStrategy: RxStrategyCredentials = {
  name: 'userBlocking',
  work: (cdRef) => cdRef.detectChanges(),
  behavior: (work: any, scope: any) => {
    return (o$) =>
      o$.pipe(
        scheduleOnQueue(work, {
          priority: UserBlockingPriority,
          scope,
        })
      );
  },
};

const normalStrategy: RxStrategyCredentials = {
  name: 'normal',
  work: (cdRef) => cdRef.detectChanges(),
  behavior: (work: any, scope: any) => {
    return (o$) =>
      o$.pipe(scheduleOnQueue(work, { priority: NormalPriority, scope }));
  },
};

const lowStrategy: RxStrategyCredentials = {
  name: 'low',
  work: (cdRef) => cdRef.detectChanges(),
  behavior: (work: any, scope: any) => {
    return (o$) =>
      o$.pipe(scheduleOnQueue(work, { priority: LowPriority, scope }));
  },
};

const idleStrategy: RxStrategyCredentials = {
  name: 'idle',
  work: (cdRef) => cdRef.detectChanges(),
  behavior: (work: any, scope: any) => {
    return (o$) =>
      o$.pipe(scheduleOnQueue(work, { priority: IdlePriority, scope }));
  },
};

function scheduleOnQueue<T>(
  work: (...args: any[]) => void,
  options: {
    priority: PriorityLevel;
    scope: coalescingObj;
    delay?: number;
  }
): MonoTypeOperatorFunction<T> {
  return (o$: Observable<T>): Observable<T> =>
    o$.pipe(
      filter(() => !coalescingManager.isCoalescing(options.scope)),
      switchMap((v) =>
        new Observable<T>((subscriber) => {
          coalescingManager.add(options.scope);
          const task = scheduleCallback(
            options.priority,
            () => {
              work();
              coalescingManager.remove(options.scope);
              subscriber.next(v);
            },
            { delay: options.delay }
          );
          return () => {
            coalescingManager.remove(options.scope);
            cancelCallback(task);
          };
        }).pipe(mapTo(v))
      )
    );
}

export type RxConcurrentStrategies = RxCustomStrategyCredentials<RxConcurrentStrategyNames>;
export const RX_CONCURRENT_STRATEGIES: RxConcurrentStrategies = {
  noPriority: noPriorityStrategy,
  immediate: immediateStrategy,
  userBlocking: userBlockingStrategy,
  normal: normalStrategy,
  low: lowStrategy,
  idle: idleStrategy,
};
