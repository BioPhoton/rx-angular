import { from, of } from 'rxjs';

import {
  isDefined,
  isIterableGuard,
  isKeyOf,
  isObjectGuard,
  isOperateFnArrayGuard,
  isPromiseGuard,
  isStringArrayGuard,
} from './guards';

describe('isPromiseGuard', () => {
  it('should return true for a Promise', () => {
    expect(isPromiseGuard(new Promise(() => {}))).toBeTruthy();
    expect(
      isPromiseGuard({
        then: () => {},
      })
    ).toBeTruthy();
  });

  it('should return false if input is not a promise', () => {
    expect(isPromiseGuard(true)).toBeFalsy();
    expect(isPromiseGuard({ then: true })).toBeFalsy();
  });
});

describe('isOperateFnArrayGuard', () => {
  it('should return true for a array of functions', () => {
    expect(isOperateFnArrayGuard([() => {}, () => {}, () => {}])).toBeTruthy();
  });

  it('should return false for other values', () => {
    expect(isOperateFnArrayGuard(1 as any)).toBeFalsy();
    expect(isOperateFnArrayGuard([1, 2, 3])).toBeFalsy();
    expect(isOperateFnArrayGuard(['1', '2', '3'])).toBeFalsy();
    expect(isOperateFnArrayGuard('1' as any)).toBeFalsy();
    expect(isOperateFnArrayGuard((true as unknown) as any[])).toBeFalsy();
    expect(isOperateFnArrayGuard([true, false, true])).toBeFalsy();
    expect(isOperateFnArrayGuard({} as any)).toBeFalsy();
    expect(isOperateFnArrayGuard([{}, {}, {}])).toBeFalsy();
    expect(isOperateFnArrayGuard([] as any)).toBeFalsy();
    expect(isOperateFnArrayGuard([[], [], []])).toBeFalsy();
    expect(isOperateFnArrayGuard([of(1), from([]), of(2)])).toBeFalsy();
    expect(isOperateFnArrayGuard(of(1) as any)).toBeFalsy();
  });
});

describe('isStringArrayGuard', () => {
  it('should return true if input is an array of strings', () => {
    expect(isStringArrayGuard(['1', '2', '3'])).toBeTruthy();
  });

  it('should return false for other input types', () => {
    expect(isStringArrayGuard(1 as any)).toBeFalsy();
    expect(isStringArrayGuard([1, 2, 3])).toBeFalsy();
    expect(isStringArrayGuard([() => {}, () => {}, () => {}])).toBeFalsy();
    expect(isStringArrayGuard('1' as any)).toBeFalsy();
    expect(isStringArrayGuard(true as any)).toBeFalsy();
    expect(isStringArrayGuard([true, false, true])).toBeFalsy();
    expect(isStringArrayGuard({} as any)).toBeFalsy();
    expect(isStringArrayGuard([{}, {}, {}])).toBeFalsy();
    expect(isStringArrayGuard([] as any)).toBeFalsy();
    expect(isStringArrayGuard([[], [], []])).toBeFalsy();
    expect(isStringArrayGuard([of(1), from([]), of(2)])).toBeFalsy();
    expect(isStringArrayGuard(of(1) as any)).toBeFalsy();
  });
});

describe('isIterableGuard', () => {
  it('should return true if input is a Promise', () => {
    expect(isIterableGuard([])).toBeTruthy();
    expect(
      isIterableGuard({
        [Symbol.iterator]: () => {},
      })
    ).toBeTruthy();
  });

  it('should return false for input types other than Promise', () => {
    expect(isIterableGuard(undefined)).toBeFalsy();
    expect(isIterableGuard(null)).toBeFalsy();
    expect(isIterableGuard(true)).toBeFalsy();
    expect(isIterableGuard({})).toBeFalsy();
  });
});

describe('isKeyOf', () => {
  it('should return true if key exists', () => {
    expect(isKeyOf<{ num: number }>('num')).toBeTruthy();
    expect(isKeyOf<{ 1: number }>(1)).toBeTruthy();
    expect(
      isKeyOf<{ [Symbol.iterator]: number }>(Symbol.iterator)
    ).toBeTruthy();
  });

  it('should return false for no Promise', () => {
    expect(isKeyOf(true)).toBeFalsy();
    expect(isKeyOf([])).toBeFalsy();
    expect(isKeyOf({})).toBeFalsy();
  });
});

describe('isObjectGuard', () => {
  it('should return true for object', () => {
    expect(isObjectGuard({})).toBeTruthy();
  });

  it('should return false for primitives and arrays', () => {
    expect(isObjectGuard([])).toBeFalsy();
    expect(isObjectGuard(true)).toBeFalsy();
    expect(isObjectGuard('')).toBeFalsy();
    expect(isObjectGuard(1)).toBeFalsy();
    expect(isObjectGuard(Symbol('test'))).toBeFalsy();
    expect(isObjectGuard((a: any) => a)).toBeFalsy();
  });
});

describe('isDefined', () => {
  it('should return true for everything that is not null or undefined', () => {
    expect(isDefined(true)).toBeTruthy();
    expect(isDefined(false)).toBeTruthy();
    expect(isDefined('')).toBeTruthy();
    expect(isDefined(0)).toBeTruthy();
    expect(isDefined(Symbol('test'))).toBeTruthy();
    expect(isDefined([])).toBeTruthy();
    expect(isDefined({})).toBeTruthy();
    expect(isDefined((a: any) => a)).toBeTruthy();
  });

  it('should return false for null and undefined', () => {
    expect(isDefined(undefined)).toBeFalsy();
    expect(isDefined(null)).toBeFalsy();
  });
});
