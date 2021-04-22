import { Injectable, OnDestroy } from '@angular/core';
import { EMPTY, isObservable, Observable, OperatorFunction, Subscribable, Subscription, Unsubscribable } from 'rxjs';
import { catchError, map, pluck, tap } from 'rxjs/operators';
import { isKeyOf, isOperateFnArrayGuard, isStringArrayGuard, pipeFromArray, safePluck } from './core';
import { AccumulationFn, createAccumulationObservable, createSideEffectObservable } from './cdk';
import { stateful } from './rxjs/operators';

type ProjectStateFn<T> = (oldState: T) => Partial<T>;
type ProjectValueFn<T, K extends keyof T> = (oldState: T) => T[K];

type ProjectStateReducer<T, V> = (oldState: T, value: V) => Partial<T>;

type ProjectValueReducer<T, K extends keyof T, V> = (
  oldState: T,
  value: V
) => T[K];

/**
 * @description
 * RxState is a light-weight reactive state management service for managing local state in angular.
 *
 * @example
 * Component({
 *   selector: 'app-stateful',
 *   template: `<div>{{ state$ | async | json }}</div>`,
 *   providers: [RxState]
 * })
 * export class StatefulComponent {
 *   readonly state$ = this.state.select();
 *
 *   constructor(private state: RxState<{ foo: string }>) {}
 * }
 *
 * @docsCategory RxState
 * @docsPage RxState
 */
@Injectable()
export class RxState<T extends object> implements OnDestroy, Subscribable<T> {
  private subscription = new Subscription();

  private accumulator = createAccumulationObservable<T>();
  private effectObservable = createSideEffectObservable();

  /**
   * @description
   * The unmodified state exposed as `Observable<T>`. It is not shared, distinct or gets replayed.
   * Use the `$` property if you want to read the state without having applied {@link stateful} to it.
   */
  readonly $: Observable<T> = this.accumulator.signal$;

  /**
   * @internal
   */
  constructor() {
    this.subscription.add(this.subscribe());
  }

  /**
   * @internal
   */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * @description
   *
   * Allows to customize state accumulation function.
   * This can be helpful to implement deep updates and tackle other immutability problems in a custom way.
   * @example
   *
   * ```typescript
   * const myAccumulator = (state: MyState, slice: Partial<MyState>) => deepCopy(state, slice);
   *
   * this.state.setAccumulator(myAccumulator);
   * ```
   */
  setAccumulator(accumulatorFn: AccumulationFn): void {
    this.accumulator.nextAccumulator(accumulatorFn);
  }

  /**
   * @description
   * Read from the state in imperative manner. Returns the state object in its current state.
   *
   * @example
   * const { disabled } = state.get();
   * if (!disabled) {
   *   doStuff();
   * }
   *
   * @return T
   */
  get(): T;

  /**
   * @description
   * Read from the state in imperative manner by providing keys as parameters.
   * Returns the part of state object.
   *
   * @example
   * // Access a single property
   *
   * const bar = state.get('bar');
   *
   * // Access a nested property
   *
   * const foo = state.get('bar', 'foo');
   *
   * @return T | T[K1] | T[K1][K2]
   */

