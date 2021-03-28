import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { getZoneUnPatchedApi } from '@rx-angular/cdk/zone-less';

// tslint:disable-next-line:directive-selector
@Directive({ selector: '[runOutsideZone]' })
export class RunOutsideZoneDirective implements AfterViewInit, OnDestroy {
  subscription = new Subscription();
  events$ = new BehaviorSubject<string[]>(['click']);

  @Input('runOutsideZone')
  set events(value: string[]) {
    if (value && value.length > 0) {
      this.events$.next(value);
    } else {
      this.events$.next(['click']);
    }
  }

  reapplyEventListenersZoneUnPatched(events) {
    events.forEach(ev => {
      this.unpatchEventListener(this.el.nativeElement, ev);
    });
  }

  constructor(private el: ElementRef, private ngZone: NgZone) {}

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.subscription = this.events$
      .pipe(
        tap(eventList => this.reapplyEventListenersZoneUnPatched(eventList))
      )
      .subscribe();
  }

  unpatchEventListener(elem: HTMLElement, event: string): void {
    const eventListeners = (elem as any).eventListeners(event);
    // Return if no event listeners are present
    if (!eventListeners) {
      return;
    }

    const addEventListener = getZoneUnPatchedApi('addEventListener', elem).bind(
      elem
    );
    eventListeners.forEach(listener => {
      // Remove and reapply listeners with patched API
      elem.removeEventListener(event, listener);
      // Reapply listeners with un-patched API
      this.ngZone.runOutsideAngular(() => {
        elem.addEventListener(event, listener);
      });
    });
  }
}
