import { isDefined, isKeyOf, isObjectGuard } from '@rx-angular/state/internals';

/**
 * @description
 * Accepts an object of type T, key of type K extends keyof T, and value of type T[K].
 * Sets the property and returns a newly updated shallow copy of an object while not mutating the original one.
 *
 * @example
 *
 * const cat = {id: 1, type: 'cat', name: 'Fluffy'};
 *
 * const renamedCat = setProp(cat, 'name', 'Bella');
 *
 * // renamedCat will be:
 * // {id: 1, type: 'cat', name: 'Bella'};
 *
 * @example
 * // Usage with RxState
 *
 * export class ProfileComponent {
 *
 *    readonly changeName$ = new Subject<string>();
 *
 *    constructor(private state: RxState<ComponentState>) {
 *      // Reactive implementation
 *      state.connect(
 *        this.changeName$,
 *        (state, name) => {
 *            return setProp(state, 'name', name);
 *        }
 *      );
 *    }
 *
 *    // Imperative implementation
 *    changeName(name: string): void {
 *        this.state.set(setProp(this.get(), 'name', name));
 *    }
 * }
 *
 * @returns T
 *
 * @docsPage setProp
 * @docsCategory transformation-helpers
 */
export function setProp<T extends object, K extends keyof T>(
  object: T,
  key: K,
  value: T[K]
): T {
  const objectIsObject = isObjectGuard(object);
  const keyIsValid = isKeyOf<T>(key);
  const initialObject = objectIsObject ? object : ({} as T);

  if (!objectIsObject) {
    console.warn(`SetProp: original value (${object}) is not an object.`);
  }

  if (!keyIsValid) {
    console.warn(`SetProp: key argument (${key}) is invalid.`);
  }

  if (!isDefined(object) && !keyIsValid) {
    return object;
  }

  if (keyIsValid) {
    return {
      ...initialObject,
      [key]: value
    };
  }

  return { ...initialObject };
}
