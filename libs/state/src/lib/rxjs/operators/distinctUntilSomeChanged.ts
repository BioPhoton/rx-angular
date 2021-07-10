import { MonoTypeOperatorFunction } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import {
  CompareFn,
  KeyCompareMap,
  safePluck,
} from '@rx-angular/state/internals';

/**
 * @internal
 */
function defaultCompare<T>(oldVal: T, newVal: T): boolean {
  return oldVal === newVal;
}

/**
 * @description
 *
 * Returns an Observable that emits all items emitted by the source Observable that are distinct by comparison from
 * the previous item. Comparison will be done for each set key in the `keys` array.
 *
 * You can fine grain your distinct checks by providing a `KeyCompareMap` with those keys you want to compute
 * explicitly different
 *
 * The name `distinctUntilSomeChanged` was picked since it internally iterates over the `keys` and utilizes the
 * [some](https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Array/some) method in order to
 * compute if values are distinct or not.
 *
 * @example
 *
 * import { of } from 'rxjs';
 * import { distinctUntilSomeChanged } from 'rx-angular/state';
 *
 * interface Person {
 *    age: number;
 *    name: string;
 * }
 *
 * of(
 *   { age: 4, name: 'Hans'},
 *   { age: 7, name: 'Sophie'},
 *   { age: 5, name: 'Han Solo'},
 *   { age: 5, name: 'HanSophie'},
 * ).pipe(
 *   distinctUntilSomeChanged(['age', 'name']),
 * )
 * .subscribe(x => console.log(x));
 *
 * // displays:
 * // { age: 4, name: 'Hans'}
 * // { age: 7, name: 'Sophie'}
 * // { age: 5, name: 'Han Solo'}
 * // { age: 5, name: 'HanSophie'}
 *
 * @example
 * // An example with `KeyCompareMap`
 * import { of } from 'rxjs';
 * import { distinctUntilSomeChanged } from 'rxjs/operators';
 *
 * interface Person {
 *     age: number;
 *     name: string;
 *  }
 * const customComparison: KeyCompareMap<Person> = {
 *   name: (oldName, newName) => oldName.substring(0, 2) === newName.substring(0, 2)
 * };
 *
 * of(
 *     { age: 4, name: 'Hans'},
 *     { age: 7, name: 'Sophie'},
 *     { age: 5, name: 'Han Solo'},
 *     { age: 5, name: 'HanSophie'},
 *   ).pipe(
 *     distinctUntilSomeChanged(['age', 'name'], customComparison),
 *   )
 *   .subscribe(x => console.log(x));
 *
 * // displays:
 * // { age: 4, name: 'Hans' }
 * // { age: 7, name: 'Sophie' }
 * // { age: 5, name: 'Han Solo' }
 *
 * @param {K[]} keys String key for object property lookup on each item.
 * @param {KeyCompareMap<T>} [compare] Optional KeyCompareMap to explicitly define comparisons for some of the keys
 * @docsPage distinctUntilSomeChanged
 * @docsCategory operators
 */
export function distinctUntilSomeChanged<T extends object, K extends keyof T>(
  keys: K[],
  keyCompareMap?: KeyCompareMap<T>
): MonoTypeOperatorFunction<T> {
  // default compare function applying === to every key
  let distinctCompare: CompareFn<T> = (oldState, newState) =>
    keys.some(
      (key) =>
        !defaultCompare(safePluck(oldState, [key]), safePluck(newState, [key]))
    );

  // generate compare function respecting every case of provided keyCompareMap
  if (keyCompareMap !== undefined) {
    const compare = (key: K) => {
      return keyCompareMap.hasOwnProperty(key) &&
        keyCompareMap[key] !== undefined
        ? (keyCompareMap[key] as CompareFn<T[K]>)
        : defaultCompare;
    };
    distinctCompare = (oldState, newState) => {
      return keys.some(
        (key) =>
          !compare(key)(safePluck(oldState, [key]), safePluck(newState, [key]))
      );
    };
  }
  return distinctUntilChanged((oldV, newV) => !distinctCompare(oldV, newV));
}
