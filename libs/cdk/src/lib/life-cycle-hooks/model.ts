import { Observable, Subject } from 'rxjs';

/**
 * Interface to declare name and value of the OnDestroy lifecycle hook
 */
export interface DestroyProp {
  destroy: true;
}

/**
 * Interface to declare names and values of single shot lifecycle hook. e.g. init, afterViewInit, afterContentInit, destroy
 */
// tslint:disable-next-line:no-empty-interface
export interface SingleShotProps extends DestroyProp {}

/**
 * Interface to declare names and values of lifecycle hook. e.g. init, changes, afterViewInit, etc...
 */
// tslint:disable-next-line:no-empty-interface
export interface HookProps extends DestroyProp {}

/**
 * Interface to specify an Observable channel for lifecycle hooks.
 * It is types as Partial of possible lifecycle names and values
 */
export interface DestroyChannel$ {
  readonly _hooks$: Subject<DestroyProp>;
}

/**
 * Interface to specify the channel for the `onDestoy` hook as Observable
 */
export interface OnDestroy$ extends DestroyChannel$ {
  onDestroy$: Observable<boolean>;
}
