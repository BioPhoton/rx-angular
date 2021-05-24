import {
  ChangeDetectorRef,
  NgZone,
  OnDestroy,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { asyncScheduler } from '@rx-angular/cdk/zone-less';
import {
  strategyHandling,
  RxStrategyProvider,
  templateNotifier,
  RxNotificationKind,
  RxStrategyNames,
} from '@rx-angular/cdk';
import {
  NextObserver,
  Observable,
  ObservableInput,
  Unsubscribable,
} from 'rxjs';
import { delay, filter, switchMap, tap, withLatestFrom } from 'rxjs/operators';

/**
 * @Pipe PushPipe
 *
 * @description
 *
 * The push pipe serves as a drop-in replacement for angulars built-in async pipe.
 * Just like the *rxLet Directive, it leverages a
 * [RenderStrategy](https://github.com/rx-angular/rx-angular/blob/master/libs/cdk/docs/render-strategies/README.md) under the hood which takes care of optimizing the ChangeDetection of your
 * component.
 * The rendering behavior can be configured per PushPipe instance using either a strategy name or provide a
 * `RxComponentInput` config.
 *
 * Usage in the template
 *
 * ```html
 * <hero-search [term]="searchTerm$ | push"> </hero-search>
 * <hero-list-component [heroes]="heroes$ | push"> </hero-list-component>
 * ```
 *
 * Using different strategies
 *
 * ```html
 * <hero-search [term]="searchTerm$ | push: 'immediate'"> </hero-search>
 * <hero-list-component [heroes]="heroes$ | push: 'normal'"> </hero-list-component>
 * ```
 *
 * Provide a config object
 *
 * ```html
 * <hero-search [term]="searchTerm$ | push: { strategy: 'immediate' }"> </hero-search>
 * <hero-list-component [heroes]="heroes$ | push: { strategy: 'normal' }"> </hero-list-component>
 * ```
 *
 * Other Features:
 *
 * - lazy rendering (see
 *  [LetDirective](https://github.com/rx-angular/rx-angular/tree/master/libs/template/docs/api/let-directive.md))
 * - Take observables or promises, retrieve their values and render the value to the template
 * - a unified/structured way of handling null, undefined or error
 * - distinct same values in a row skip not needed re-renderings
 *
 * @usageNotes
 *
 * ```html
 * {{observable$ | push}}
 * <ng-container *ngIf="observable$ | push as o">{{o}}</ng-container>
 * <component [value]="observable$ | push"></component>
 * ```
 *
 * @publicApi
 */
@Pipe({ name: 'push', pure: false })
export class PushPipe<S extends string = string>
  implements PipeTransform, OnDestroy {
  /**
   * @internal
   * This is typed as `any` because the type cannot be inferred
   * without a class-level generic argument, which was removed to
   * fix https://github.com/rx-angular/rx-angular/pull/684
   */
  private renderedValue: any | null | undefined;
  /** @internal */
  private readonly subscription: Unsubscribable;
  /** @internal */
  private readonly templateObserver = templateNotifier<any>();
  /** @internal */
  private readonly strategyHandler = strategyHandling(
    this.strategyProvider.primaryStrategy,
    this.strategyProvider.strategies
  );
  /** @internal */
  private patchZone: false | NgZone;
  /** @internal */
  private _renderCallback: NextObserver<any>;

  constructor(
    private strategyProvider: RxStrategyProvider,
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {
    this.subscription = this.handleChangeDetection();
  }

  transform<U>(
    potentialObservable: null,
    config?: RxStrategyNames<S> | Observable<RxStrategyNames<S>>,
    renderCallback?: NextObserver<U>
  ): null;
  transform<U>(
    potentialObservable: undefined,
    config?: RxStrategyNames<S> | Observable<RxStrategyNames<S>>,
    renderCallback?: NextObserver<U>
  ): undefined;
  transform<U>(
    potentialObservable: ObservableInput<U>,
    config?: RxStrategyNames<S> | Observable<RxStrategyNames<S>>,
    renderCallback?: NextObserver<U>
  ): U;
  transform<U>(
    potentialObservable: ObservableInput<U>,
    config?: PushInput<U, S>
  ): U;
  transform<U>(
    potentialObservable: ObservableInput<U> | null | undefined,
    config:
      | PushInput<U, S>
      | RxStrategyNames<S>
      | Observable<RxStrategyNames<S>>
      | undefined,
    renderCallback?: NextObserver<U>
  ): U | null | undefined {
    this._renderCallback = renderCallback;
    if (config) {
      if (isRxComponentInput(config)) {
        this.strategyHandler.next(config.strategy as string);
        this._renderCallback = config.renderCallback;
        // set fallback if patchZone is not set
        this.setPatchZone(config.patchZone);
      } else {
        this.strategyHandler.next(config as string);
      }
    }
    this.templateObserver.next(potentialObservable);
    return this.renderedValue as U;
  }

  /** @internal */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /** @internal */
  private setPatchZone(patch?: boolean): void {
    const doPatch =
      patch == null ? this.strategyProvider.config.patchZone : patch;
    this.patchZone = doPatch ? this.ngZone : false;
  }

  /** @internal */
  private handleChangeDetection(): Unsubscribable {
    const scope = (this.cdRef as any).context;
    return this.templateObserver.values$
      .pipe(
        filter(
          (n) =>
            n.kind === RxNotificationKind.suspense ||
            n.kind === RxNotificationKind.next
        ),
        tap((notification) => {
          this.renderedValue = notification.value;
        }),
        withLatestFrom(this.strategyHandler.strategy$),
        switchMap(([notification, strategy]) =>
          this.strategyProvider
            .schedule(
              () => {
                strategy.work(this.cdRef, scope);
              },
              {
                scope,
                strategy: strategy.name,
                patchZone: this.patchZone,
              }
            )
            .pipe(
              delay(0, asyncScheduler),
              tap(() => this._renderCallback?.next(notification.value))
            )
        )
      )
      .subscribe();
  }
}

interface PushInput<T, S> {
  strategy?: RxStrategyNames<S> | Observable<RxStrategyNames<S>>;
  renderCallback?: NextObserver<T>;
  patchZone?: boolean;
}

// https://eslint.org/docs/rules/no-prototype-builtins
const hasOwnProperty = Object.prototype.hasOwnProperty;

function isRxComponentInput<U, S>(value: any): value is PushInput<U, S> {
  return (
    value != null &&
    (hasOwnProperty.call(value, 'strategy') ||
      hasOwnProperty.call(value, 'renderCallback') ||
      hasOwnProperty.call(value, 'patchZone'))
  );
}
