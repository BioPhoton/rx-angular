import { MonoTypeOperatorFunction, Observable } from 'rxjs';
import { filter, pluck, shareReplay, take, takeUntil } from 'rxjs/operators';
import { HookProps, OnDestroy$, SingleShotProps } from './model';

export function isSingleShotHookNameGuard<T>(
  name: unknown
): name is keyof SingleShotProps {
  return !!name && typeof name === 'string' && name !== '';
}

/**
 * @internal
 * Operator to filter values for single shot observables
 */
const singleShotOperators = (o$: Observable<true>): Observable<true> =>
  o$.pipe(
    filter((v) => v === true),
    take(1),
    shareReplay()
  );

/**
 * This is an operator that is used to listen to Angular lifecycle hooks.
 * It plucks a defined lefe cycle name `HookProps` and forwards values for the particular value and in the behavior of the hook e.g. single shot
 *
 * @param name
 */
export function toHook<H extends keyof HookProps>(name: H) {
  const operators = isSingleShotHookNameGuard(name)
    ? singleShotOperators
    : (o: Observable<HookProps[H]>): Observable<true> => o;
  return (o$: Observable<HookProps>): Observable<HookProps[H]> =>
    o$.pipe(pluck(name), operators);
}

/**
 * This operator can be used to take instances that implements `OnDestroy$` and unsubscribes from the given Observable when the instances
 * `onDestroy$` Observable emits.
 *
 * @param instanceWithLifecycle
 */
export function untilDestroyed<V>(
  instanceWithLifecycle: OnDestroy$
): MonoTypeOperatorFunction<V> {
  return (source) =>
    source.pipe(takeUntil<V>(instanceWithLifecycle.onDestroy$));
}