  get<K1 extends keyof T>(k1: K1): T[K1];
  /** @internal **/
  get<K1 extends keyof T, K2 extends keyof T[K1]>(k1: K1, k2: K2): T[K1][K2];
  /** @internal **/
  get<K1 extends keyof T, K2 extends keyof T[K1], K3 extends keyof T[K1][K2]>(
    k1: K1,
    k2: K2,
    k3: K3
  ): T[K1][K2][K3];
  /** @internal **/
  get<K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    K4 extends keyof T[K1][K2][K3]>(k1: K1, k2: K2, k3: K3, k4: K4): T[K1][K2][K3][K4];
  /** @internal **/
  get<K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    K4 extends keyof T[K1][K2][K3],
    K5 extends keyof T[K1][K2][K3][K4]>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5): T[K1][K2][K3][K4][K5];
  /** @internal **/
  get<K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    K4 extends keyof T[K1][K2][K3],
    K5 extends keyof T[K1][K2][K3][K4],
    K6 extends keyof T[K1][K2][K3][K4][K5]>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5, k6: K6): T[K1][K2][K3][K4][K5][K6];
  /** @internal **/
  get<K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    K4 extends keyof T[K1][K2][K3],
    K5 extends keyof T[K1][K2][K3][K4],
    K6 extends keyof T[K1][K2][K3][K4][K5]>(
    ...keys:
      | [K1]
      | [K1, K2]
      | [K1, K2, K3]
      | [K1, K2, K3, K4]
      | [K1, K2, K3, K4, K5]
      | [K1, K2, K3, K4, K5, K6]
  ):
    | T
    | T[K1]
    | T[K1][K2]
    | T[K1][K2][K3]
    | T[K1][K2][K3][K4]
    | T[K1][K2][K3][K4][K5]
    | T[K1][K2][K3][K4][K5][K6] {
    const hasStateAnyKeys = Object.keys(this.accumulator.state).length > 0;
    if (!!keys && keys.length) {
      return safePluck(this.accumulator.state, keys);
    } else {
      return hasStateAnyKeys ?
             this.accumulator.state :
              undefined as unknown as T;
    }
  }

  /**
   * @description
   * Manipulate one or many properties of the state by providing a `Partial<T>` state or a `ProjectionFunction<T>`.
   *
   * @example
   * // Update one or many properties of the state by providing a `Partial<T>`
   *
   * const partialState = {
   *   foo: 'bar',
   *   bar: 5
   * };
   * state.set(partialState);
   *
   * // Update one or many properties of the state by providing a `ProjectionFunction<T>`
   *
   * const reduceFn = oldState => ({
   *   bar: oldState.bar + 5
   * });
   * state.set(reduceFn);
   *
   * @param {Partial<T>|ProjectStateFn<T>} stateOrProjectState
   * @return void
   */
  set(stateOrProjectState: Partial<T> | ProjectStateFn<T>): void;

  /**
   * @description
   * Manipulate a single property of the state by the property name and a `ProjectionFunction<T>`.
   *
   * @example
   * const reduceFn = oldState => oldState.bar + 5;
   * state.set('bar', reduceFn);
   *
   * @param {K} key
   * @param {ProjectValueFn<T, K>} projectSlice
   * @return void
   */
  set<K extends keyof T, O>(key: K, projectSlice: ProjectValueFn<T, K>): void;
  /**
   * @internal
   */
  set<K extends keyof T>(
    keyOrStateOrProjectState: Partial<T> | ProjectStateFn<T> | K,
    stateOrSliceProjectFn?: ProjectValueFn<T, K>
  ): void {
    if (
      typeof keyOrStateOrProjectState === 'object' &&
      stateOrSliceProjectFn === undefined
    ) {
      this.accumulator.nextSlice(keyOrStateOrProjectState);
      return;
    }

    if (
      typeof keyOrStateOrProjectState === 'function' &&
      stateOrSliceProjectFn === undefined
    ) {
      this.accumulator.nextSlice(
        keyOrStateOrProjectState(this.accumulator.state)
      );
      return;
    }

    if (
      isKeyOf<T>(keyOrStateOrProjectState) &&
      typeof stateOrSliceProjectFn === 'function'
    ) {
      const state: Partial<T> = {};
      state[keyOrStateOrProjectState] = stateOrSliceProjectFn(
        this.accumulator.state
      );
      this.accumulator.nextSlice(state);
      return;
    }

    throw new Error('wrong params passed to set');
  }

  /**
   * @description
   * Connect an `Observable<Partial<T>>` to the state `T`.
   * Any change emitted by the source will get merged into the state.
   * Subscription handling is done automatically.
   *
   * @example
   * const sliceToAdd$ = interval(250).pipe(mapTo({
   *   bar: 5,
   *   foo: 'foo'
   * });
   * state.connect(sliceToAdd$);
   * // every 250ms the properties bar and foo get updated due to the emission of sliceToAdd$
   *
   * // Additionally you can provide a `projectionFunction` to access the current state object and do custom mappings.
   *
   * const sliceToAdd$ = interval(250).pipe(mapTo({
   *   bar: 5,
   *   foo: 'foo'
   * });
   * state.connect(sliceToAdd$, (state, slice) => state.bar += slice.bar);
   * // every 250ms the properties bar and foo get updated due to the emission of sliceToAdd$. Bar will increase by
   * // 5 due to the projectionFunction
   */
  connect(inputOrSlice$: Observable<Partial<T>>): void;

  /**
   * @description
   * Connect an `Observable<V>` to the state `T`.
   * Any change emitted by the source will get forwarded to to project function and merged into the state.
   * Subscription handling is done automatically.
   *
   * You have to provide a `projectionFunction` to access the current state object and do custom mappings.
   *
   * @example
   * const sliceToAdd$ = interval(250);
   * state.connect(sliceToAdd$, (s, v) => ({bar: v}));
   * // every 250ms the property bar get updated due to the emission of sliceToAdd$
   *
   */
  connect<V>(
    inputOrSlice$: Observable<V>,
    projectFn: ProjectStateReducer<T, V>
  ): void;
  /**
   *
   * @description
   * Connect an `Observable<T[K]>` source to a specific property `K` in the state `T`. Any emitted change will update
   * this
   * specific property in the state.
   * Subscription handling is done automatically.
   *
   * @example
   * const myTimer$ = interval(250);
   * state.connect('timer', myTimer$);
   * // every 250ms the property timer will get updated
   */
  connect<K extends keyof T>(key: K, slice$: Observable<T[K]>): void;
  /**
   *
   * @description
   * Connect an `Observable<V>` source to a specific property in the state. Additionally you can provide a
   * `projectionFunction` to access the current state object on every emission of your connected `Observable`.
   * Any change emitted by the source will get merged into the state.
   * Subscription handling is done automatically.
   *
   * @example
   * const myTimer$ = interval(250);
   * state.connect('timer', myTimer$, (state, timerChange) => state.timer += timerChange);
   * // every 250ms the property timer will get updated
   */
  connect<K extends keyof T, V>(
    key: K,
    input$: Observable<V>,
    projectSliceFn: ProjectValueReducer<T, K, V>
  ): void;
  /**
   * @internal
   */
  connect<K extends keyof T, V>(
    keyOrInputOrSlice$: K | Observable<Partial<T> | V>,
    projectOrSlices$?: ProjectStateReducer<T, V> | Observable<T[K]>,
    projectValueFn?: ProjectValueReducer<T, K, V>
  ): void {
    if (
      isObservable<Partial<T>>(keyOrInputOrSlice$) &&
      projectOrSlices$ === undefined &&
      projectValueFn === undefined
    ) {
      this.accumulator.nextSliceObservable(keyOrInputOrSlice$);
      return;
    }

    if (
      isObservable<V>(keyOrInputOrSlice$) &&
      typeof projectOrSlices$ === 'function' &&
      !isObservable<T[K]>(projectOrSlices$) &&
      projectValueFn === undefined
    ) {
      const project = projectOrSlices$;
      const slice$ = keyOrInputOrSlice$.pipe(
        map((v) => project(this.get(), v))
      );
      this.accumulator.nextSliceObservable(slice$);
      return;
    }

    if (
      isKeyOf<T>(keyOrInputOrSlice$) &&
      isObservable<T[K]>(projectOrSlices$) &&
      projectValueFn === undefined
    ) {
      const key = keyOrInputOrSlice$;
      const slice$ = projectOrSlices$.pipe(
        map((value) => ({ ...{}, [key]: value }))
      );
      this.accumulator.nextSliceObservable(slice$);
      return;
    }

    if (
      isKeyOf<T>(keyOrInputOrSlice$) &&
      isObservable<V>(projectOrSlices$) &&
      typeof projectValueFn === 'function'
    ) {
      const key = keyOrInputOrSlice$;
      const slice$ = projectOrSlices$.pipe(
        map((value) => ({ ...{}, [key]: projectValueFn(this.get(), value) }))
      );
      this.accumulator.nextSliceObservable(slice$);
      return;
    }

    throw new Error('wrong params passed to connect');
  }

  /**
   * @description
   * returns the state as cached and distinct `Observable<T>`. This way you don't have to think about **late
   * subscribers**,
   * **multiple subscribers** or **multiple emissions** of the same value
   *
   * @example
   * const state$ = state.select();
   * state$.subscribe(state => doStuff(state));
   *
   * @returns Observable<T>
   */
  select(): Observable<T>;

  /**
   * @description
   * returns the state as cached and distinct `Observable<A>`. Accepts arbitrary
   * [rxjs operators](https://rxjs-dev.firebaseapp.com/guide/operators) to enrich the selection with reactive composition.
   *
   * @example
   * const profilePicture$ = state.select(
   *  pluck('profilePicture'),
   *  switchMap(profilePicture => mapImageAsync(profilePicture))
   * );
   * @param op { OperatorFunction<T, A> }
   * @returns Observable<A>
   */
  select<A = T>(op: OperatorFunction<T, A>): Observable<A>;
  /**
   * @internal
   */
  select<A = T, B = A>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>
  ): Observable<B>;
  /**
   * @internal
   */
  select<A = T, B = A, C = B>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>
  ): Observable<C>;
  /**
   * @internal
   */
  select<A = T, B = A, C = B, D = C>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>
  ): Observable<D>;
  /**
   * @internal
   */
  select<A = T, B = A, C = B, D = C, E = D>(
    op1: OperatorFunction<T, A>,
    op2: OperatorFunction<A, B>,
    op3: OperatorFunction<B, C>,
    op4: OperatorFunction<C, D>,
    op5: OperatorFunction<D, E>
  ): Observable<E>;
  /**
   * @description
   * Access a single property of the state by providing keys.
   * Returns a single property of the state as cached and distinct `Observable<T[K1]>`.
   *
   * @example
   * // Access a single property
   *
   * const bar$ = state.select('bar');
   *
   * // Access a nested property
   *
   * const foo$ = state.select('bar', 'foo');
   *
   * @return Observable<T[K1]>
   */
  select<K1 extends keyof T>(k1: K1): Observable<T[K1]>;
  /**
   * @internal
   */
  select<K1 extends keyof T, K2 extends keyof T[K1]>(
    k1: K1,
    k2: K2
  ): Observable<T[K1][K2]>;
  /**
   * @internal
   */
  select<K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2]>(k1: K1, k2: K2, k3: K3): Observable<T[K1][K2][K3]>;
  /**
   * @internal
   */
  select<K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    K4 extends keyof T[K1][K2][K3]>(k1: K1, k2: K2, k3: K3, k4: K4): Observable<T[K1][K2][K3][K4]>;
  /**
   * @internal
   */
  select<K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    K4 extends keyof T[K1][K2][K3],
    K5 extends keyof T[K1][K2][K3][K4]>(k1: K1, k2: K2, k3: K3, k4: K4, k5: K5): Observable<T[K1][K2][K3][K4][K5]>;
  /**
   * @internal
   */
  select<K1 extends keyof T,
    K2 extends keyof T[K1],
    K3 extends keyof T[K1][K2],
    K4 extends keyof T[K1][K2][K3],
    K5 extends keyof T[K1][K2][K3][K4],
    K6 extends keyof T[K1][K2][K3][K4][K5]>(
    k1: K1,
    k2: K2,
    k3: K3,
    k4: K4,
    k5: K5,
    k6: K6
  ): Observable<T[K1][K2][K3][K4][K5][K6]>;
  /**
   * @internal
   */
  select<R>(
    ...opOrMapFn: OperatorFunction<T, R>[] | string[]
  ): Observable<T | R> {
    if (!opOrMapFn || opOrMapFn.length === 0) {
      return this.accumulator.state$.pipe(stateful());
    } else if (isStringArrayGuard(opOrMapFn)) {
      return this.accumulator.state$.pipe(stateful(pluck(...opOrMapFn)));
    } else if (isOperateFnArrayGuard(opOrMapFn)) {
      return this.accumulator.state$.pipe(stateful(pipeFromArray(opOrMapFn)));
    }
    throw new Error('wrong params passed to select');
  }

  /**
   * @description
   * Manages side-effects of your state. Provide an `Observable<any>` **side-effect** and an optional
   * `sideEffectFunction`.
   * Subscription handling is done automatically.
   *
   * @example
   * // Directly pass an observable side-effect
   * const localStorageEffect$ = changes$.pipe(
   *  tap(changes => storeChanges(changes))
   * );
   * state.hold(localStorageEffect$);
   *
   * // Pass an additional `sideEffectFunction`
   *
   * const localStorageEffectFn = changes => storeChanges(changes);
   * state.hold(changes$, localStorageEffectFn);
   *
   * @param {Observable<S>} obsOrObsWithSideEffect
   * @param {function} [sideEffectFn]
   */
  hold<S>(
    obsOrObsWithSideEffect: Observable<S>,
    sideEffectFn?: (arg: S) => void
  ): void {
    const sideEffect = obsOrObsWithSideEffect.pipe(catchError(e => {
      console.error(e)
      return EMPTY
    }))
    if (typeof sideEffectFn === 'function') {
      this.effectObservable.nextEffectObservable(
        sideEffect.pipe(tap(sideEffectFn))
      );
      return;
    }
    this.effectObservable.nextEffectObservable(sideEffect);
  }

  /**
   * @internal
   */
  subscribe(): Unsubscribable {
    const subscription = new Subscription();
    subscription.add(this.accumulator.subscribe());
    subscription.add(this.effectObservable.subscribe());
    return subscription;
  }
}
