import { isDefined, isKeyOf } from '@rx-angular/state/internals';

/**
 * @description
 * Accepts an array of objects of type T and single key or array of keys (K extends keyof T).
 * The `exctract` method is pure and immutable, thus not touching the input values and returning a shallow 
 * copy of the extracted source.
 *
 * @example
 *
 * const cats = [{id: 1, type: 'cat', name: 'Fluffy'}, {id: 2, type: 'cat', name: 'Emma'}];
 *
 * const catsWithoutTypes = extract(cats, ['name', 'id']);
 *
 * // catsWithoutTypes will be:
 * // [{id: 1, name: 'Fluffy'}, {id: 2, name: 'Emma'}];
 *
 * @example
 * // Usage with RxState
 *
 * export class AnimalsListComponent {
 *
 *    constructor(private state: RxState<ComponentState>, private api: ApiService) {
 *      state.connect(
 *        'animals'
 *        this.api.getAnimals(),
 *        (state, animals) => extract(animals, ['id', 'name'])
 *      );
 *    }
 * }
 *
 * @returns T
 *
 * @docsPage slice
 * @docsCategory transformation-helpers
 */
export function extract<T extends object, K extends keyof T>(
  array: T[],
  keys: K | K[]
): Pick<T, K>[] {
  const arrayIsArray = isDefined(array) && Array.isArray(array);

  if (!arrayIsArray) {
    console.warn(`extract: original value (${array}) is not an array.`);
    return undefined as any;
  }

  const sanitizedKeys = (Array.isArray(keys) ? keys : [keys]).filter(
    (k) => isKeyOf<T>(k) && array.some((i) => k in i)
  );

  if (!sanitizedKeys.length) {
    console.warn(`extract: provided keys not found`);
    return undefined as any;
  }

  return array.map((i) =>
    sanitizedKeys.reduce((acc, k) => ({ ...acc, [k]: i[k] }), {} as Pick<T, K>)
  );
}
