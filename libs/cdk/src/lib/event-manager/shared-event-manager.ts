import { EventManager, ɵgetDOM } from '@angular/platform-browser';
import { inject, Injectable } from '@angular/core';
import { isObservable, Observable } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { fromEvent } from '../operators';
import { share } from 'rxjs/operators';

type Target = 'window' | 'document';
type EventName = string;
type SharedEvent = Observable<Event> | null | undefined;

interface SharedEventsContainer {
  window: Map<EventName, SharedEvent>;
  document: Map<EventName, SharedEvent>;
}

@Injectable()
export class SharedEventManager extends EventManager {
  private container: SharedEventsContainer = {
    window: new Map(),
    document: new Map(),
  };
  private document: Document = inject(DOCUMENT);

  addGlobalEventListener(
    target: Target,
    eventName: EventName,
    handler: Function
  ) {
    // @TODO handle `.` configurations as there are too many edge cases. e.g. keypress.Enter, click.passive, touchstart.Enter.string
    if (eventName.includes('.')) {
      return () => {
        super.addGlobalEventListener(target, eventName, handler);
      };
    }

    let sharedEvent: SharedEvent = this.container[target].get(eventName);
    if (!isObservable(sharedEvent)) {
      // @Notice: here we use the unpatched version of `fromEvent` so we dont need`to instanciate/get NgZone
      sharedEvent = fromEvent<Event>(
        ɵgetDOM().getGlobalEventTarget(this.document, target),
        eventName
      ).pipe(share());
      this.container[target].set(eventName, sharedEvent);
    }
    const subscription = sharedEvent.subscribe((event) => handler(event));
    return () => {
      subscription.unsubscribe();
    };
  }
}
