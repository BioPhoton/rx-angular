import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { allEvents } from '@rx-angular/cdk/zone-configurations';
import { getZoneUnPatchedApi } from '@rx-angular/cdk/zone-less';

/**
 *
 * @description
 *
 * This function takes an elem and event and re-applies the listeners from the passed event to the
 * passed element with the zone un-patched version of it.
 *
 * @param elem {HTMLElement} - The elem to re-apply the listeners to.
 * @param event {string} - The name of the event from which to re-apply the listeners.
 *
 * @returns void
 */
export function unpatchEventListener(
  element: HTMLElement & {
    eventListeners?: (event: string) => EventListenerOrEventListenerObject[];
  },
  event: string
): void {
  // `EventTarget` is patched only in the browser environment, thus
  // running this code on the server-side will throw an exception:
  // `TypeError: element.eventListeners is not a function`.
  if (typeof element.eventListeners !== 'function') {
    return;
  }
  const eventListeners = element.eventListeners(event);
  // Return if no event listeners are present
  if (!eventListeners) {
    return;
  }

  const addEventListener = getZoneUnPatchedApi(
    'addEventListener',
    element
  ).bind(element);
  eventListeners.forEach((listener) => {
    // Remove and reapply listeners with patched API
    // @TODO use (elem as any).removeAllListeners?(eventName?: string): void;
    element.removeEventListener(event, listener);
    // Reapply listeners with un-patched API
    addEventListener(event, listener);
  });
}

/**
 * @Directive UnpatchEventsDirective
 *
 * @description
 *
 * The `unpatch` directive helps in partially migrating to zone-less apps as well as getting rid
 * of unnecessary renderings through zones `addEventListener` patches.
 * It can be used on any element you apply event bindings.
 *
 * The current way of binding events to the DOM is to use output bindings:
 *  ```html
 * <button (click)="doStuff($event)">click me</button>
 * ```
 *
 * The problem is that every event registered over `()` syntax, e.g. `(click)`
 * marks the component and all its ancestors as dirty and re-renders the whole component tree.
 * This is because zone.js patches the native browser API and whenever one of the patched APIs is used it re-renders.
 *
 * So even if your button is not related to a change that needs a re-render the app will re-render completely.
 * This leads to bad performance. This is especially helpful if you work with frequently fired events like 'mousemove'
 *
 * `unpatch` directive solves that problem.
 *
 * Included Features:
 *  - by default un-patch all registered listeners of the host it is applied on
 *  - un-patch only a specified set of registered event listeners
 *  - works zone independent (it directly checks the widow for patched APIs and un-patches them without the use of `runOutsideZone` which brings more performance)
 *  - Not interfering with any logic executed by the registered callback
 *
 * @usageNotes
 *
 * The `unpatch` directive can be used like shown here:
 * ```html
 * <button [unpatch] (click)="triggerSomeMethod($event)">click me</button>
 * <button [unpatch]="['mousemove']" (mousemove)="doStuff2($event)" (click)="doStuff($event)">click me</button>
 * ```
 *
 * @publicApi
 */
// tslint:disable-next-line:directive-selector
@Directive({ selector: '[unpatch]' })
export class UnpatchEventsDirective
  implements OnChanges, AfterViewInit, OnDestroy {
  subscription = new Subscription();
  events$ = new BehaviorSubject<string[]>(allEvents);

  /**
   * @description
   * List of events that the element should be unpatched from. When input is empty or undefined,
   * the element is unpatched from all zone-patched events.
   *
   * Full list of zone-patched browser events can be found in
   * [this document](https://github.com/angular/angular/blob/master/packages/zone.js/STANDARD-APIS.md#browser).
   *
   */
  @Input('unpatch') events?: string[];

  reapplyEventListenersZoneUnPatched(events: string[]) {
    events.forEach((ev) => {
      unpatchEventListener(this.el.nativeElement, ev);
    });
  }

  constructor(private el: ElementRef) {}

  ngOnChanges({ events }: SimpleChanges): void {
    if (events && Array.isArray(this.events)) {
      this.events$.next(this.events);
    }
  }

  ngAfterViewInit(): void {
    this.subscription = this.events$.subscribe((eventList) => {
      this.reapplyEventListenersZoneUnPatched(eventList);
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
