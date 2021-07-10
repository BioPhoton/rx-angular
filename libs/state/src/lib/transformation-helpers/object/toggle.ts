import { isDefined, isKeyOf, isObjectGuard } from '@rx-angular/state/internals';

import { OnlyKeysOfSpecificType } from '../interfaces/only-keys-of-specific-type';

/**
 * @description
 * Toggles a boolean property in the object.
 * Accepts object of type T and key value of which is boolean.
 * Toggles the property and returns a shallow copy of an object, while not mutating the original one.
 *
 * @example
 *
 * const state = {items: [1,2,3], loading: true};
 *
 * const updatedState = toggle(state, 'loading');
 *
 * // updatedState will be:
 * // {items: [1,2,3], loading: false};
 *
 * @example
 * // Usage with RxState
 *
 * export class ListComponent {
 *    readonly loadingChange$ = new Subject();
 *
 *    constructor(
 *      private state: RxState<ComponentState>
 *    ) {
 *      // Reactive implementation
 *      state.connect(
 *        this.api.loadingChange$,
 *        (state, _) => {
 *            return toggle(state, 'isLoading');
 *        }
 *      );
 *    }
 *
 *    // Imperative implementation
 *    toggleLoading(): void {
 *      this.set(toggle(state, 'isLoading'));
 *    }
 * }
 *
 * @returns T
 *
 * @docsPage toggle
 * @docsCategory transformation-helpers
 */

export function toggle<T extends object>(
  object: T,
  key: OnlyKeysOfSpecificType<T, boolean>
): T {
  const objectIsObject = isObjectGuard(object);
  const keyIsValid = isKeyOf<T>(key);
  const initialObject = objectIsObject ? object : ({} as T);

  if (!objectIsObject) {
    console.warn(`Toggle: original value (${object}) is not an object.`);
  }

  if (!keyIsValid) {
    console.warn(`Toggle: key argument (${key}) is invalid.`);
  }

  if (keyIsValid && typeof initialObject[key] !== 'boolean') {
    console.warn(`Toggle: value of the key (${key}) is not a boolean.`);
  }

  if (!isDefined(object) && !keyIsValid) {
    return object;
  }

  if (
    keyIsValid &&
    (typeof initialObject[key] === 'boolean' ||
      !initialObject.hasOwnProperty(key))
  ) {
    return { ...initialObject, [key]: !initialObject[key] };
  }

  return { ...initialObject };
}
