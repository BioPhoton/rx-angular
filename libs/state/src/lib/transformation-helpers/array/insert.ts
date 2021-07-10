import { isDefined } from '@rx-angular/state/internals';

/**
 * @description
 * Inserts one or multiple items to an array T[].
 * Returns a shallow copy of the updated array T[], and does not mutate the original one.
 *
 * @example
 * // Inserting single value
 *
 * const creatures = [{id: 1, type: 'cat'}, {id: 2, type: 'dog'}];
 *
 * const updatedCreatures = insert(creatures, {id: 3, type: 'parrot'});
 *
 * // updatedCreatures will be:
 * //  [{id: 1, type: 'cat'}, {id: 2, type: 'dog}, {id: 3, type: 'parrot}];
 *
 * @example
 * // Inserting multiple values
 *
 * const creatures = [{id: 1, type: 'cat'}, {id: 2, type: 'dog'}];
 *
 * const updatedCreatures = insert(creatures, [{id: 3, type: 'parrot'}, {id: 4, type: 'hamster'}]);
 *
 * // updatedCreatures will be:
 * // [{id: 1, type: 'cat'}, {id: 2, type: 'dog'}, {id: 3, type: 'parrot'}, {id: 4, type: 'hamster'}];
 *
 * @example
 * // Usage with RxState
 *
 * export class ListComponent {
 *
 *    readonly insertCreature$ = new Subject<void>();
 *
 *    constructor(private state: RxState<ComponentState>) {
 *      // Reactive implementation
 *      state.connect(
 *        'creatures',
 *        this.insertCreature$,
 *        ({ creatures }) => {
 *            const creatureToAdd = {id: generateId(), name: 'newCreature', type: 'dinosaur' };
 *            return insert(creatures, creatureToAdd);
 *        }
 *      );
 *    }
 *
 *    // Imperative implementation
 *    insertCeature(): void {
 *        const creatureToAdd = {id: generateId(), name: 'newCreature', type: 'dinosaur' };
 *        this.state.set({ creatures: insert(this.state.get().creatures, creatureToAdd)});
 *    }
 * }
 *
 *
 * @returns T[]
 *
 * @docsPage insert
 * @docsCategory transformation-helpers
 */
export function insert<T>(source: T[], updates: T | T[]): T[] {
  const updatesDefined = isDefined(updates);
  const sourceIsArray = Array.isArray(source);
  const invalidInput = !sourceIsArray && !updatesDefined;

  if (!sourceIsArray && isDefined(source)) {
    console.warn(`Insert: Original value (${source}) is not an array.`);
  }

  if (invalidInput) {
    return source;
  }

  return [
    ...(sourceIsArray ? source : []),
    ...(updatesDefined ? (Array.isArray(updates) ? updates : [updates]) : [])
  ];
}
