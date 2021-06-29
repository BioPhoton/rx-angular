import { TestScheduler } from 'rxjs/testing';
import { toHook, untilDestroyed, DestroyProp, OnDestroy$ } from '../../src/lib/life-cycle-hooks';
import { EMPTY, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { jestMatcher } from '@test-helpers';

let testScheduler: TestScheduler;

// tslint:disable: max-classes-per-file

const destroySlice: DestroyProp = { destroy: true };
const falsyValue = { wrong: 'wrong' } as unknown;


describe('lifecycle-hooks/utils/toHook', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler(jestMatcher);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should pass only values of destroy property', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const values = { a: falsyValue as DestroyProp, b: destroySlice };
      const source = cold('ab|', values);
      expectObservable(source.pipe(toHook('destroy'))).toBe('-(b|)', { b: true });
    });
  });

  it('should pass only one values of destroy property', () => {
    testScheduler.run(({ cold, expectObservable }) => {
      const values = { a: destroySlice, b: destroySlice };
      const source = cold('ab|', values);
      expectObservable(source.pipe(toHook('destroy'))).toBe('(a|)', { a: true });
    });
  });

});

describe('lifecycle-hooks/utils/untilDestroyed', () => {
  beforeEach(() => {
    testScheduler = new TestScheduler(jestMatcher);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should take values until onDestroy$ emits', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('--a--b--c--d--e--f--g--|');
      const e1subs = '^------------!';
      const e2 = hot('-------------z--|');
      const e2subs = '^------------!';
      const expected = '--a--b--c--d-|';

      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;

      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should take values and raises error when onDestroy$ raises error', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('--a--b--c--d--e--f--g--|');
      const e1subs = '^------------!          ';
      const e2 = hot('-------------#          ');
      const e2subs = '^------------!          ';
      const expected = '--a--b--c--d-#          ';

      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;

      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should take all values when onDestroy$ is empty', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('--a--b--c--d--e--f--g--|');
      const e1subs = '^----------------------!';
      const e2 = hot('-------------|          ');
      const e2subs = '^------------!          ';
      const expected = '--a--b--c--d--e--f--g--|';

      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;

      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should take all values when onDestroy$ does not complete', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('--a--b--c--d--e--f--g--|');
      const e1subs = '^----------------------!';
      const e2 = hot('-');
      const e2subs = '^----------------------!';
      const expected = '--a--b--c--d--e--f--g--|';

      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;

      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should complete without subscribing to the source when onDestroy$ synchronously emits', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('----a--|');
      const e2 = of(1, 2, 3);
      const expected = '(|)     ';
      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;

      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe([]);
    });
  });

  it('should subscribe to the source when onDestroy$ synchronously completes without emitting', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('----a--|');
      const e1subs = '^------!';
      const e2 = EMPTY;
      const expected = '----a--|';
      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;
      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should allow unsubscribing explicitly and early', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('--a--b--c--d--e--f--g--|');
      const e1subs = '^------!                ';
      const e2 = hot('-------------z--|       ');
      const e2subs = '^------!                ';
      const unsub = '-------!                ';
      const expected = '--a--b--                ';
      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;
      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle)), unsub).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should complete when onDestroy$ emits if source observable does not complete', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('-');
      const e1subs = '^-!';
      const e2 = hot('--a--b--|');
      const e2subs = '^-!';
      const expected = '--|';

      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;

      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should raise error when onDestroy$ raises error if source observable does not complete', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('-');
      const e1subs = '^-!';
      const e2 = hot('--#');
      const e2subs = '^-!';
      const expected = '--#';
      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;

      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should not complete when onDestroy$ is empty if source observable does not complete', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('-');
      const e1subs = '^';
      const e2 = hot('--|');
      const e2subs = '^-!';
      const expected = '---';

      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;

      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should not complete when source and onDestroy$ do not complete', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('-');
      const e1subs = '^';
      const e2 = hot('-');
      const e2subs = '^';
      const expected = '-';
      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;
      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should complete when onDestroy$ emits before source observable emits', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('----a--|');
      const e1subs = '^-!     ';
      const e2 = hot('--x     ');
      const e2subs = '^-!     ';
      const expected = '--|     ';
      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;
      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should raise error if source raises error before onDestroy$ emits', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('--a--b--c--d--#     ');
      const e1subs = '^-------------!     ';
      const e2 = hot('----------------a--|');
      const e2subs = '^-------------!     ';
      const expected = '--a--b--c--d--#     ';
      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;
      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should raise error immediately if source throws', () => {
    testScheduler.run(({ hot, cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold('#');
      const e1subs = '(^!)';
      const e2 = hot('--x');
      const e2subs = '(^!)';
      const expected = '#';
      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;
      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should dispose source observable if onDestroy$ emits before source emits', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('---a---|');
      const e1subs = '^-!     ';
      const e2 = hot('--x-|   ');
      const e2subs = '^-!     ';
      const expected = '--|     ';
      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;
      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should dispose onDestroy$ if source observable completes', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('--a--|     ');
      const e1subs = '^----!     ';
      const e2 = hot('-------x--|');
      const e2subs = '^----!     ';
      const expected = '--a--|     ';
      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;
      expectObservable(e1.pipe(untilDestroyed(instanceWithLifecycle))).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

  it('should not break unsubscription chain when unsubscribed explicitly', () => {
    testScheduler.run(({ hot, expectObservable, expectSubscriptions }) => {
      const e1 = hot('--a--b--c--d--e--f--g--|');
      const e1subs = '^------!                ';
      const e2 = hot('-------------z--|       ');
      const e2subs = '^------!                ';
      const unsub = '-------!                ';
      const expected = '--a--b--                ';
      const instanceWithLifecycle = {
        onDestroy$: e2
      } as unknown as OnDestroy$;
      const result = e1.pipe(
        mergeMap((x: string) => of(x)),
        untilDestroyed(instanceWithLifecycle),
        mergeMap((x: string) => of(x))
      );

      expectObservable(result, unsub).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
      expectSubscriptions(e2.subscriptions).toBe(e2subs);
    });
  });

});
