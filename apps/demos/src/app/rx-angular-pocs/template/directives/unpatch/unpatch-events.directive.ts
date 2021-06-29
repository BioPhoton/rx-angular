import { AfterViewInit, Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { unpatchAddEventListener } from '@rx-angular/cdk/zone-less';
import { focusEvents, formControlsEvents, inputEvents, mouseEvents } from '@rx-angular/cdk/zone-configurations';

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
export function unpatchEventListener(elem: HTMLElement, event: string): void {
  const eventListeners = (elem as any).eventListeners(event);
  // Return if no event listeners are present
  if (!eventListeners) {
    return;
  }

  eventListeners.forEach((listener) => {
    // Remove and reapply listeners with patched API
    elem.removeEventListener(event, listener);
    // Reapply listeners with un-patched API
    unpatchAddEventListener(elem).addEventListener(event, listener);
  });
}

const eventsToUnpatch: string[] = [
  ...allEvents
];

/**
 * @Directive UnpatchEventsDirective
 *
 * @description
 *
 * The `unpatch` directive helps in partially migrating to zone-less apps as well as getting rid
 * of unnecessary renderings through zones `addEventListener` patches.
 * It can be used on any element you apply event bindings.
 *
 * The current way of binding unpatch to the DOM is to use output bindings:
 *  ```html
 * <button (click)="doStuff($event)">click me</button>
 * ```
 *
 * The problem is that every event registered over `()` syntax, e.g. `(click)`
 * marks the component and all its ancestors as dirty and re-renders the whole component tree.
 * This is because zone.js patches the native browser API and whenever one of the patched APIs is used it re-renders.
 *
 * So even if your button is not related to a change that needs a re-render the app will re-render completely.
 * This leads to bad performance. This is especially helpful if you work with frequently fired unpatch like 'mousemove'
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
 * <button [unoatch] (click)="triggerSomeMethod($event)">click me</button>
 * <button [unoatch]="['mousemove']" (mousemove)="doStuff2($event)" (click)="doStuff($event)">click me</button>
 * ```
 *
 * @publicApi
 */
// tslint:disable-next-line:directive-selector
@Directive({ selector: '[unpatch]' })
export class UnpatchEventsDirective implements AfterViewInit, OnDestroy {

  /**
   * @description
   * List of unpatch that the element should be unpatched from. When input is empty or undefined,
   * the element is unpatched from all zone-patched unpatch.
   *
   * Full list of zone-patched browser unpatch can be found in
   * [this document](https://github.com/angular/angular/blob/master/packages/zone.js/STANDARD-APIS.md#browser).
   *
   */
  @Input('unpatch')
  set events(events: string[]) {
    if (events && Array.isArray(events)) {
      this.events$.next(events);
    } else {
      this.events$.next(eventsToUnpatch);
    }
  }
  subscription = new Subscription();
  events$ = new BehaviorSubject<string[]>(eventsToUnpatch);

  constructor(private el: ElementRef) {
  }

  reapplyEventListenersZoneUnPatched(events) {
    events.forEach((ev) => {
      unpatchEventListener(this.el.nativeElement, ev);
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.subscription = this.events$
      .pipe(
        tap((eventList) => this.reapplyEventListenersZoneUnPatched(eventList))
      )
      .subscribe();
  }
}
