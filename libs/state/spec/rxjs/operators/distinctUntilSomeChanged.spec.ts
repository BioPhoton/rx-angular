// tslint:disable-next-line:nx-enforce-module-boundaries
import { jestMatcher } from '@test-helpers';
import { mergeMap } from 'rxjs/operators';
import { KeyCompareMap } from '@rx-angular/state/internals';
import { distinctUntilSomeChanged } from '../../../src/lib/rxjs/operators';
import { Observable, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';

let testScheduler: TestScheduler;

interface DistinctUntilSomeChangedTestObj {
  foo?: string;
  bar?: number;
}

interface DistinctUntilSomeChangedTest {
  val?: number;
  objVal?: DistinctUntilSomeChangedTestObj;
}

beforeEach(() => {
  testScheduler = new TestScheduler(jestMatcher);
});


/** @test {distinctUntilSomeChanged} */
describe('distinctUntilSomeChanged operator', () => {
  it('should distinguish between values', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = { a: { val: 1 }, b: { val: 2 } };
      const e1 = cold('--a--a--a--b--b--a--|', values);
      const e1subs = '^-------------------!';
      const expected = '--a--------b-----a--|';

      expectObservable(
        e1.pipe(
          distinctUntilSomeChanged(['val'])
        )
      ).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should distinguish between values with multiple keys', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = { a: { val: 1 }, b: { val: 1, valOther: 3 } };
      const e1 = cold('--a--a--a--b--b--a--|', values);
      const e1subs = '^-------------------!';
      const expected = '--a--------b-----a--|';

      expectObservable(
        e1.pipe(
          distinctUntilSomeChanged(['val', 'valOther'])
        )
      ).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should ignore changes of other keys', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = { a: { val: 1 }, b: { val: 1, valOther: 3 } };
      const e1 = cold('--a--a--a--b--b--a--|', values);
      const e1subs = '^-------------------!';
      const expected = '--a-----------------|';

      expectObservable(
        e1.pipe(
          distinctUntilSomeChanged(['val'])
        )
      ).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should distinguish between values by keyCompareMap', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = {
        a: { val: 1 },
        b: { val: 2 },
        c: {
          val: 2,
          objVal: {
            foo: 'foo',
            bar: 0
          }
        },
        d: {
          val: 2,
          objVal: {
            foo: 'foo2',
            bar: 0
          }
        },
        e: {
          val: 2,
          objVal: {
            foo: 'foo2',
            bar: 3
          }
        }
      };
      const e1 = cold('--a--a--b--c--d--e--|', values);
      const e1subs = '^-------------------!';
      const expected = '--a-----b--c--d-----|';
      const keyCompare: KeyCompareMap<DistinctUntilSomeChangedTest> = {
        val: undefined,
        objVal: (oldVal, newVal) => oldVal?.foo === newVal?.foo
      };

      expectObservable(
        e1.pipe(
          distinctUntilSomeChanged(['val', 'objVal'], keyCompare)
        )
      ).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should distinguish between values and does not completes', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = { a: { val: 1 }, b: { val: 2 } };
      const e1 = cold('--a--a--a--b--b--a-', values);
      const e1subs = '^------------------';
      const expected = '--a--------b-----a-';

      expectObservable(
        e1.pipe(
          distinctUntilSomeChanged(['val'])
        )
      ).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should distinguish between values with key', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = {
        a: { val: 1 },
        b: { valOther: 1 },
        c: { valOther: 3 },
        d: { val: 1 },
        e: { val: 5 }
      };
      const e1 = cold('--a--b--c--d--e--|', values);
      const e1subs = '^----------------!';
      const expected = '--a--b-----d--e--|';

      expectObservable(
        e1.pipe(
          distinctUntilSomeChanged(['val'])
        )
      ).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should not compare if source does not have element with key', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = {
        a: { valOther: 1 },
        b: { valOther: 1 },
        c: { valOther: 3 },
        d: { valOther: 1 },
        e: { valOther: 5 }
      };
      const e1 = cold('--a--b--c--d--e--|', values);
      const e1subs = '^----------------!';
      const expected = '--a--------------|';

      expectObservable(
        e1.pipe(
          distinctUntilSomeChanged(['val'])
        )
      ).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should not completes if source never completes', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold('-');
      const e1subs = '^';
      const expected = '-';

      expectObservable(
        (<Observable<any>>e1).pipe(distinctUntilSomeChanged(['val']))
      ).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should not completes if source does not completes', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold('-');
      const e1subs = '^';
      const expected = '-';

      expectObservable(
        (<Observable<any>>e1).pipe(distinctUntilSomeChanged(['val']))
      ).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should complete if source is empty', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold('|');
      const e1subs = '(^!)';
      const expected = '|';

      expectObservable(
        (<Observable<any>>e1).pipe(distinctUntilSomeChanged(['val']))
      ).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should complete if source does not emit', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold('------|');
      const e1subs = '^-----!';
      const expected = '------|';

      expectObservable(
        (<Observable<any>>e1).pipe(distinctUntilSomeChanged(['val']))
      ).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should emit if source emits single element only', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = { a: { val: 1 } };
      const e1 = cold('--a--|', values);
      const e1subs = '^----!';
      const expected = '--a--|';

      expectObservable(
        e1.pipe(
          distinctUntilSomeChanged(['val'])
        )
      ).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should emit if source is scalar', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = { a: { val: 1 } };
      const e1 = of(values.a);
      const expected = '(a|)';

      expectObservable(
        e1.pipe(
          distinctUntilSomeChanged(['val'])
        )
      ).toBe(expected, values);
    });
  });

  it('should raises error if source raises error', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = { a: { val: 1 } };
      const e1 = cold('--a--a--#', values);
      const e1subs = '^-------!';
      const expected = '--a-----#';

      expectObservable(
        e1.pipe(
          distinctUntilSomeChanged(['val'])
        )
      ).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should raises error if source throws', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const e1 = cold('#');
      const e1subs = '(^!)';
      const expected = '#';

      expectObservable(
        (<Observable<any>>e1).pipe(distinctUntilSomeChanged(['val']))
      ).toBe(expected);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should not omit if source elements are all different', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = {
        a: { val: 1 },
        b: { val: 2 },
        c: { val: 3 },
        d: { val: 4 },
        e: { val: 5 }
      };
      const e1 = cold('--a--b--c--d--e--|', values);
      const e1subs = '^----------------!';
      const expected = '--a--b--c--d--e--|';

      expectObservable(
        e1.pipe(
          distinctUntilSomeChanged(['val'])
        )
      ).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should allow unsubscribing early and explicitly', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = {
        a: { val: 1 },
        b: { val: 2 },
        c: { val: 3 },
        d: { val: 4 },
        e: { val: 5 }
      };
      const e1 = cold('--a--b--b--d--a--e--|', values);
      const e1subs = '^---------!          ';
      const expected = '--a--b-----          ';
      const unsub = '----------!          ';

      const result = e1.pipe(
        distinctUntilSomeChanged(['val'])
      );

      expectObservable(result, unsub).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should not break unsubscription chains when unsubscribed explicitly', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = {
        a: { val: 1 },
        b: { val: 2 },
        c: { val: 3 },
        d: { val: 4 },
        e: { val: 5 }
      };
      const e1 = cold('--a--b--b--d--a--e--|', values);
      const e1subs = '^---------!          ';
      const expected = '--a--b-----          ';
      const unsub = '----------!          ';

      const result = e1.pipe(
        mergeMap((x: any) => of(x)),
        distinctUntilSomeChanged(['val']),
        mergeMap((x: any) => of(x))
      );

      expectObservable(result, unsub).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should emit once if source elements are all same', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = { a: { val: 1 } };
      const e1 = cold('--a--a--a--a--a--a--|', values);
      const e1subs = '^-------------------!';
      const expected = '--a-----------------|';

      expectObservable(
        e1.pipe(
          distinctUntilSomeChanged(['val'])
        )
      ).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should emit once if comparer returns true always regardless of source emits', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = {
        a: { val: 1 },
        b: { val: 2 },
        c: { val: 3 },
        d: { val: 4 },
        e: { val: 5 }
      };
      const e1 = cold('--a--b--c--d--e--|', values);
      const e1subs = '^----------------!';
      const expected = '--a--------------|';

      expectObservable(
        e1.pipe(distinctUntilSomeChanged(['val'], { val: () => true }))
      ).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should emit all if comparer returns false always regardless of source emits', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = { a: { val: 1 } };
      const e1 = cold('--a--a--a--a--a--a--|', values);
      const e1subs = '^-------------------!';
      const expected = '--a--a--a--a--a--a--|';

      expectObservable(
        e1.pipe(distinctUntilSomeChanged(['val'], { val: () => false }))
      ).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should distinguish values by selector', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = {
        a: { val: 1 },
        b: { val: 2 },
        c: { val: 3 },
        d: { val: 4 },
        e: { val: 5 }
      };
      const e1 = cold('--a--b--c--d--e--|', values);
      const e1subs = '^----------------!';
      const expected = '--a-----c-----e--|';
      const selector = (x: number, y: number) => y % 2 === 0;

      expectObservable(
        e1.pipe(distinctUntilSomeChanged(['val'], { val: selector }))
      ).toBe(expected, values);
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });

  it('should raises error when comparer throws', () => {
    testScheduler.run(({ cold, expectObservable, expectSubscriptions }) => {
      const values = {
        a: { val: 1 },
        b: { val: 2 },
        c: { val: 3 },
        d: { val: 4 },
        e: { val: 5 }
      };
      const e1 = cold('--a--b--c--d--e--|', values);
      const e1subs = '^----------!      ';
      const expected = '--a--b--c--#      ';
      const selector = (x: number, y: number) => {
        if (y === 4) {
          throw new Error('error');
        }
        return x === y;
      };

      expectObservable(
        e1.pipe(distinctUntilSomeChanged(['val'], { val: selector }))
      ).toBe(expected, values, new Error('error'));
      expectSubscriptions(e1.subscriptions).toBe(e1subs);
    });
  });
});

