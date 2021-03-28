import {
  ChangeDetectorRef,
  OnDestroy,
  Pipe,
  PipeTransform,
} from '@angular/core';
import {
  NextObserver,
  Observable,
  ObservableInput,
  Unsubscribable,
} from 'rxjs';
import { filter, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { RxStrategyProvider, createStrategyHandler } from '@rx-angular/cdk/render-strategies';
import { RxNotification, RxNotificationKind, createTemplateNotifier } from '@rx-angular/cdk/notifications';

/**
 * @Pipe PushPipe
 *
 * @description
 *
 * The `push` pipe serves as a drop-in replacement for the `async` pipe.
 * It contains intelligent handling of change detection to enable us
 * running in zone-full as well as zone-less mode without any changes to the code.
 *
 * The current way of binding an observable to the view looks like that:
 *  ```html
 *  {{observable$ | async}}
 * <ng-container *ngIf="observable$ | async as o">{{o}}</ng-container>
 * <component [value]="observable$ | async"></component>
 * ```
 *
 * The problem is `async` pipe just marks the component and all its ancestors as dirty.
 * It needs zone.js microtask queue to exhaust until `ApplicationRef.tick` is called to render all dirty marked
 *     components.
 *
 * Heavy dynamic and interactive UIs suffer from zones change detection a lot and can
 * lean to bad performance or even unusable applications, but the `async` pipe does not work in zone-less mode.
 *
 * `push` pipe solves that problem.
 *
 * Included Features:
 *  - Take observables or promises, retrieve their values and render the value to the template
 *  - Handling null and undefined values in a clean unified/structured way
 *  - Triggers change-detection differently if `zone.js` is present or not (`detectChanges` or `markForCheck`)
 *  - Distinct same values in a row to increase performance
 *  - Coalescing of change detection calls to boost performance
 *
 * @usageNotes
 *
 * `push` pipe solves that problem. It can be used like shown here:
 * ```html
 * {{observable$ | push}}
 * <ng-container *ngIf="observable$ | push as o">{{o}}</ng-container>
 * <component [value]="observable$ | push"></component>
 * ```
 *
 * @publicApi
 */
@Pipe({ name: 'push', pure: false })
export class PushPipe<U> implements PipeTransform, OnDestroy {
  /** @internal */
  private renderedValue: U | null | undefined;
  /** @internal */
  private readonly subscription: Unsubscribable;
  /** @internal */
  private readonly templateObserver = createTemplateNotifier<U>();
  /** @internal */
  private readonly strategyHandler = createStrategyHandler(
    this.strategyProvider.primaryStrategy,
    this.strategyProvider.strategies
  );

  constructor(
    private strategyProvider: RxStrategyProvider,
    private cdRef: ChangeDetectorRef
  ) {
    const scope = (cdRef as any).context;
    this.subscription = this.templateObserver.values$
      .pipe(
        filter<RxNotification<U>>(
          (n) =>
            n.kind === RxNotificationKind.suspense ||
            n.kind === RxNotificationKind.next
        ),
        tap<RxNotification<U>>((notification) => {
          this.renderedValue = notification.value as U;
        }),
        withLatestFrom(this.strategyHandler.strategy$),
        switchMap(([v, strategy]) =>
          this.strategyProvider.schedule(
            () => {
              strategy.work(cdRef, scope);
            },
            {
              scope,
              strategy: strategy.name,
              patchZone: this.strategyProvider.config.patchZone ? null : false,
            }
          )
        )
      )
      .subscribe();
  }

  transform(
    potentialObservable: null,
    config?: string | Observable<string>,
    renderCallback?: NextObserver<U>
  ): null;
  transform(
    potentialObservable: undefined,
    config?: string | Observable<string>,
    renderCallback?: NextObserver<U>
  ): undefined;
  transform(
    potentialObservable: ObservableInput<U>,
    config?: string | Observable<string>,
    renderCallback?: NextObserver<U>
  ): U;
  transform(
    potentialObservable: ObservableInput<U> | null | undefined,
    config: string | Observable<string> | undefined,
    renderCallback?: NextObserver<U>
  ): U | null | undefined {
    if (config) {
      this.strategyHandler.next(config);
    }
    this.templateObserver.next(potentialObservable);
    return this.renderedValue as U;
  }

  /** @internal */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
