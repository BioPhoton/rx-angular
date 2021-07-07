import { ErrorHandler, Injector } from '@angular/core';
// tslint:disable-next-line:nx-enforce-module-boundaries
import { jestMatcher } from '@test-helpers';
import { fakeAsync, TestBed } from '@angular/core/testing';
import {
  createStateChecker,
  initialPrimitiveState,
  PrimitiveState,
} from './fixtures';
import { TestScheduler } from 'rxjs/testing';
// tslint:disable-next-line:nx-enforce-module-boundaries
import { RxState, select } from '@rx-angular/state';
import { map, pluck, switchMap, take, takeUntil } from 'rxjs/operators';
import { from, interval, of, Subject, throwError } from 'rxjs';
import {
  ɵsetCurrentInjector as setCurrentInjector
} from '@angular/core';

function setupState<T extends object>(cfg: { initialState?: T }) {
  const { initialState } = { ...cfg };
  const state = new RxState<T>();
  if (initialState) {
    state.set(initialState);
  }
  return state;
}

const stateChecker = createStateChecker((actual, expected) => {
  if (typeof expected === 'object') {
    expect(actual).toEqual(expected);
  } else {
    expect(actual).toBe(expected);
  }
});

let testScheduler: TestScheduler;

beforeEach(() => {
  testScheduler = new TestScheduler(jestMatcher);
});

