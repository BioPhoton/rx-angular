import {
  isDefined,
  valuesComparer,
  ComparableData,
} from '@rx-angular/state/internals';

/**
 * @description
 * Removes one or multiple items from an array T[].
 * For comparison you can provide a key, an array of keys or a custom comparison function that should return true if items match.
 * If no comparison data is provided, an equality check is used by default.
 * Returns a shallow copy of the updated array T[], and does not mutate the original one.
 *
 * @example
 * // Removing value without comparison data
 *
 * const items = [1,2,3,4,5];
 *
 * const updatedItems = remove(items, [1,2,3]);
 *
 * // updatedItems will be: [4,5];
 *
 * @example
 * // Removing values with comparison function
 *
 * const creatures = [{id: 1, type: 'cat'}, {id: 2, type: 'unicorn'}, {id: 3, type: 'kobold'}];
 *
 * const nonExistingCreatures = [{id: 2, type: 'unicorn'}, {id: 3, type: 'kobold'}];
 *
 * const realCreatures = remove(creatures, nonExistingCreatures, (a, b) => a.id === b.id);
 *
 * // realCreatures will be: [{id: 1, type: 'cat'}];
 *
 * @example
 * // Removing values with key
 *
 * const creatures = [{id: 1, type: 'cat'}, {id: 2, type: 'unicorn'}, {id: 3, type: 'kobold'}];
 *
 * const nonExistingCreatures = [{id: 2, type: 'unicorn'}, {id: 3, type: 'kobold'}];
 *
 * const realCreatures = remove(creatures, nonExistingCreatures, 'id');
 *
 * // realCreatures will be: [{id: 1, type: 'cat'}];
 *
 * @example
 * // Removing values with array of keys
 *
 * const creatures = [{id: 1, type: 'cat'}, {id: 2, type: 'unicorn'}, {id: 3, type: 'kobold'}];
 *
 * const nonExistingCreatures = [{id: 2, type: 'unicorn'}, {id: 3, type: 'kobold'}];
 *
 * const realCreatures = remove(creatures, nonExistingCreatures, ['id', 'type']);
 *
 * // realCreatures will be: [{id: 1, type: 'cat'}];
 *
 * @example
 * // Usage with RxState
 *
 * export class ListComponent {
 *
 *    readonly removeCreature$ = new Subject<Creature>();
 *
 *    constructor(private state: RxState<ComponentState>) {
 *      // Reactive implementation
 *      state.connect(
 *        'creatures',
 *        this.removeCreature$,
 *        ({ creatures }, creatureToRemove) => {
 *            return remove(creatures, creatureToRemove, (a, b) => a.id === b.id);
 *        }
 *      );
 *    }
 *
 *    // Imperative implementation
 *    removeCreature(creatureToRemove: Creature): void {
 *        this.state.set({ creatures: remove(this.state.get().creatures, creatureToRemove, (a, b) => a.id === b.id)});
 *    }
 * }
 *
 * @returns T[]
 *
 * @docsPage remove
 * @docsCategory transformation-helpers
 */
export function remove<T>(
  source: T[],
  scrap: Partial<T>[] | Partial<T>,
  compare?: ComparableData<T>
): T[] {
  const scrapAsArray = isDefined(scrap)
    ? Array.isArray(scrap)
      ? scrap
      : [scrap]
    : [];
  const invalidInput = !Array.isArray(source);

  if (invalidInput) {
    console.warn(`Remove: original value (${source}) is not an array`);
    return source;
  }

  return source.filter((existingItem) => {
    return !scrapAsArray.some((item) =>
      valuesComparer(item as T, existingItem, compare)
    );
  });
}
