import { Type } from '@angular/core';

export type coalescingObj =
  | Record<string | number | symbol, unknown>
  | Type<unknown>;
export interface RxCoalescingOptions {
  scope?: coalescingObj;
}