describe('RxStateService', () => {
  let service: RxState<PrimitiveState>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = setupState({});
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should be hot on instantiation', () => {
    stateChecker.checkSubscriptions(service, 1);
  });

  it('should unsubscribe on ngOnDestroy call', () => {
    stateChecker.checkSubscriptions(service, 1);
    service.ngOnDestroy();
    stateChecker.checkSubscriptions(service, 0);
  });

  describe('State', () => {
    it('should create new instance', () => {
      const state = new RxState<PrimitiveState>();
      expect(state).toBeDefined();
    });
  });

  describe('$', () => {
    it('should return NO empty state after init when subscribing late', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = setupState({});
        expectObservable(state.$).toBe('');
      });
    });

    it('should return No changes when subscribing late', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = new RxState<PrimitiveState>();
        state.subscribe();

        state.set({ num: 42 });
        expectObservable(state.$.pipe(pluck('num'))).toBe('');
      });
    });

    it('should return new changes', () => {
      const state = new RxState<PrimitiveState>();
      state.subscribe();
      state.set({ num: 42 });
      const slice$ = state.$.pipe(select('num'));
      let i = -1;
      const valuesInOrder = ['', { num: 777 }];
      slice$.subscribe((next) => expect(next).toBe(valuesInOrder[++i]));
      state.set({ num: 777 });
    });
  });

  describe('stateful with select', () => {
    it('should return empty state after init when subscribing late', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = setupState({});
        expectObservable(state.select()).toBe('');
      });
    });

    it('should return changes when subscribing late', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = new RxState<PrimitiveState>();
        state.subscribe();

        state.set({ num: 42 });
        expectObservable(state.select('num')).toBe('n', { n: 42 });
      });
    });

    it('should return new changes', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = new RxState<PrimitiveState>();
        state.subscribe();
        state.set({ num: 42 });
        const slice$ = state.select('num');
        let i = -1;
        const valuesInOrder = [{ num: 42 }, { num: 777 }];
        slice$.subscribe((next) => expect(next).toBe(valuesInOrder[++i]));
        state.set({ num: 777 });
      });
    });
  });

  describe('get', () => {
    it('should return undefined as initial value', () => {
      const state = setupState({ initialState: undefined });
      const val = state.get();
      expect(val).toEqual(undefined);
    });

    it('should return undefined for an undefined property', () => {
      const state = setupState<{ num: number }>({ initialState: undefined });
      const val = state.get('num');
      expect(val).toEqual(undefined);
    });

    it('should return value when keys are provided as params', () => {
      const state = setupState({ initialState: initialPrimitiveState });
      const val = state.get('num');
      expect(val).toEqual(initialPrimitiveState.num);
    });

    it('should return whole state object when no keys provided', () => {
      const state = setupState({ initialState: initialPrimitiveState });
      const val = state.get();
      expect(val.num).toEqual(initialPrimitiveState.num);
    });
  });

  describe('select', () => {
    it('should return undefined as initial value', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = setupState({ initialState: undefined });
        expectObservable(state.select()).toBe('-');
      });
    });

    it('should return initial state', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = setupState({ initialState: initialPrimitiveState });
        expectObservable(state.select()).toBe('s', {
          s: initialPrimitiveState,
        });
      });
    });

    it('should throw with wrong params', () => {
      const state = setupState({ initialState: initialPrimitiveState });

      expect(() => state.select(true as any)).toThrowError(
        'wrong params passed to select'
      );
    });

    describe('slice by key', () => {
      it('should return empty state after init', () => {
        testScheduler.run(({ expectObservable }) => {
          const state = setupState({});
          expectObservable(state.select()).toBe('');
        });
      });

      it('should return initial state', () => {
        testScheduler.run(({ expectObservable }) => {
          const state = new RxState<PrimitiveState>();
          state.subscribe();

          state.set({ num: 42 });
          expectObservable(state.select('num')).toBe('s', { s: 42 });
        });
      });
    });

    describe('slice by map function', () => {
      it('should return nothing if empty', () => {
        testScheduler.run(({ expectObservable }) => {
          const state = setupState({});
          expectObservable(state.select()).toBe('');
        });
      });

      it('should return full state object on select', () => {
        testScheduler.run(({ expectObservable }) => {
          const state = setupState({ initialState: initialPrimitiveState });
          expectObservable(state.select()).toBe('s', {
            s: initialPrimitiveState,
          });
        });
      });

      it('should return slice on select with prop', () => {
        testScheduler.run(({ expectObservable }) => {
          const state = setupState({ initialState: initialPrimitiveState });
          expectObservable(state.select('num')).toBe('s', {
            s: initialPrimitiveState.num,
          });
        });
      });

      it('should return slice on select with operator', () => {
        testScheduler.run(({ expectObservable }) => {
          const state = setupState({ initialState: initialPrimitiveState });
          expectObservable(state.select(map((s) => s.num))).toBe('s', {
            s: initialPrimitiveState.num,
          });
        });
      });
    });
  });

  describe('set', () => {
    describe('with state partial', () => {
      it('should add new slices', () => {
        const state = setupState({});
        state.select().subscribe((s) => {
          throw Error('should never emit');
        });
        state.set(initialPrimitiveState);
        state.select().subscribe((s) => expect(s).toBe(initialPrimitiveState));
      });
      it('should override previous state slices', () => {
        const state = setupState({ initialState: initialPrimitiveState });
        state.select().subscribe((s) => {
          throw Error('should never emit');
        });
        state.set(initialPrimitiveState);
        state.select().subscribe((s) => expect(s).toBe(initialPrimitiveState));
        state.set({ num: 1 });
        state.select().subscribe((s) => expect(s).toBe({ num: 1 }));
      });

      it('should throw with wrong params', () => {
        const state = setupState({ initialState: initialPrimitiveState });

        expect(() =>
          state.set('wrong params passed to set' as any)
        ).toThrowError('wrong param');
      });
    });
    describe('with state project partial', () => {
      it('should add new slices', () => {
        const state = setupState({});
        state.select().subscribe((s) => {
          throw Error('should never emit');
        });
        state.set((s) => initialPrimitiveState);
        state.select().subscribe((s) => expect(s).toBe(initialPrimitiveState));
      });
      it('should override previous state slices', () => {
        const state = setupState({ initialState: initialPrimitiveState });
        state
          .select()
          .subscribe((s) => expect(state).toBe(initialPrimitiveState));
        state.set((s) => ({ num: s.num + 1 }));
        state.select().subscribe((s) => expect(state).toBe({ num: 43 }));
      });
    });
    describe('with state key and value partial', () => {
      it('should add new slices', () => {
        const state = setupState<PrimitiveState>({});
        state.select().subscribe((s) => {
          // throw Error('should never emit');
        });
        state.set('num', (s) => 1);
        state.select().subscribe((s) => expect(s).toBe(initialPrimitiveState));
      });
      it('should override previous state slices', () => {
        const state = setupState({ initialState: initialPrimitiveState });
        state.select().subscribe((s) => expect(s).toBe(initialPrimitiveState));
        state.set('num', (s) => s.num + 1);
        state.select().subscribe((s) => expect(s).toBe({ num: 43 }));
      });
    });
  });

  describe('connect', () => {
    it('should work with observables directly', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = setupState({ initialState: initialPrimitiveState });
        expectObservable(state.select('num')).toBe('(abc)', {
          a: 42,
          b: 43,
          c: 44,
        });

        state.connect(from([{ num: 42 }, { num: 43 }, { num: 44 }]));
      });
    });

    it('should work with prop name and observable', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = setupState({ initialState: initialPrimitiveState });
        expectObservable(state.select('num')).toBe('(abc)', {
          a: 42,
          b: 43,
          c: 44,
        });

        state.connect(
          'num',
          from([{ num: 42 }, { num: 43 }, { num: 44 }]).pipe(map((s) => s.num))
        );
      });
    });

    it('should work with observable and project', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = setupState({ initialState: initialPrimitiveState });
        expectObservable(state.select('num')).toBe('(abc)', {
          a: 42,
          b: 43,
          c: 44,
        });

        state.connect(
          from([{ num: 42 }, { num: 43 }, { num: 44 }]),
          (s, n) => ({ num: n.num })
        );
      });
    });

    it('should work with prop name and observable and reducer', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = setupState({ initialState: initialPrimitiveState });
        expectObservable(state.select('num')).toBe('(abc)', {
          a: 42,
          b: 43,
          c: 44,
        });

        state.connect(
          'num',
          from([{ num: 42 }, { num: 43 }, { num: 44 }]),
          (s, v) => v.num
        );
      });
    });

    it('should pass undefined for observable', () => {
      testScheduler.run(({ expectObservable }) => {
        const s: { num: number | undefined } = { num: 0 };
        const state = setupState({ initialState: s });

        expectObservable(state.$.pipe(map((st) => st.num))).toBe('(abc)', {
          a: undefined,
          b: 43,
          c: undefined,
        });

        state.connect(
          from([{ num: undefined }, { num: 43 }, { num: undefined }]),
          (o, n) => n
        );
      });
    });

    it('should pass undefined for projectFn', () => {
      testScheduler.run(({ expectObservable }) => {
        const s: { num: number | undefined } = { num: 0 };
        const state = setupState({ initialState: s });

        expectObservable(state.$.pipe(map((st) => st.num))).toBe('(abc)', {
          a: undefined,
          b: 43,
          c: undefined,
        });

        state.connect('num', from([undefined, 43, undefined]), (o, n) => n);
      });
    });

    it('should pass undefined for key observable', () => {
      testScheduler.run(({ expectObservable }) => {
        const s: { num: number | undefined } = { num: 0 };
        const state = setupState({ initialState: s });

        expectObservable(state.$.pipe(map((st) => st.num))).toBe('(abc)', {
          a: undefined,
          b: 43,
          c: undefined,
        });

        state.connect('num', from([undefined, 43, undefined]));
      });
    });

    it('should pass undefined for observable projectFn', () => {
      testScheduler.run(({ expectObservable }) => {
        const s: { num: number | undefined } = { num: 5 };
        const state = setupState({ initialState: s });

        expectObservable(state.$.pipe(map((st) => st.num))).toBe('(abc)', {
          a: undefined,
          b: 43,
          c: undefined,
        });

        state.connect(
          from([{ num: undefined }, { num: 43 }, { num: undefined }]),
          (sta, newVal) => newVal
        );
      });
    });

    it('should throw with wrong params', () => {
      const state = setupState({ initialState: initialPrimitiveState });

      expect(() => state.connect('some string' as any)).toThrowError(
        'wrong params passed to connect'
      );
    });

    it('should stop from connect observable', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = setupState({ initialState: initialPrimitiveState });
        const sub = state.subscribe();
        state.set(initialPrimitiveState);
        const tick$ = interval(100).pipe(map((num) => ({ num })));
        state.connect(tick$);
        sub.unsubscribe();
        expectObservable(state.select()).toBe('');
      });
    });

    it('should stop from connect key & observable', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = setupState({ initialState: initialPrimitiveState });
        const sub = state.subscribe();
        state.set(initialPrimitiveState);
        const tick$ = interval(100);
        state.connect('num', tick$);
        sub.unsubscribe();
        expectObservable(state.select()).toBe('');
      });
    });

    it('should stop from connect observable & projectFn', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = setupState({ initialState: initialPrimitiveState });
        const sub = state.subscribe();
        state.set(initialPrimitiveState);
        const tick$ = interval(100);
        state.connect(tick$, (s, v) => ({ num: s.num + v }));
        sub.unsubscribe();
        expectObservable(state.select()).toBe('');
      });
    });

    it('should stop from connect key & observable & projectFn', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = setupState({ initialState: initialPrimitiveState });
        const sub = state.subscribe();
        state.set(initialPrimitiveState);
        const tick$ = interval(100);
        state.connect('num', tick$, (s, v) => s.num + v);
        sub.unsubscribe();
        expectObservable(state.select()).toBe('');
      });
    });

    it('should stop in selects with HOOs', () => {
      testScheduler.run(({ expectObservable }) => {
        const state = setupState({ initialState: initialPrimitiveState });
        const sub = state.subscribe();
        state.set(initialPrimitiveState);
        expectObservable(
          state.select(
            switchMap(() =>
              interval(100).pipe(
                map((num) => ({ num })),
                take(3)
              )
            )
          )
        ).toBe('');
        sub.unsubscribe();
      });
    });
  });

  describe('setAccumulator', () => {
    it('should work before a value was emitted', () => {
      let numAccCalls = 0;
      const customAcc = <T>(s: T, sl: Partial<T>) => {
        ++numAccCalls;
        return {
          ...s,
          ...sl,
        };
      };
      const state = setupState({ initialState: initialPrimitiveState });
      testScheduler.run(({ expectObservable }) => {
        expectObservable(state.select('num')).toBe('(abc)', {
          a: 42,
          b: 43,
          c: 44,
        });

        state.setAccumulator(customAcc);
        state.set({ num: 42 });
        state.set({ num: 43 });
        state.set({ num: 44 });
      });

      expect(numAccCalls).toBe(3);
    });

    it('should work in between emissions', () => {
      let numAcc1Calls = 0;
      const customAcc1 = <T>(s: T, sl: Partial<T>) => {
        ++numAcc1Calls;
        return {
          ...s,
          ...sl,
        };
      };
      let numAcc2Calls = 0;
      const customAcc2 = <T>(s: T, sl: Partial<T>) => {
        ++numAcc2Calls;
        return {
          ...s,
          ...sl,
        };
      };
      const state = setupState({ initialState: initialPrimitiveState });
      testScheduler.run(({ expectObservable }) => {
        expectObservable(state.select('num')).toBe('(abc)', {
          a: 42,
          b: 43,
          c: 44,
        });

        state.set({ num: 42 });
        state.setAccumulator(customAcc1);
        state.set({ num: 43 });
        state.setAccumulator(customAcc2);
        state.set({ num: 44 });
      });

      expect(numAcc1Calls).toBe(1);
      expect(numAcc2Calls).toBe(1);
    });
  });

  describe('hold', () => {
    it('should work with effect-observable', () => {
      testScheduler.run(({ cold, expectSubscriptions }) => {
        const state = setupState({ initialState: initialPrimitiveState });

        const test$ = cold('(abc)', { a: 1, b: 2, c: 3 });
        const sub = '(^!)';
        const stop = new Subject();
        state.hold(test$.pipe(takeUntil(stop)));
        stop.next(1);
        expectSubscriptions(test$.subscriptions).toBe(sub);
      });
    });

    it('should work with observable and effect', fakeAsync(() => {
      let calls = 0;
      const effect = (v: number) => {
        calls = calls + 1;
      };
      const state = setupState({ initialState: initialPrimitiveState });
      state.hold(of(1, 2, 3), effect);
      expect(calls).toBe(3);
    }));

    it('should invoke provided ErrorHandler', fakeAsync(() => {
      const state = setupState({ initialState: initialPrimitiveState });
      const customErrorHandler: ErrorHandler = {
        handleError: jest.fn()
      };
      TestBed.overrideProvider(ErrorHandler, { useValue: customErrorHandler });
      setCurrentInjector(TestBed.inject(Injector));
      state.hold(throwError(new Error('something went wrong')));
      expect(customErrorHandler.handleError).toHaveBeenCalledWith(
        new Error('something went wrong')
      );
    }));
  });
});
