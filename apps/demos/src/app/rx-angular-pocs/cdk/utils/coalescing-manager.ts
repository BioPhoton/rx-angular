import { createPropertiesWeakMap } from './properties-weakmap';
import { coalescingObj } from '@rx-angular/cdk/coalescing';

interface CoalescingContextProps {
  numCoalescingSubscribers: number;
}

interface CoalescingManager {
  decrement: (scope: Record<string | symbol | number, unknown>) => void,
  increment: (scope: Record<string | symbol | number, unknown>) => void,
  isCoalescing: (scope: Record<string | symbol | number, unknown>) => boolean,
}

export const coalescingManager = createCoalesceManager();

const coalescingContextPropertiesMap = createPropertiesWeakMap<coalescingObj,
  CoalescingContextProps>((ctx) => ({
  numCoalescingSubscribers: 0
}));

/**
 * @describe createCoalesceManager
 *
 * returns a
 * Maintains a weak map of component references ans flags
 * them if the coalescing process is already started for them.
 *
 * Used in render aware internally.
 */
function createCoalesceManager(): CoalescingManager {
  return {
    decrement,
    increment,
    isCoalescing
  };

  // Decrements the number of subscriptions in a scope e.g. a class instance
  function decrement(scope: Record<string | symbol | number, unknown>): void {
    const numCoalescingSubscribers = coalescingContextPropertiesMap
      .getProps(scope).numCoalescingSubscribers - 1;
    coalescingContextPropertiesMap
      .setProps(scope, { numCoalescingSubscribers: numCoalescingSubscribers >= 0 ? numCoalescingSubscribers : 0 });
  }

  // Increments the number of subscriptions in a scope e.g. a class instance
  function increment(scope: Record<string | symbol | number, unknown>): void {
    const numCoalescingSubscribers =
      coalescingContextPropertiesMap
        .getProps(scope).numCoalescingSubscribers + 1;
    coalescingContextPropertiesMap
      .setProps(scope, { numCoalescingSubscribers });
  }

  // Checks if anybody else is already coalescing atm (number > 0)
  function isCoalescing(scope: Record<string | symbol | number, unknown>): boolean {
    return (
      coalescingContextPropertiesMap
        .getProps(scope).numCoalescingSubscribers > 0
    );
  }
}
