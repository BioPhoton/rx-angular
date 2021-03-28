interface CoalescingContextProps {
  numCoalescingSubscribers: number;
}

interface CoalescingManager {
  remove: (scope: object) => void;
  add: (scope: object) => void;
  isCoalescing: (scope: object) => boolean;
}

export const coalescingManager: CoalescingManager = createCoalesceManager();
type KeyOf<O> = keyof O & string & symbol & number;
/*
 * createPropertiesWeakMap
 *
 * @param getDefaults: (o: O) => P
 * Example:
 *
 * export interface Properties {
 *   isCoalescing: boolean;
 * }
 *
 * const obj: object = {
 *   foo: 'bar',
 *   isCoalescing: 'weakMap version'
 * };
 *
 * const getDefaults = (ctx: object): Properties => ({isCoalescing: false});
 * const propsMap = createPropertiesWeakMap<object, Properties>(getDefaults);
 *
 * console.log('obj before:', obj);
 * // {foo: "bar", isCoalescing: "weakMap version"}
 * console.log('props before:', propsMap.getProps(obj));
 * // {isCoalescing: "weakMap version"}
 *
 * propsMap.setProps(obj, {isCoalescing: true});
 * console.log('obj after:', obj);
 * // {foo: "bar", isCoalescing: "weakMap version"}
 * console.log('props after:', propsMap.getProps(obj));
 * // {isCoalescing: "true"}
 * */
function createPropertiesWeakMap<O extends object, P extends object>(
  getDefaults: (o: O) => P
) {
  type K = KeyOf<P>;
  const propertyMap = new WeakMap<O, P>();

  return {
    getProps: getProperties,
    setProps: setProperties,
  };

  function getProperties(ctx: O): P {
    const defaults = getDefaults(ctx);
    const propertiesPresent: P | undefined = propertyMap.get(ctx);
    let properties: P;

    if (propertiesPresent !== undefined) {
      properties = propertiesPresent;
    } else {
      properties = {} as P;

      (Object.entries(defaults) as [K, P[K]][]).forEach(
        ([prop, value]): void => {
          properties[prop] = hasKey(ctx, prop) ? ctx[prop] : value;
        }
      );

      propertyMap.set(ctx, properties);
    }
    return properties;
  }

  function setProperties(ctx: O, props: Partial<P>): P {
    const properties: P = getProperties(ctx);
    (Object.entries(props) as [K, P[K]][]).forEach(([prop, value]) => {
      properties[prop] = value;
    });
    propertyMap.set(ctx, properties);
    return properties;
  }

  function hasKey(ctx: O, property: K): ctx is K {
    return ctx[property] != null;
  }
}
const coalescingContextPropertiesMap = createPropertiesWeakMap<
  object,
  CoalescingContextProps
>((ctx) => ({
  numCoalescingSubscribers: 0,
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
    remove: removeWork,
    add: addWork,
    isCoalescing,
  };

  // Increments the number of subscriptions in a scope e.g. a class instance
  function removeWork(scope: object): void {
    const numCoalescingSubscribers =
      coalescingContextPropertiesMap.getProps(scope).numCoalescingSubscribers -
      1;
    coalescingContextPropertiesMap.setProps(scope, {
      numCoalescingSubscribers:
        numCoalescingSubscribers >= 0 ? numCoalescingSubscribers : 0,
    });
  }

  // Decrements the number of subscriptions in a scope e.g. a class instance
  function addWork(scope: object): void {
    const numCoalescingSubscribers =
      coalescingContextPropertiesMap.getProps(scope).numCoalescingSubscribers +
      1;
    coalescingContextPropertiesMap.setProps(scope, {
      numCoalescingSubscribers,
    });
  }

  // Checks if anybody else is already coalescing atm
  function isCoalescing(scope: object): boolean {
    return (
      coalescingContextPropertiesMap.getProps(scope).numCoalescingSubscribers >
      0
    );
  }
}
