import { isObjectGuard } from '@rx-angular/state/internals';

/**
 * @description
 * Merges an object of type T with updates of type Partial<T>.
 * Returns a new object where updates override original values while not mutating the original one.

 * @example
 * interface Creature {
 *  id: number,
 *  type: string,
 *  name: string
 * }
 *
 * const cat = {id: 1, type: 'cat'};
 *
 * const catWithname = patch(cat, {name: 'Fluffy'});
 *
 * // catWithname will be:
 * // {id: 1, type: 'cat', name: 'Fluffy'};
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
 *            return patch(state, { name });
 *        }
 *      );
 *    }
 *
 *    // Imperative implementation
 *    changeName(name: string): void {
 *        this.state.set(patch(this.get(), { name }));
 *    }
 * }
 *
 * @returns T
 *
 * @docsPage patch
 * @docsCategory transformation-helpers
 */
export function patch<T extends object>(object: T, upd: Partial<T>): T {
  const update = isObjectGuard(upd) ? upd : {};

  if (!isObjectGuard(object) && isObjectGuard(upd)) {
    console.warn(`Patch: original value ${object} is not an object.`);
    return { ...update } as T;
  }

  if (!isObjectGuard(object) && !isObjectGuard(upd)) {
    console.warn(
      `Patch: original value ${object} and updates ${upd} are not objects.`
    );
    return object;
  }

  return { ...object, ...update };
}
