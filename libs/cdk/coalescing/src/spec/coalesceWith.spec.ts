import { TestScheduler } from 'rxjs/internal/testing/TestScheduler';
import { mergeMapTo, share, tap } from 'rxjs/operators';
import { asapScheduler, concat, defer, from, Observable, of, timer } from 'rxjs';
// tslint:disable-next-line:nx-enforce-module-boundaries
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { jestMatcher, mockConsole } from '@test-helpers';
import { coalesceWith } from '@rx-angular/cdk/coalescing';


/** @test {coalesceWith} */
describe('coalesce operator additional logic', () => {
  beforeAll(() => mockConsole());

  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler(jestMatcher);
  });

  it('should handle boolean values', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = { a: false };
      const s1 = cold('---a---------|', values);
      const s1Subs = '^------------!';
      const n1 = cold('   ------a|  ');
      const n1Subs = ['---^-----!'];
      const exp = '---------a---|';
      const result = s1.pipe(coalesceWith(n1));
      expectObservable(result).toBe(exp, values);
      expectSubscriptions(s1.subscriptions).toBe(s1Subs);
      expectSubscriptions(n1.subscriptions).toBe(n1Subs);
    });
  });

  it('should emit last value if source completes before durationSelector', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const s1 = cold('---abcdef---|');
      const s1Subs =  '^-----------!';
      const n1 = cold('   ----------');
      const n1Subs = ['---^--------!'];
      const exp =     '------------(f|)';

      const result = s1.pipe(coalesceWith(n1));
      expectObservable(result).toBe(exp);
      expectSubscriptions(s1.subscriptions).toBe(s1Subs);
      expectSubscriptions(n1.subscriptions).toBe(n1Subs);
    });
  });

  describe('with default config', () => {
    it('should emit last for async values when durationSelector is EMPTY', () => {
      testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
        const s1 = cold('---abcdef---|');
        const s1Subs = '^-----------!';
        const n1 = cold('   -----x|    ');
        const n1Subs = ['---^----!    '];
        const exp = '--------f---|';

        const result = s1.pipe(coalesceWith(n1));
        expectObservable(result).toBe(exp);
        expectSubscriptions(s1.subscriptions).toBe(s1Subs);
        expectSubscriptions(n1.subscriptions).toBe(n1Subs);
      });
    });

    it('should emit last delayed for sync values when durationSelector is longer', () => {
      testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
        const s1 = cold('--(abcdef)--|');
        const s1Subs = '^-----------!';
        const n1 = cold('  --------|  ');
        const n1Subs = ['--^-------!  '];
        const exp = '----------f-|';

        const result = s1.pipe(coalesceWith(n1));
        expectObservable(result).toBe(exp);
        expectSubscriptions(s1.subscriptions).toBe(s1Subs);
        expectSubscriptions(n1.subscriptions).toBe(n1Subs);
      });
    });

    it('should emit last for sync values when durationSelector is EMPTY', () => {
      testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
        const s1 = cold('(abcdef)|');
        const s1Subs = '^-------!';
        const n1 = cold('|        ');
        const n1Subs = ['(^!)     '];
        const exp = '(f)-----|';

        const result = s1.pipe(coalesceWith(n1));
        expectObservable(result).toBe(exp);
        expectSubscriptions(s1.subscriptions).toBe(s1Subs);
        expectSubscriptions(n1.subscriptions).toBe(n1Subs);
      });
    });

    it('should emit last for sync values when durationSelector is a Promise', () => {
      testScheduler.run(({ cold, expectObservable }) => {
        const durationSelector = from(Promise.resolve());
        const s1 = cold('(abcdef)|');
        const exp = '--------(f|)';

        const result = s1.pipe(coalesceWith(durationSelector));
        expectObservable(result).toBe(exp);
      });
    });

    it('should emit coalesce sync values', () => {
      // Test case inspired by https://github.com/cartant/rxjs-etc/blob/main/source/operators/debounceSync-spec.ts
      testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
        const durationSelector = new Observable(subscriber => {
          asapScheduler.schedule(() => {
            subscriber.next();
          });
        });
        const source = cold('   (ab)-(cd)---(ef)----|');
        const sourceSubs = '      ^-------------------!';
        const expected = ' b----d------f-------|';

        const result = source.pipe(coalesceWith(durationSelector));
        expectObservable(result).toBe(expected);
        expectSubscriptions(source.subscriptions).toBe(sourceSubs);
      });
    });

    it('should emit last for multiple sync values when durationSelector is a Promise', () => {
      const durationSelector = of();
      const e1 = concat(
        of(1, 2, 3),
        timer(10).pipe(mergeMapTo(of(4, 5, 6))),
        timer(10).pipe(mergeMapTo(of(7, 8, 9))),
        timer(50).pipe(mergeMapTo(of(10, 11, 12)))
      );
      const expected = [3, 6, 9, 12];
      e1.pipe(coalesceWith(durationSelector)).subscribe(
        (x: number) => {
          expect(x).toEqual(expected.shift());
        },
        () => {
          throw new Error('should not be called');
        },
        () => {
          expect(expected.length).toEqual(0);
        }
      );
    });
  });

  describe('with scoping', () => {
    it('should not mutate the passed context (internal WeakMap)', () => {
      const scope = {};

      testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
        const s1 = cold('---a---------');
        const s1Subs = '^------------';
        const n1 = cold('   -----|    ');
        const n1Subs = '---^----!    ';
        const exp1 = '--------a----';

        const result1 = s1.pipe(coalesceWith(n1, scope));
        expectObservable(result1).toBe(exp1);
        expectSubscriptions(s1.subscriptions).toBe(s1Subs);
        expectSubscriptions(n1.subscriptions).toBe(n1Subs);
      });
      expect(Reflect.ownKeys(scope).length).toBe(0);
    });

    it('should emit per subscriber by default async', () => {
      testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
        const s1 = cold('---abcdef---|');
        const s1Subs = ['^-----------!', '^-----------!'];
        const n1 = cold('   -----|    ');
        const n1Subs = ['---^----!    ', '---^----!    '];
        const exp1 = '--------f---|';
        const exp2 = '--------f---|';

        const result1 = s1.pipe(coalesceWith(n1));
        const result2 = s1.pipe(coalesceWith(n1));
        expectObservable(result1).toBe(exp1);
        expectObservable(result2).toBe(exp2);
        expectSubscriptions(s1.subscriptions).toBe(s1Subs);
        expectSubscriptions(n1.subscriptions).toBe(n1Subs);
      });
    });

    it('should emit per subscriber by default sync', () => {
      testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
        const s1 = cold('--(abcdef)--|');
        const s1Subs = ['^-----------!',
          '^-----------!'];
        const n1 = cold('(|)   ');
        const n1Subs = ['--(^!)   ',
          '--(^!)   '];
        const exp1 = '--(f)-------|';
        const exp2 = '--(f)-------|';

        const result1 = s1.pipe(coalesceWith(n1));
        const result2 = s1.pipe(coalesceWith(n1));
        expectObservable(result1).toBe(exp1);
        expectObservable(result2).toBe(exp2);
        expectSubscriptions(s1.subscriptions).toBe(s1Subs);
        expectSubscriptions(n1.subscriptions).toBe(n1Subs);
      });
    });

    it('should emit only once per scope async', () => {
      testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
        const scope = {};

        const s1 = cold('---abcdef---|');
        const s1Subs = ['^-----------!', '^-----------!'];
        const n1 = cold('   -----|    ');

        const exp1 = '------------|';
        const exp2 = '--------f---|';

        const result1 = s1.pipe(coalesceWith(n1, scope));
        const result2 = s1.pipe(coalesceWith(n1, scope));
        expectObservable(result1).toBe(exp1);
        expectObservable(result2).toBe(exp2);
        expectSubscriptions(s1.subscriptions).toBe(s1Subs);
      });
    });

    it('should emit only once per scope sync', () => {
      testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
        const scope = {};

        const s1 = cold('---(abcdef)---|');
        const s1Subs = ['^-------------!', '^-------------!'];
        const d1 = cold('   (|)         ');
        const exp1 = '--------------|';
        const exp2 = '---f----------|';
        const result1 = s1.pipe(coalesceWith(d1, scope));
        const result2 = s1.pipe(coalesceWith(d1, scope));
        expectObservable(result1).toBe(exp1);
        expectObservable(result2).toBe(exp2);
        expectSubscriptions(s1.subscriptions).toBe(s1Subs);
      });
    });

    describe('with different durationSelector', () => {
      it('should emit once per micro task (THEORY)', () => {
        let syncEmission1: any;
        emit(undefined, 'promise1');
        expect(syncEmission1).not.toBeDefined();
        emit('promise1', 'promise2');
        expect(syncEmission1).not.toBeDefined();
        setTimeout(() => {
          expect(syncEmission1).toBe('promise2');
        });

        //

        function emit(prev: any, next: any): any {
          Promise.resolve().then(() => {
            expect(syncEmission1).toBe(prev);
            syncEmission1 = next;
          });
        }
      });

      it('should emit once per micro task', () => {
        testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
          const scope = {};
          testScheduler.run(() => {
            let syncEmission1: any;

            const arrNum = [1, 2, 3, 4];
            const arrAlph = ['a', 'b', 'c', 'd'];
            const num$ = from(arrNum).pipe(
              share(),
              coalesceWith(defer(() => from([1])), scope)
            );
            const alph$ = from(arrAlph).pipe(
              share(),
              coalesceWith(defer(() => from([1])), scope)
            );

            expect(syncEmission1).not.toBeDefined();
            num$.subscribe(
              (x: number) => {
                syncEmission1 = x;
                // if(syncEmission1 !== 4) {
                throw new Error('should be called one');
                // }
              },
              () => {
                throw new Error('should not be called');
              },
              () => {
                expect(syncEmission1).not.toBeDefined();
              }
            );

            alph$.subscribe(
              (x: string) => {
                syncEmission1 = x;
                if (syncEmission1 !== 'd') {
                  throw new Error('should not be called');
                }
              },
              () => {
                throw new Error('should not be called');
              },
              () => {
                expect(syncEmission1).toBe('d');
              }
            );
          });
        });
      });

      // different durationSelectors (NOT RECOMMENDED!)
      it('should emit after the second durationSelectors completion if sync', () => {
        testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
          const scope = {};

          const s1 = cold('---(abcdef)-|');
          const s1Subs = ['^-----------!', '^-----------!'];
          const d1 = cold('   ---|      ');
          const d2 = cold('   ------|  ');
          const exp1 = '------------|';
          const exp2 = '---------f--|';

          const result1 = s1.pipe(coalesceWith(d1, scope));
          const result2 = s1.pipe(coalesceWith(d2, scope));
          expectObservable(result1).toBe(exp1);
          expectObservable(result2).toBe(exp2);
          expectSubscriptions(s1.subscriptions).toBe(s1Subs);
        });
      });

      it('should interfere with other durationSelectors if async (THIS IS BAD)', () => {
        testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
          const scope = {};

          const s1 = cold('----abcdef--|');
          const s1Subs = ['^-----------!', '^-----------!'];
          const d1 = cold('    ---|     ');
          const d1Subs = ['----^--!     ', '--------^--! '];
          const d2 = cold('    -----|   ');
          const d2Subs = ['----^----!   '];
          const exp1 = '-----------f|';
          const exp2 = '------------|';

          const result1 = s1.pipe(coalesceWith(d1, scope));
          const result2 = s1.pipe(coalesceWith(d2, scope));
          expectObservable(result1).toBe(exp1);
          expectObservable(result2).toBe(exp2);
          expectSubscriptions(s1.subscriptions).toBe(s1Subs);
          expectSubscriptions(d1.subscriptions).toBe(d1Subs);
          expectSubscriptions(d2.subscriptions).toBe(d2Subs);
        });
      });
    });
  });

  describe('error handling', () => {
    it('should forward errors', (() => {
      testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
        const s1 = cold('---a--#------');
        const s1Subs = '^-----!      ';
        const n1 = cold('   -----|    ');
        const n1Subs = '---^--!      ';
        const exp1 = '------#------';

        const result1 = s1.pipe(coalesceWith(n1));
        expectObservable(result1).toBe(exp1);
        expectSubscriptions(s1.subscriptions).toBe(s1Subs);
        expectSubscriptions(n1.subscriptions).toBe(n1Subs);
      });
    }));
  });
});
