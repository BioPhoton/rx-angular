/**
 * @description
 * The function which is used by `KeyCompareMap` to determine if changes are distinct or not.
 * Should return true if values are equal.
 *
 * @param {T} oldVal
 * @param {T} newVal
 *
 * @return boolean
 *
 * @docsPage interfaces
 * @docsCategory operators
 */
export type CompareFn<T> = (oldVal: T, newVal: T) => boolean;

/**
 * @description
 * The `KeyCompareMap` is used to configure custom comparison for defined keys.
 *
 * @example
 * const keyCompareMap = {
 *    myKey: (o, n) => customCompare(o, n)
 *  };
 *  const o$ = of({
 *    myKey: 5,
 *    myOtherKey: 'bar'
 *  }).pipe(distinctUntilSomeChanged(['myKey', 'myOtherKey'], keyCompareMap));
 *
 *  //or
 *
 *  const o$ = of({
 *    myKey: 5,
 *    myOtherKey: 'bar'
 *  }).pipe(selectSlice(['myKey', 'myOtherKey'], keyCompareMap));
 *
 * @docsPage interfaces
 * @docsCategory operators
 */
export type KeyCompareMap<T extends object> = {
  [K in keyof Partial<T>]: CompareFn<T[K]>;
};

export type ComparableData<T> = CompareFn<T> | keyof T | (keyof T)[];
