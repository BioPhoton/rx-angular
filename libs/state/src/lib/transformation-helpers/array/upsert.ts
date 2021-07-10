import {
  isObjectGuard,
  valuesComparer,
  ComparableData,
} from '@rx-angular/state/internals';

/**
 * @description
 * Updates or inserts (if does not exist) one or multiple items in an array T[].
 * For comparison you can provide a key, an array of keys or a custom comparison function that should return true if
 * items match.
 * If no comparison is provided, an equality check is used by default.
 * upsert is `pure` and `immutable`, your inputs won't be changed
 *
 *
 * @example
 * // Upsert (update) with key
 *
 * const creatures = [{id: 1, type: 'cat'}, {id: 2, type: 'dog'}];
 *
 * const newCat = {id: 1, type: 'lion'};
 *
 * const updatedCreatures = upsert(creatures, newCat, 'id');
 *
 * // updatedCreatures will be:
 * // [{id: 1, type: 'lion'}, {id: 2, type: 'dog'}];
 *
 * @example
 * // Upsert (insert) with key
 *
 * const creatures = [{id: 1, type: 'cat'}, {id: 2, type: 'dog'}];
 *
 * const newCat = {id: 3, type: 'lion'};
 *
 * const updatedCreatures = upsert(creatures, newCat, 'id');
 *
 * // updatedCreatures will be:
 * // [{id: 1, type: 'cat'}, {id: 2, type: 'dog'}, {id: 3, type: 'lion'}];
 *
 * @example
 * // Upsert (update) with array of keys
 *
 * const creatures = [{id: 1, type: 'cat', name: 'Bella'}, {id: 2, type: 'dog', name: 'Sparky'}];
 *
 * const newCat = {id: 1, type: 'lion', name: 'Bella'};
 *
 * const updatedCreatures = upsert(creatures, newCat, ['id', 'name']);
 *
 * // updatedCreatures will be:
 * // [{id: 1, type: 'lion', name: 'Bella'}, {id: 2, type: 'dog', name: 'Sparky'}];
 *
 * @example
 * // Update (insert) with comparison function
 *
 * const creatures = [{id: 1, type: 'cat'}, {id: 2, type: 'dog'}];
 *
 * const newCat = {id: 3, type: 'lion'};
 *
 * const updatedCreatures = upsert(creatures, newCat, (a, b) => a.id === b.id);
 *
 * // updatedCreatures will be:
 * // [{id: 1, type: 'cat'}, {id: 2, type: 'dog'}, {id: 3, type: 'lion'}];
 *
 * @example
 * // Usage with RxState
 *
 * export class ListComponent {
 *
 *    // trigger which gets called on add/update (for reactive implementation)
 *    readonly addOrUpdateCreature = new Subject<Creature>();
 *
 *    constructor(private state: RxState<ComponentState>) {
 *      const initialCreatures = [{id: 1, type: 'cat', name: 'Bella'}, {id: 2, type: 'dog', name: 'Sparky'}];
 *      state.set({ creatures: initialCreatures });
 *      // Reactive implementation
 *      state.connect(
 *        'creatures',
 *        this.addOrUpdateCreature,
 *        ({ creatures }, creatureToUpsert) => {
 *            return upsert(creatures, creatureToUpsert, 'id');
 *        }
 *      );
 *    }
 *
 *    // Imperative implementation
 *    updateCreature(creatureToUpdate: Creature): void {
 *        this.state.set({ creatures: upsert(this.state.get('creatures'), creatureToUpdate, 'id')});
 *    }
 * }
 *
 * @returns T[]
 *
 * @docsPage upsert
 * @docsCategory transformation-helpers
 */
export function upsert<T>(
  source: T[],
  update: Partial<T>[] | Partial<T>,
  compare?: ComparableData<T>
): T[] {
  // check inputs for validity
  const updatesAsArray =
    update != null ? (Array.isArray(update) ? update : [update]) : [];
  // check inputs for validity
  const sourceIsArray = Array.isArray(source);
  const invalidInput = !sourceIsArray && updatesAsArray.length === 0;
  // if the source value is not an Array or the input is not defined return the original source
  // this is the case for any edge case:
  // '', null, undefined, CustomObjectOfDoomAndDarkness, ...
  if (invalidInput) {
    return source;
  }

  // if source is empty array or not an array, but the updates are valid:
  // return a shallow copy of the updates as result
  if (updatesAsArray.length > 0 && (!sourceIsArray || source.length === 0)) {
    return [...updatesAsArray] as T[];
  }

  const inserts: T[] = [];
  const updates: Record<number, Partial<T>> = {};
  // process updates/inserts
  updatesAsArray.forEach((item) => {
    const match = source.findIndex((sourceItem) =>
      valuesComparer(item as T, sourceItem, compare)
    );
    // if item already exists, save it as update
    if (match !== -1) {
      updates[match] = item;
    } else {
      // otherwise consider this as insert
      if (isObjectGuard(item)) {
        // create a shallow copy if item is an object
        inserts.push({ ...(item as T) });
      } else {
        // otherwise just push it
        inserts.push(item);
      }
    }
  });
  let updated = source;
  if (Object.keys(updates).length > 0) {
    // if we have updates to process
    updated = updated.map((item, i) => {
      const updatedItem = updates[i];
      // process the updated
      if (updatedItem != null) {
        if (isObjectGuard(item)) {
          return { ...item, ...updatedItem };
        } else {
          return updatedItem as T;
        }
      }
      return item;
    });
  }
  // return the combination of the updated source & the inserts as new array
  return [...updated, ...inserts];
}
