import {
  Directive,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  Optional,
} from '@angular/core';
import { LetDirective } from '@rx-angular/template/let';
import { Observable, Subject } from 'rxjs';
import { filter, map, mergeAll, withLatestFrom } from 'rxjs/operators';


const observerSupported = () =>
  typeof window !== 'undefined'
    ? !!(window as any).IntersectionObserver
    : false;

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[viewport-prio]',
})
export class ViewportPrioDirective implements OnInit, OnDestroy {
  // Note that we're picking only the `intersectionRatio` property
  // since this is the only property that we're intersted in.
  entriesSubject = new Subject<
    Pick<IntersectionObserverEntry, 'intersectionRatio'>[]
  >();

  entries$: Observable<
    Pick<IntersectionObserverEntry, 'intersectionRatio'>
  > = this.entriesSubject.pipe(mergeAll());

  _viewportPrio = 'noop';
  /* @Input('viewport-prio')
  set viewportPrio(prio) {
    if (prio) {
      this._viewportPrio = prio || 'noop';
    }
  }*/

  private observer: IntersectionObserver | null = observerSupported()
    ? new IntersectionObserver(
        (entries) => {
          this.entriesSubject.next(entries);
        },
        {
          threshold: 0,
        }
      )
    : null;

  visibilityEvents$ = this.entries$.pipe(
    map((entry) => {
      if (entry.intersectionRatio > 0) {
        return 'visible';
      } else {
        return 'invisible';
      }
    })
  );

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    @Inject(LetDirective)
    @Optional()
    private letDirective: LetDirective<any> | null
  ) {}

  ngOnInit() {
    const letStrategyName$ = this.letDirective['strategyHandler'].values$.pipe(
      filter((name) => name !== this._viewportPrio)
    );

    this.visibilityEvents$
      .pipe(
        withLatestFrom(letStrategyName$),
        map(([visibility, strategyName]) =>
          visibility === 'visible' ? strategyName : this._viewportPrio
        )
      )
      .subscribe((strategyName) => {
        if (this.letDirective !== null) {
          this.letDirective.strategy = strategyName as string;
        }
        // render actual state on viewport enter
        // @TODO this doesnt catch unsubscribe (cant be cancelled)
        // @TODO: we need to fetch the current template of the letDirective here
        // this.strategyProvider.scheduleCD()
      });

    // If the browser doesn't support the `IntersectionObserver` or we're inside
    // the Node.js environment, then this will throw an exception that property
    // `observe` doesn't exist on `null`.
    if (this.observer !== null) {
      this.observer.observe(this.el.nativeElement);
    } else {
      // If we're inside the Node.js environment then this should be
      // rendered (e.g. for SEO purposes), and when running this code in browser
      // it will decide itself to render it or not.
      this.entriesSubject.next([{ intersectionRatio: 1 }]);
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}
