import { isDefined, isObjectGuard } from '@rx-angular/state/internals';

/**
 * @description
 * Converts a dictionary of type {[key: string]: T} to array T[].
 *
 * @example
 *
 * const creaturesDictionary = {
 *   '1': {id: 1, type: 'cat'},
 *   '2': {id: 2, type: 'dog'},
 *   '3': {id: 3, type: 'parrot'}
 * };
 *
 * const creaturesArray = dictionaryToArray(creaturesDictionary);
 *
 * // creaturesArray will be:
 * // [{id: 1, type: 'cat'}, {id: 2, type: 'dog'}, {id: 3, type: 'parrot'}];
 *
 * @example
 * // Usage with RxState
 *
 * export class ListComponent {
 *    readonly removeName$ = new Subject();
 *
 *    constructor(
 *      private state: RxState<ComponentState>,
 *      private api: ApiService
 *    ) {
 *      // Reactive implementation
 *      state.connect(
 *        'creatures',
 *        this.api.creaturesDictionary$,
 *        (_, creatures) => {
 *            return dictionaryToArray(creatures);
 *        }
 *      );
 *    }
 *
 *    // Imperative implementation
 *    removeName(): void {
 *      this.api.creaturesDictionary$.pipe(
 *        // subscription handling logic
 *      ).subscribe(
 *        dictionary => this.set({creatures: dictionaryToArray(dictionary)})
 *      );
 *    }
 * }
 *
 * @returns T[];
 *
 * @docsPage dictionaryToArray
 * @docsCategory transformation-helpers
 */
export function dictionaryToArray<T>(dictionary: { [key: string]: T }): T[] {
  if (!isDefined(dictionary)) {
    return dictionary;
  }

  if (!isObjectGuard(dictionary)) {
    console.warn(`DictionaryToArray: unexpected input.`);
    return [];
  }

  return Object.values(dictionary);
}
