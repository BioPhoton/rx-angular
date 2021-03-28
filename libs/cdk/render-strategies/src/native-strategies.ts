import { ɵmarkDirty as markDirty } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  RxCustomStrategyCredentials,
  RxNativeStrategyNames,
  RxStrategyCredentials,
} from './model';
import { coalesceWith } from '@rx-angular/cdk/coalescing';
import {
  cancelAnimationFrame,
  requestAnimationFrame,
} from '@rx-angular/cdk/zone-less';

const animationFrameTick = () =>
  new Observable<number>((subscriber) => {
    const id = requestAnimationFrame(() => {
      subscriber.next(0);
      subscriber.complete();
    });
    return () => {
      cancelAnimationFrame(id);
    };
  });

const localCredentials: RxStrategyCredentials = {
  name: 'local',
  work: (cdRef, _, notification) => {
    cdRef.detectChanges();
  },
  behavior: (work: any, scope) => (o$) =>
    o$.pipe(
      coalesceWith(animationFrameTick(), scope),
      tap(() => work())
    ),
};

const globalCredentials: RxStrategyCredentials = {
  name: 'global',
  work: (_, context) => markDirty(context),
  behavior: (work: any) => (o$) => o$.pipe(tap(() => work())),
};

const noopCredentials: RxStrategyCredentials = {
  name: 'noop',
  work: () => void 0,
  behavior: () => (o$) => o$,
};

const nativeCredentials: RxStrategyCredentials = {
  name: 'native',
  work: (cdRef) => cdRef.markForCheck(),
  behavior: (work: any) => (o$) => o$.pipe(tap(() => work())),
};

export type RxNativeStrategies = RxCustomStrategyCredentials<RxNativeStrategyNames>;
export const RX_NATIVE_STRATEGIES: RxNativeStrategies = {
  global: globalCredentials,
  native: nativeCredentials,
  noop: noopCredentials,
  local: localCredentials,
};
