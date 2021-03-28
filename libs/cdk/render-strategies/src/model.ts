import { ChangeDetectorRef, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { RxNotification } from '@rx-angular/cdk/notifications';
import { coalescingObj} from '@rx-angular/cdk/coalescing';
import { RX_NATIVE_STRATEGIES } from './native-strategies';
import { RX_CONCURRENT_STRATEGIES } from './concurrent-strategies';

export interface ScheduleOnStrategyOptions {
  scope?: Record<string, unknown>;
  strategy?: string;
  patchZone?: false | NgZone;
}

export type RxRenderWork = <T = unknown>(
  cdRef: ChangeDetectorRef,
  scope?: coalescingObj,
  notification?: RxNotification<T>
) => void;
export type RxRenderBehavior = <T = unknown>(
  work: any,
  scope?: coalescingObj
) => (o: Observable<T>) => Observable<T>;

export interface RxStrategyCredentials<S = string> {
  name: S;
  work: RxRenderWork;
  behavior: RxRenderBehavior;
}

export type RxCustomStrategyCredentials<T extends string> = Record<
  T,
  RxStrategyCredentials
  >;
export type RxNativeStrategyNames = 'native' | 'local' | 'global' | 'noop';

export type RxConcurrentStrategyNames =
  | 'noPriority'
  | 'immediate'
  | 'userBlocking'
  | 'normal'
  | 'low'
  | 'idle';

export type RxDefaultStrategyNames =
  | RxNativeStrategyNames
  | RxConcurrentStrategyNames;

export type RxStrategyNames<T> = RxDefaultStrategyNames | T;
export type RxStrategies<T extends string> = RxCustomStrategyCredentials<
  RxStrategyNames<T>
  >;

export interface RenderConfig<T extends string> {
  primaryStrategy?: RxStrategyNames<T>;
  customStrategies?: RxCustomStrategyCredentials<T>;
  patchZone?: boolean;
}


export const RX_ANGULAR_DEFAULTS: Required<
  RenderConfig<RxDefaultStrategyNames>
  > = {
  primaryStrategy: 'normal',
  customStrategies: {
    ...RX_NATIVE_STRATEGIES,
    local: RX_CONCURRENT_STRATEGIES.immediate,
    ...RX_CONCURRENT_STRATEGIES,
  },
  patchZone: true,
};
