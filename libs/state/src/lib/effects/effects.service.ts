import { ErrorHandler, Injectable, OnDestroy, Optional } from '@angular/core';
import {
  ConnectableObservable,
  EMPTY,
  from,
  Observable,
  ObservableInput,
  PartialObserver,
  pipe,
  Subject,
  Subscription,
} from 'rxjs';
import {
  catchError,
  filter,
  mapTo,
  mergeAll,
  publish,
  takeUntil,
  tap,
} from 'rxjs/operators';
import {
  DestroyProp,
  OnDestroy$,
  toHook,
  untilDestroyed,
} from '@rx-angular/cdk';

/**
 * Reduces subscription boilerplate for performing observable-based side-effects in components.
 *
 * Before:
 * ```ts
 * @Component({
 *   // ...
 * })
 * export class FooComponent implements OnDestroy {
 *   private readonly destroy$ = new Subject<void>();
 *
 *   constructor() {
 *     obs$.pipe(takeUntil(this.destroy$)).subscribe(doSideEffect);
 *   }
 *
 *   ngOnDestroy(): void {
 *     this.destroy$.next();
 *     this.destroy$.complete();
 *   }
 * }
 * ```
 *
 * After:
 * ```ts
 * @Component({
 *   // ...
 *   providers: [RxEffects],
 * })
 * export class FooComponent {
 *   constructor(effects: RxEffects) {
 *     effects.register(obs$, doSideEffect);
 *     // OR
 *     effects.register(obs$.pipe(tap(doSideEffect)));
 *     // OR
 *     effects.register(obs$.subscribe(doSideEffect));
 *   }
 * }
 * ```
 *
 * NOTE: Avoid calling register/unregister/subscribe inside the side-effect function.
 */
@Injectable()
export class RxEffects implements OnDestroy, OnDestroy$ {

  constructor(
    @Optional()
    private readonly errorHandler: ErrorHandler
  ) {}

  private static nextId = 0;
  readonly _hooks$ = new Subject<DestroyProp>();
  private readonly observables$ = new Subject<Observable<unknown>>();
  // we have to use publish here to make it hot (composition happens without subscriber)
  private readonly effects$ = this.observables$.pipe(mergeAll(), publish());
  onDestroy$: Observable<boolean> = this._hooks$.pipe(toHook('destroy'));
  private readonly destroyers: Record<number, Subject<void>> = {};
  private readonly subscription = (this
    .effects$ as ConnectableObservable<any>).connect();

  /**
   * Performs a side-effect whenever a source observable emits, and handles its subscription.
   *
   * @example
   * effects.register(
   *   colorMode$,
   *   mode => localStorage.setItem('colorMode', mode)
   * );
   *
   * @param sourceObs Source observable input
   * @param sideEffectFn Function with side-effect
   * @returns Effect ID (can be used to unregister imperatively)
   */
  register<T>(
    sourceObs: ObservableInput<T>,
    sideEffectFn: (value: T) => void
  ): number;

  /**
   * Subscribe to source observable using an observer object.
   *
   * @example
   * effects.register(
   *   colorMode$,
   *   {
   *     next: mode => localStorage.setItem('colorMode', mode),
   *     error: err => {
   *       console.error('Color mode error: ', err);
   *       localStorage.removeItem('colorMode');
   *     }
   *   }
   * );
   *
   * @param sourceObs Source observable input
   * @param observer Observer object
   */
  register<T>(
    sourceObs: ObservableInput<T>,
    // tslint:disable-next-line: unified-signatures
    observer: PartialObserver<T>
  ): number;

  /**
   * Handles subscription for an observable with a side-effect.
   *
   * @example
   * effects.register(
   *   colorMode$.pipe(
   *     tap(mode => localStorage.setItem('colorMode', mode))
   *   )
   * );
   *
   * @param sideEffectObs Observable input with side-effect
   * @returns Effect ID (can be used to unregister imperatively)
   */
  register(sideEffectObs: ObservableInput<unknown>): number;

  /**
   * Handles subscription to an observable with a side-effect.
   *
   * @example
   * effects.register(
   *   colorMode$.subscribe(mode => localStorage.setItem('colorMode', mode))
   * );
   *
   * @param subscription Subscription to observable with side-effect
   */
  // tslint:disable-next-line: unified-signatures
  register(subscription: Subscription): void;

  register<T>(
    obsOrSub: ObservableInput<T> | Subscription,
    fnOrObj?: ((value: T) => void) | PartialObserver<T>
  ): number | void {
    if (obsOrSub instanceof Subscription) {
      this.subscription.add(obsOrSub);
      return;
    }
    const effectId = RxEffects.nextId++;
    const destroy$ = (this.destroyers[effectId] = new Subject<void>());
    const applyBehavior = pipe(mapTo(effectId), takeUntil(destroy$));
    if (fnOrObj != null) {
      this.observables$.next(
        from(obsOrSub).pipe(
          // ternary expression is to help Typescript infer overloads
          typeof fnOrObj === 'function' ? tap(fnOrObj) : tap(fnOrObj),
          catchError((err) => {
            this.errorHandler?.handleError(err);
            return EMPTY;
          }),
          applyBehavior
        )
      );
    } else {
      this.observables$.next(from(obsOrSub).pipe(applyBehavior));
    }
    return effectId;
  }

  /**
   * Imperatively cancel a side-effect while the component is still running.
   *
   * Note that all effects are automatically cancelled when a component is destroyed,
   * so you most often won't need to call this method.
   * @param effectId Effect ID (returned by register method)
   */
  unregister(effectId: number): void {
    this.destroyers[effectId]?.next();
  }

  /**
   * Fires a sideEffect when the instances `OnDestroy` hook is fired.
   *
   * @example
   * effects.registerOnDestroy(mode => localStorage.setItem('colorMode', mode));
   *
   * @param sideEffect
   */
  registerOnDestroy(sideEffect: (value: boolean) => void): number | void {
    return this.register(this.onDestroy$, sideEffect);
  }

  /**
   * Operator that unsubscribes based on emission of an registered effect.
   *
   * @example
   * const effectId1 = effects.register(
   *   colorMode$.subscribe(mode => localStorage.setItem('colorMode', mode))
   * );
   *
   * someValue$.pipe(
   *    effect.untilEffect(effectId1)
   * )
   *
   */
  untilEffect(effectId: number) {
    return <V>(source: Observable<V>) =>
      source.pipe(
        untilDestroyed(this),
        takeUntil(this.effects$.pipe(filter((eId) => eId === effectId)))
      );
  }

  /**
   * Operator that unsubscribes based on the `OnDestroy` lifecycle hook of this instance.
   *
   * @NOTICE
   * This operator has to be placed always at the end of the operator chain (before the subscription).
   * Otherwise we may leak as a subsequent operator could instantiate new ongoing Observables which will not get unsubscribed.
   *
   * @example
   * someValue$.pipe(
   *    effect.untilDestroy()
   * )
   *
   */
  untilDestroy() {
    return <V>(source: Observable<V>) => source.pipe(untilDestroyed(this));
  }

  /**
   * @internal
   */
  ngOnDestroy(): void {
    this._hooks$.next({ destroy: true });
    this.subscription.unsubscribe();
  }
}
