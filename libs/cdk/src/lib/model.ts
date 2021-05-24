import { ChangeDetectorRef, Type } from '@angular/core';
import {  Notification, Observable } from 'rxjs';

export type coalescingObj =
  | Record<string | number | symbol, unknown>
  | Type<unknown>
  | object;
export interface RxCoalescingOptions {
  scope?: coalescingObj;
}

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

export interface RxAngularConfig<T extends string> {
  primaryStrategy?: RxStrategyNames<T>;
  customStrategies?: RxCustomStrategyCredentials<T>;
  patchZone?: boolean;
}
