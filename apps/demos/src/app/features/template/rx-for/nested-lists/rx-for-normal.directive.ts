import {
  ChangeDetectorRef,
  Directive,
  EmbeddedViewRef,
  Inject,
  Input,
  IterableChangeRecord,
  IterableChanges,
  IterableDiffer,
  IterableDiffers,
  NgIterable,
  OnDestroy,
  OnInit,
  TemplateRef,
  TrackByFunction,
  ViewContainerRef
} from '@angular/core';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';
import { RxDefaultListViewContext } from '@rx-angular/cdk/template-management';

import {
  concat,
  forkJoin,
  Observable,
  ObservableInput,
  of,
  ReplaySubject,
  Subject,
  Subscription
} from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  switchAll,
  switchMap,
  take,
  tap
} from 'rxjs/operators';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  // tslint:disable-next-line:directive-selector
  selector: '[rxForNormal]'
})
export class RxForNormal<T, U extends NgIterable<T> = NgIterable<T>>
  implements OnInit, OnDestroy {
  @Input()
  set rxForNormal(potentialObservable: ObservableInput<U> | null | undefined) {
    this._rxFor = potentialObservable;
    this.observables$.next(potentialObservable);
  }

  @Input()
  set rxForNormalOf(potentialObservable: ObservableInput<U> | null | undefined) {
    this._rxFor = potentialObservable;
    this.observables$.next(potentialObservable);
  }
  @Input('rxForNormalRenderCallback') set renderCallback(
    renderCallback: Subject<void>
  ) {
    this._renderCallback = renderCallback;
  }
  @Input('rxForNormalStrategy') set strategy(strategy: string) {
    this._strategy = strategy;
  }
  get strategy(): string {
    return this._strategy || this.strategyProvider.primaryStrategy;
  }
  @Input()
  set rxForNormalTrackBy(fn: TrackByFunction<T>) {
    this._trackByFn = fn;
  }

  constructor(
    private strategyProvider: RxStrategyProvider,
    private cdRef: ChangeDetectorRef,
    private readonly templateRef: TemplateRef<RxDefaultListViewContext<T, U>>,
    private readonly viewContainerRef: ViewContainerRef,
    private iterableDiffers: IterableDiffers
  ) {}


  private differ: IterableDiffer<T> | null = null;
  private observables$ = new ReplaySubject<ObservableInput<U>>(1);
  private readonly strategies = this.strategyProvider.strategies;
  values$ = this.observables$.pipe(
    switchAll(),
    distinctUntilChanged(),
    shareReplay({ refCount: true, bufferSize: 1 })
  );
  private _rxFor: ObservableInput<U> | null | undefined;

  // true if affects view
  // private readonly __renderCallback = new Subject<any>();
  private _renderCallback: Subject<any>;

  /* private readonly strategyName$ = new ReplaySubject<Observable<string>>(1);
   private readonly strategy$: Observable<RxStrategyCredentials> = strategyName$.pipe(
   ngInputFlatten(),
   startWith(this.defaultStrategyName),
   nameToStrategyCredentials(this.strategies, cfg.defaultStrategyName)
   );*/

  // TODO: handle observable as strategy input
  private _strategy: string;

  private _trackByFn;

  private sub = new Subscription();

  /**
   * Asserts the correct type of the context for the template that `NgForOf` will render.
   *
   * The presence of this method is a signal to the Ivy template type-check compiler that the
   * `NgForOf` structural directive renders its template with a specific context type.
   */
  static ngTemplateContextGuard<T, U extends NgIterable<T>>(
    dir: RxForNormal<T, U>,
    ctx: any
  ): ctx is RxDefaultListViewContext<T, U> {
    return true;
  }

  @Input()
  rxForDistinctBy = (a, b) => a.value === b.value;

  initDiffer(iterable: U = [] as U) {
    this.differ = this.iterableDiffers
      .find(iterable)
      .create(this._trackByFn);
  }

  ngOnInit() {
    this.sub.add(
      concat(
        this.values$.pipe(
          take(1),
          tap(value => this.initDiffer(value || ([] as any)))
        ),
        this.values$
      )
        .pipe(
          map(i => this.differ.diff(i)),
          filter(diff => !!diff),
          switchMap(diff => this.applyChanges(diff)),
          catchError(e => {
            console.error(e);
            return of(null);
          }),
          tap(this?._renderCallback)
        )
        .subscribe()
    );
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.viewContainerRef.clear();
  }

  private applyChanges(changes: IterableChanges<T>): Observable<any[]> {
    let detectParent = false;
    const behaviors$: Observable<any>[] = [];
    const strat = this.strategies[this.strategy];

    const insertMap = new Map<number, RxDefaultListViewContext<T, U>>();
    const scheduleInsert = (idx: number, ctx: RxDefaultListViewContext<T, U>) => {
      if (!insertMap.has(idx)) {
        insertMap.set(idx, ctx);
        const insert = new Subject<void>();
        const work = () => {
          try {
            const view = this.viewContainerRef.createEmbeddedView(
              this.templateRef,
              insertMap.get(idx),
              idx
            );
            strat.work(view);
          } catch (e) {
            // console.error(e);
            // console.error('destroyed', this.destroyed);
          }
        };
        this.sub.add(
          of(null)
            .pipe(strat.behavior(work, insertMap.get(idx)), take(1))
            .subscribe(insert)
        );
        behaviors$.push(insert);
      }
    };
    const updateMap = new WeakMap<
      EmbeddedViewRef<any>,
      ((context: RxDefaultListViewContext<T, U>) => void)[]
      >();
    const scheduleUpdate = (
      idx: number,
      update: (context: RxDefaultListViewContext<T, U>) => void
    ) => {
      const view = this.viewContainerRef.get(idx) as EmbeddedViewRef<any>;
      if (view) {
        if (updateMap.has(view)) {
          updateMap.get(view).push(update);
          // update(updateMap.get(view));
        } else {
          view.detach();
          updateMap.set(view, [update]);
          // detach the view so that the parent cd cycle does not render this view
          const work = () => {
            view.reattach();
            updateMap.get(view).forEach(u => u(view.context));
            strat.work(view);
          };
          behaviors$.push(
            of(null).pipe(strat.behavior(work, view), take(1))
          );
        }
      } else if (insertMap.has(idx)) {
        update(insertMap.get(idx));
      }
    };

    changes.forEachOperation(
      (
        r: IterableChangeRecord<T>,
        previousIndex: number | null,
        currentIndex: number | null
      ) => {
        const idx = currentIndex == null ? undefined : currentIndex;
        // insert
        if (r.previousIndex == null) {
          const context = new RxDefaultListViewContext(r.item);
          // console.log('scheduleInsert', idx);
          scheduleInsert(idx, context);
          // the view got inserted, so the parent has to get notified about this change
          detectParent = true;
        } else if (currentIndex == null) {
          // remove
          const i =
            previousIndex === null ? undefined : previousIndex;
          if (this.viewContainerRef.get(i)) {
            this.viewContainerRef.remove(i);
            // a view got removed, notify parent about the change
            detectParent = true;
          }
        } else if (previousIndex !== null) {
          // move
          const view = <EmbeddedViewRef<RxDefaultListViewContext<T, U>>>(
            this.viewContainerRef.get(previousIndex)
          );
          this.viewContainerRef.move(view, idx);
          const $implicit = r.item;
          scheduleUpdate(idx, ctx => {
            ctx.$implicit = $implicit;
          });
        }
      }
    );
    // if views only had identityChanges, update the $implict value
    changes.forEachIdentityChange((record: IterableChangeRecord<T>) => {
      const $implicit = record.item;
      scheduleUpdate(
        record.currentIndex,
        ctx => (ctx.$implicit = $implicit)
      );
    });
    // update view contexts (index, count, odd/even and stuff)
    const count = this.viewContainerRef.length + insertMap.size;
    for (const [index] of insertMap.entries()) {
      const even = index % 2 === 0;
      const newCtx = {
        index,
        count,
        first: index === 0,
        last: index === count - 1,
        even,
        odd: !even
      };
      scheduleUpdate(index, ctx => {
        ctx.updateContext(newCtx);
      });
    }
    for (let index = 0; index < this.viewContainerRef.length; index++) {
      const even = index % 2 === 0;
      const newCtx = {
        index,
        count,
        first: index === 0,
        last: index === count - 1,
        even,
        odd: !even
      };
      scheduleUpdate(index, ctx => {
        ctx.updateContext(newCtx);
      });
    }
    if (detectParent) {
      Promise.resolve().then(() => {
        this.strategyProvider.scheduleCD(this.cdRef, {
          afterCD: () => {
            // console.log('parent notified');
          },
          strategy: this.strategy,
          scope: (this.cdRef as any).context
        });
      });
    }
    return forkJoin(behaviors$);
  }

}
