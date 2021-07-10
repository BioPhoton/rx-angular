import { safePluck } from './safe-pluck';

interface ISafePluckSpec {
  foo: { bar: string };
}

describe('safePluck', () => {
  const bar = 'hello';
  const obj: ISafePluckSpec = { foo: { bar } };
  it('should not touch passed arguments', () => {
    const args = ['foo', 'bar'] as any;
    safePluck(obj, args);
    expect(args.length).toBe(2);
  });

  it('should return value of last key', () => {
    expect(safePluck(obj, ['foo', 'bar'])).toEqual(bar);
    expect(safePluck(obj, 'foo')).toEqual(obj.foo);
  });

  it('should return undefined if key does not exist', () => {
    expect(safePluck(obj, 'doesNotExist' as any)).toEqual(undefined);
  });

  describe('edge cases', () => {
    it('should return undefined when object is not valid', () => {
      expect(safePluck([undefined] as any, ['prop1'] as any)).toEqual(undefined);
      expect(safePluck(undefined as any, ['prop1'] as any)).toEqual(undefined);
      expect(safePluck('' as any, ['prop1'] as any)).toEqual(undefined);
      expect(safePluck(0 as any, ['prop1'] as any)).toEqual(undefined);
      expect(safePluck([], ['length'])).toEqual(undefined);
      expect(safePluck({} as any, ['prop1'] as any)).toEqual(undefined);
    });

    it('should return null when object is null', () => {
      expect(safePluck(null as any, ['prop1'] as any)).toEqual(null);
      expect(safePluck(null as any, [] as any)).toEqual(null);
      expect(safePluck(null as any, null as any)).toEqual(null);
    });

    it('should return undefined when keys are invalid', () => {
      expect(safePluck(obj, null as any)).toEqual(undefined);
      expect(safePluck(obj, [{}] as any)).toEqual(undefined);
      expect(safePluck(obj, [0] as any)).toEqual(undefined);
      expect(safePluck(obj, [''] as any)).toEqual(undefined);
      expect(safePluck(obj, [undefined] as any)).toEqual(undefined);
      expect(safePluck(obj, [] as any)).toEqual(undefined);
    });

    it('should return last value if undefined occurs in state object', () => {
      const stateObj: ISafePluckSpec = { foo: undefined as any };
      expect(safePluck(stateObj, ['foo', 'bar'])).toEqual(undefined);
    });
  });
});