describe('distinctUntilSomeChanged edge cases', () => {

  it('should handle the defined edge cases', () => {
    const testSet = [
      {
        name: 'case {str} => undefined',
        inputMarble: '--a--a--a--b--b--a--|',
        inputValues: { a: { str: 'test' }, b: undefined },
        expectedMarble: '--a--------b-----a--|',
        expectValues: { a: { str: 'test' }, b: undefined }
      },
      {
        name: 'case {str} => null',
        inputMarble: '--a--a--a--b--b--a--|',
        inputValues: { a: { str: 'test' }, b: null },
        expectedMarble: '--a--------b-----a--|',
        expectValues: { a: { str: 'test' }, b: null }
      },
      {
        name: 'case  null => undefined',
        inputMarble: '--a--a--a--b--b--a--|',
        inputValues: { a: null, b: undefined },
        expectedMarble: '--a--------b-----a--|',
        expectValues: { a: null, b: undefined }
      },
      {
        name: 'case  undefined => null',
        inputMarble: '--a--a--a--b--b--a--|',
        inputValues: { a: undefined, b: null },
        expectedMarble: '--a--------b-----a--|',
        expectValues: { a: undefined, b: null }
      },
      {
        name: 'case  {str} => {undefined}',
        inputMarble: '--a--a--a--b--b--a--|',
        inputValues: { a: { str: 'test' }, b: { str: undefined } },
        expectedMarble: '--a--------b-----a--|',
        expectValues: { a: { str: 'test' }, b: { str: undefined } }
      },
      {
        name: 'case {str} => {null}',
        inputMarble: '--a--a--a--b--b--a--|',
        inputValues: { a: { str: 'test' }, b: { str: null } },
        expectedMarble: '--a--------b-----a--|',
        expectValues: { a: { str: 'test' }, b: { str: null } }
      },
      {
        name: 'case {null} => {undefined}',
        inputMarble: '--a--a--a--b--b--a--|',
        inputValues: { a: { str: null }, b: { str: undefined } },
        expectedMarble: '--a--------b-----a--|',
        expectValues: { a: { str: null }, b: { str: undefined } }
      },
      {
        name: 'case {undefined} => {null}',
        inputMarble: '--a--a--a--b--b--a--|',
        inputValues: { a: { str: undefined }, b: { str: null } },
        expectedMarble: '--a--------b-----a--|',
        expectValues: { a: { str: undefined }, b: { str: null } }
      }
    ];

    testScheduler.run(({ cold, expectObservable }) => {
      testSet.forEach((test) => {
        const e1 = cold(test.inputMarble, test.inputValues as any);
        const expected = test.expectedMarble;

        /*
        // to figure out which test case failed :D
        if(test.name === testCaseNameAsStringHere) {
        console.log('test', test);
        }
        */
        expectObservable(
          e1.pipe(
            distinctUntilSomeChanged(['str'])
          )
        ).toBe(expected, test.expectValues);

      });
    });
  });

});
