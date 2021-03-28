import { getZoneUnPatchedApi } from '../utils';

/**
 * This file provides unpatched versions of APIs patched in the following file:
 * https://github.com/angular/angular/blob/master/packages/zone.js/lib/browser/browser.ts
 */

/**
 * This function is a zone un-patched implementation of Window#queueMicrotask() method.
 * It is which is exposed on the Window or Worker interface,
 * queues a microtask to be executed at a safe time prior to control returning to the browser's event loop.
 * The microtask is a short function which will run after the current task has completed its
 * work and when there is no other code waiting to be run
 * before control of the execution context is returned to the browser's event loop.
 */
export function queueMicrotask() {
  return getZoneUnPatchedApi('queueMicrotask');
}

export const Promise: PromiseConstructor = getZoneUnPatchedApi('Promise');

/**
 * requestAnimationFrame
 *
 * @description
 *
 * This function is a zone un-patched implementation of `Window#requestAnimationFrame()` method
 *
 * The `requestAnimationFrame()` method calls a function or evaluates an expression on the next animationFrame.
 * The `requestAnimationFrame()` method will not continue calling the function after executed once.
 * The ID value returned by `requestAnimationFrame()` is used as the parameter for the `cancelAnimationFrame()` method.
 *
 * requestAnimationFrame(cb, ms);
 *
 * @param cb - Required. The function that will be executed
 *
 */
export function requestAnimationFrame(cb: FrameRequestCallback): number {
  return getZoneUnPatchedApi('requestAnimationFrame')(cb);
}

/**
 * cancelAnimationFrame
 *
 * @description
 *
 * This function is a zone un-patched implementation of Window cancelAnimationFrame() method
 *
 * The cancelAnimationFrame() method clears a timer set with the requestAnimationFrame() method.
 * The ID value returned by requestAnimationFrame() is used as the parameter for the cancelAnimationFrame() method.
 *
 * To be able to use the cancelAnimationFrame() method,
 * you must use a variable when creating the requestAnimationFrame method:
 *
 * const id = requestAnimationFrame("javascript function");
 * Then you will be able to stop the execution by calling the cancelAnimationFrame() method.
 *
 * cancelAnimationFrame(id);
 *
 * @param id {number} - Required. The ID value of the timer returned by the requestAnimationFrame() method
 *
 */

export function cancelAnimationFrame(id: number): void {
  getZoneUnPatchedApi('cancelAnimationFrame')(id);
}

/**
 * setInterval
 *
 * @description
 *
 * This function is a zone un-patched implementation of Window setInterval() method
 *
 * The setInterval() method calls a function or evaluates an expression at specified intervals (in milliseconds).
 * The setInterval() method will continue calling the function until clearInterval() is called, or the window is closed.
 * The ID value returned by setInterval() is used as the parameter for the clearInterval() method.
 *
 * setInterval(cb, ms);
 *
 * @param cb - Required. The function that will be executed
 * @param ms - Required. The intervals (in milliseconds) on how often to execute the code. If the value is less than 10,
 * the value 10 is used
 *
 */
export function setInterval(cb: TimerHandler, ms = 0): number {
  return getZoneUnPatchedApi('setInterval')(cb, ms);
}

/**
 * clearInterval
 *
 * @description
 *
 * This function is a zone un-patched implementation of Window clearInterval() method
 *
 * The clearInterval() method clears a timer set with the setInterval() method.
 * The ID value returned by setInterval() is used as the parameter for the clearInterval() method.
 *
 * To be able to use the clearInterval() method, you must use a variable when creating the interval method:
 *
 * const id = setInterval("javascript function", milliseconds);
 * Then you will be able to stop the execution by calling the clearInterval() method.
 *
 * clearInterval(id);
 *
 * @param id {number} - Required. The ID value of the timer returned by the setInterval() method
 *
 */
export function clearInterval(id: number): void {
  return getZoneUnPatchedApi('clearInterval')(id);
}

/**
 * setTimeout
 *
 * @description
 *
 * This function is a zone un-patched implementation of Window setTimeout() method
 *
 * The setTimeout() method calls a function or evaluates an expression after a specified number of milliseconds.
 * The function is only executed once. If you need to repeat execution, use the setInterval() method.
 * Use the clearTimeout() method to prevent the function from running.
 *
 * setTimeout(cb, ms);
 *
 * @param cb - Required. The function that will be executed
 * @param ms - Optional. The number of milliseconds to wait before executing the code. If omitted, the value 0 is used
 *
 */
export function setTimeout(cb: TimerHandler, ms = 0): number {
  return getZoneUnPatchedApi('setTimeout')(cb, ms);
}

/**
 * clearTimeout
 *
 * @description
 *
 * This function is a zone un-patched implementation of Window#clearTimeout() method
 *
 * The clearTimeout() method clears a timer set with the setTimeout() method.
 * The ID value returned by setTimeout() is used as the parameter for the clearTimeout() method.
 *
 * const id = setTimeout("javascript function", milliseconds);
 * Then, if the function has not already been executed, you will be able to stop the execution by calling the clearTimeout() method.
 *
 * clearTimeout(id);
 *
 * @param id {number} -	Required. The ID value of the timer returned by the setTimeout() method
 *
 */
export function clearTimeout(id: number): void {
  getZoneUnPatchedApi('clearTimeout')(id);
}

/**
 * This function is a zone un-patched implementation of Element#addEventListener() method.
 * @param elem
 */
export function unpatchAddEventListener(elem) {
  elem.addEventListener = getZoneUnPatchedApi('addEventListener', elem).bind(
    elem
  );
  return elem;
}
