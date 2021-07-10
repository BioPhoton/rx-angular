import { isDefined, isKeyOf, isObjectGuard } from '@rx-angular/state/internals';

/**
 * @description
 * Accepts an object of type T and key of type K extends keyof T.
 * Removes property from an object and returns a shallow copy of the updated object without specified property.
 * If property not found returns copy of the original object.
 * Not mutating original object.
 *
 * @example
 *
 * const cat = {id: 1, type: 'cat', name: 'Fluffy'};
 *
 * const anonymusCat = deleteProp(cat, 'name');
 *
 * // anonymusCat will be:
 * // {id: 1, type: 'cat'};
 *
 * @example
 * // Usage with RxState
 *
 * export class ProfileComponent {
 *
 *    readonly removeName$ = new Subject();
 *
 *    constructor(private state: RxState<ComponentState>) {
 *      // Reactive implementation
 *      state.connect(
 *        this.removeName$,
 *        (state) => {
 *            return deleteProp(state, 'name');
 *        }
 *      );
 *    }
 *
 *    // Imperative implementation
 *    removeName(): void {
 *        this.state.set(remove(this.get(), 'name'));
 *    }
 * }
 *
 * @returns Omit<T, K>
 *
 * @docsPage deleteProp
 * @docsCategory transformation-helpers
 */
export function deleteProp<T extends object, K extends keyof T>(
  object: T,
  key: K
): Omit<T, K> {
  if (!isDefined(object) || !isObjectGuard(object)) {
    console.warn(`DeleteProp: original value ${object} is not an object.`);
    return object;
  }

  if (!isKeyOf<T>(key)) {
    console.warn(`DeleteProp: provided key is not a string, number or symbol.`);
    return { ...object };
  }

  const copy = { ...object };
  delete copy[key];
  return copy;
}
