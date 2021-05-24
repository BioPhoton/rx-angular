// tslint:disable
import { Observable, Subscriber } from 'rxjs';
import { map } from 'rxjs/operators';
import { getZoneUnPatchedApi } from '../../get-zone-unpatched-api';

// @ts-ignore
const isFunction = (fn) => typeof fn === 'function';
const isArray = Array.isArray;

export interface NodeStyleEventEmitter {
  addListener: (eventName: string | symbol, handler: NodeEventHandler) => this;
  removeListener: (
    eventName: string | symbol,
    handler: NodeEventHandler
  ) => this;
}

export type NodeEventHandler = (...args: any[]) => void;

// For APIs that implement `addListener` and `removeListener` methods that may
// not use the same arguments or return EventEmitter values
// such as React Native
export interface NodeCompatibleEventEmitter {
  addListener: (eventName: string, handler: NodeEventHandler) => void | {};
  removeListener: (eventName: string, handler: NodeEventHandler) => void | {};
}

export interface JQueryStyleEventEmitter {
  on: (eventName: string, handler: Function) => void;
  off: (eventName: string, handler: Function) => void;
}

export interface HasEventTargetAddRemove<E> {
  addEventListener(
    type: string,
    listener: ((evt: E) => void) | null,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener?: ((evt: E) => void) | null,
    options?: EventListenerOptions | boolean
  ): void;
}

export type EventTargetLike<T> =
  | HasEventTargetAddRemove<T>
  | NodeStyleEventEmitter
  | NodeCompatibleEventEmitter
  | JQueryStyleEventEmitter;

export type FromEventTarget<T> =
  | EventTargetLike<T>
  | ArrayLike<EventTargetLike<T>>;

export interface EventListenerOptions {
  capture?: boolean;
  passive?: boolean;
  once?: boolean;
}

export interface AddEventListenerOptions extends EventListenerOptions {
  once?: boolean;
  passive?: boolean;
}

/* tslint:disable:max-line-length */
export function fromEvent<T>(
  target: FromEventTarget<T>,
  eventName: string
): Observable<T>;
/** @deprecated resultSelector no longer supported, pipe to map instead */
// tslint:disable-next-line:unified-signatures
export function fromEvent<T>(
  target: FromEventTarget<T>,
  eventName: string,
  resultSelector: (...args: any[]) => T
): Observable<T>;
// tslint:disable-next-line:unified-signatures
export function fromEvent<T>(
  target: FromEventTarget<T>,
  eventName: string,
  options: EventListenerOptions
): Observable<T>;
/** @deprecated resultSelector no longer supported, pipe to map instead */
// tslint:disable-next-line:unified-signatures
export function fromEvent<T>(
  target: FromEventTarget<T>,
  eventName: string,
  options: EventListenerOptions,
  resultSelector: (...args: any[]) => T
): Observable<T>;
/* tslint:enable:max-line-length */

export function fromEvent<T>(
  target: FromEventTarget<T>,
  eventName: string,
  options?: EventListenerOptions | ((...args: any[]) => T),
  resultSelector?: (...args: any[]) => T
): Observable<T> {
  if (isFunction(options)) {
    // DEPRECATED PATH
    // @ts-ignore
    resultSelector = options;
    options = undefined;
  }
  if (resultSelector) {
    // DEPRECATED PATH
    return fromEvent<T>(
      target,
      eventName,
      <EventListenerOptions | undefined>options
    ).pipe(
      map((args) =>
        isArray(args) ? resultSelector(...args) : resultSelector(args)
      )
    );
  }

  return new Observable<T>((subscriber) => {
    function handler(e: T) {
      if (arguments.length > 1) {
        subscriber.next(Array.prototype.slice.call(arguments));
      } else {
        subscriber.next(e);
      }
    }
    setupSubscription(
      target,
      eventName,
      handler,
      subscriber,
      options as EventListenerOptions
    );
  });
}

function setupSubscription<T>(
  sourceObj: FromEventTarget<T>,
  eventName: string,
  handler: (...args: any[]) => void,
  subscriber: Subscriber<T>,
  options?: EventListenerOptions
) {
  let unsubscribe: () => void;
  if (isEventTarget(sourceObj)) {
    const source = sourceObj;
    getZoneUnPatchedApi(sourceObj, 'addEventListener').call(
      sourceObj,
      eventName,
      handler,
      options
    );
    unsubscribe = () =>
      getZoneUnPatchedApi(source, 'removeEventListener').call(
        source,
        eventName,
        handler,
        options
      );
  } else if (isJQueryStyleEventEmitter(sourceObj)) {
    const source = sourceObj;
    sourceObj.on(eventName, handler);
    unsubscribe = () => source.off(eventName, handler);
  } else if (isNodeStyleEventEmitter(sourceObj)) {
    const source = sourceObj;
    sourceObj.addListener(eventName, handler as NodeEventHandler);
    unsubscribe = () =>
      source.removeListener(eventName, handler as NodeEventHandler);
  } else if (sourceObj && (sourceObj as any).length) {
    for (let i = 0, len = (sourceObj as any).length; i < len; i++) {
      setupSubscription(sourceObj[i], eventName, handler, subscriber, options);
    }
  } else {
    throw new TypeError('Invalid event target');
  }

  subscriber.add(unsubscribe);
}

function isNodeStyleEventEmitter(
  sourceObj: any
): sourceObj is NodeStyleEventEmitter {
  return (
    sourceObj &&
    typeof sourceObj.addListener === 'function' &&
    typeof sourceObj.removeListener === 'function'
  );
}

function isJQueryStyleEventEmitter(
  sourceObj: any
): sourceObj is JQueryStyleEventEmitter {
  return (
    sourceObj &&
    typeof sourceObj.on === 'function' &&
    typeof sourceObj.off === 'function'
  );
}

function isEventTarget(
  sourceObj: any
): sourceObj is HasEventTargetAddRemove<any> {
  return (
    sourceObj &&
    typeof sourceObj.addEventListener === 'function' &&
    typeof sourceObj.removeEventListener === 'function'
  );
}
