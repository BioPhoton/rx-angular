import { ɵglobal } from '@angular/core';


// @TODO move out of module as used all around the project. Maybe core?
/**
 * @description
 *
 * This function returns the zone un-patched API for the a specific Browser API.
 * window is used as target
 *
 * @param name - The name of the API to check.
 * @return {Function} - The zone un-patched API in question.
 *
 */
export function getZoneUnPatchedApi<
  N extends keyof (Window & typeof globalThis)
>(name: N): (Window & typeof globalThis)[N];
/**
 * @description
 *
 * This function returns the zone un-patched API for the a specific Browser API.
 * If no target is passed the window is used instead
 *
 * @param name - The name of the API to check.
 * @param target - The target to get un-patched API from.
 * @return {Function} - The zone un-patched API in question.
 *
 */
export function getZoneUnPatchedApi<T extends Record<string | symbol | number, any>, N extends keyof T>(
  name: N,
  target: T
): T[N];
/**
 * @description
 *
 * This function returns the zone un-patched API for the a specific Browser API.
 * If no target is passed the window is used instead
 *
 * @param name - The name of the API to check.
 * @param target - The target to get un-patched API from.
 * @return {Function} - The zone un-patched API in question.
 *
 */
export function getZoneUnPatchedApi<T extends Record<string | symbol | number, any>, N extends keyof T>(
  name: N,
  target: T = ɵglobal
): T[N] {
  return target['__zone_symbol__' + name] ?? target[name];
}
