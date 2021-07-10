import { valuesComparer } from './values-comparer';

interface Creature {
  id: number;
  type: string;
}

let item: Creature;
let clone: Creature;
let otherItem: Creature;

beforeEach(() => {
  item = { id: 1, type: 'cat' };
  clone = { ...item };
  otherItem = { id: 2, type: 'cat' };
});

describe('valuesComparer', () => {
  describe('general', () => {
    it('should be defined', () => {
      const fn = valuesComparer;
      expect(fn).toBeDefined();
    });
  });

  describe('functionality', () => {
    describe('primitives', () => {
      it('should return true if matching', () => {
        expect(valuesComparer(1, 1)).toBeTruthy();
      });

      it('should return false if not matching', () => {
        expect(valuesComparer(1, 2)).toBeFalsy();
      });

      it('should return true if matching by compareFn', () => {
        expect(
          valuesComparer(
            1,
            1,
            (a: number, b: number) => a.toString() === b.toString()
          )
        );
      });

      it('should return false if matching by compareFn', () => {
        expect(
          valuesComparer(
            1,
            2,
            (a: number, b: number) => a.toString() === b.toString()
          )
        );
      });
    });

    describe('non-primitives', () => {
      it('should return true if values has same reference', () => {
        expect(valuesComparer(item, item)).toBeTruthy();
      });

      it('should return false if values has different reference', () => {
        expect(valuesComparer(item, clone)).toBeFalsy();
      });

      it('should return true if items match by CompareFn', () => {
        expect(
          valuesComparer(
            item,
            clone,
            (a: typeof item, b: typeof clone) => a.id === b.id
          )
        ).toBeTruthy();
      });

      it('should return false if items do nott match by CompareFn', () => {
        expect(
          valuesComparer(
            item,
            otherItem,
            (a: typeof item, b: typeof otherItem) => a.id === b.id
          )
        ).toBeFalsy();
      });

      it('should return true if items match by key', () => {
        expect(valuesComparer(item, otherItem, 'type')).toBeTruthy();
      });

      it('should return false if items do not match by key', () => {
        expect(valuesComparer(item, otherItem, 'id')).toBeFalsy();
      });

      it('should return true if items match by array of keys', () => {
        expect(valuesComparer(item, clone, ['id', 'type'])).toBeTruthy();
      });

      it('should return false if items do not match by array of keys', () => {
        expect(valuesComparer(item, otherItem, ['id', 'type'])).toBeFalsy();
      });
    });

    describe('edge cases', () => {
      it('should return true if provided key is not found', () => {
        expect(valuesComparer(item, clone, 'name' as any)).toBeTruthy();
      });

      it('should return true if some keys in array not found', () => {
        expect(valuesComparer(item, clone, ['id', 'name' as any])).toBeTruthy();
      });

      it('should return true if one of provided keys is not a primitive', () => {
        expect(
          valuesComparer(item, clone, ['id', { a: 1 } as any])
        ).toBeTruthy();
      });

      it('should compare with defaultCompare if array of provided keys not including strings/numbers/symbols', () => {
        expect(
          valuesComparer(item, clone, [[] as any, { a: 1 } as any])
        ).toBeFalsy();
      });

      it('should compare with defaultCompare if array of provided keys is empty', () => {
        expect(valuesComparer(item, clone, [])).toBeFalsy();
      });
    });
  });
});
