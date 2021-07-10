import { isDefined, isKeyOf } from '@rx-angular/state/internals';

import { OnlyKeysOfSpecificType } from '../interfaces/only-keys-of-specific-type';

/**
 * @description
 * Converts an array of objects to a dictionary {[key: string]: T}.
 * Accepts array T[] and key of type string, number or symbol as inputs.
 *
 *
 * @example
 *
 * const creatures = [{id: 1, type: 'cat'}, {id: 2, type: 'dog'}, {id: 3, type: 'parrot'}];
 *
 * const creaturesDictionary = toDictionary(creatures, 'id');
 *
 * // creaturesDictionary will be:
 * // {
 * //  1: {id: 1, type: 'cat'},
 * //  2: {id: 2, type: 'dog'},
 * //  3: {id: 3, type: 'parrot'}
 * // };
 * @example
 * // Usage with RxState
 *
 * export class ListComponent {
 *
 *    readonly convertToDictionary$ = new Subject();
 *
 *    constructor(private state: RxState<ComponentState>) {
 *      // Reactive implementation
 *      state.connect(
 *        'creaturesDictionary',
 *        this.convertToDictionary$,
 *        ({ creatures }) => {
 *            return toDictionary(creatures, 'id');
 *        }
 *      );
 *    }
 *
 *    // Imperative implementation
 *    convertToDictionary(): void {
 *        this.state.set({ creaturesDictionary: toDictionary(this.state.get().creatures, 'id'});
 *    }
 * }
 *
 * @see {@link OnlyKeysOfSpecificType}
 * @param {OnlyKeysOfSpecificType<T, S>} key
 * @returns { [key: string]: T[] }
 * @docsPage toDictionary
 * @docsCategory transformation-helpers
 */
export function toDictionary<T extends object>(
  source: T[],
  key:
    | OnlyKeysOfSpecificType<T, number>
    | OnlyKeysOfSpecificType<T, string>
    | OnlyKeysOfSpecificType<T, symbol>
): { [key: string]: T } {
  if (!isDefined(source)) {
    return source;
  }

  const sourceEmpty = !source.length;

  if (!Array.isArray(source) || sourceEmpty || !isKeyOf<T>(source[0][key])) {
    if (!sourceEmpty) {
      console.warn('ToDictionary: unexpected input params.');
    }
    return {};
  }

  return source.reduce(
    (acc, entity) => ({
      ...acc,
      [entity[key] as any]: entity
    }),
    {}
  );
}
