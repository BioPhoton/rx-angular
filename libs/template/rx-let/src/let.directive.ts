import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';

import { coerceAllFactory } from '@rx-angular/cdk/coercing';

import {
  defer,
  NextObserver,
  Observable,
  ObservableInput,
  ReplaySubject,
  Subject,
  Subscription,
} from 'rxjs';
import { mergeAll } from 'rxjs/operators';
import {
  createTemplateManager,
  RxBaseTemplateNames,
  RxTemplateManager,
  RxViewContext
} from '@rx-angular/cdk/template-management';
import { RxStrategyNames, RxStrategyProvider } from '@rx-angular/cdk/render-strategies';
import { RxNotificationKind, createTemplateNotifier, RxNotification } from '@rx-angular/cdk/notifications';

/** @internal */
type rxLetTemplateNames = 'nextTpl' | RxBaseTemplateNames;

/** @internal */
const RxLetTemplateNames = {
  ...RxBaseTemplateNames,
  next: 'nextTpl',
} as const;

/** @internal */
export interface RxLetViewContext<T> extends RxViewContext<T> {
  // to enable `as` syntax we have to assign the directives selector (var as v)
  rxLet: T;
}

/**
 * @Directive LetDirective
 *
 * @description
 *
 * The `*rxLet` directive serves a convenient way of binding observables to a view context. Furthermore, it helps
 * you structure view-related models into view context scope (DOM element's scope).
 *
 * Under the hood, it leverages a `RenderStrategy` which in turn takes care of optimizing the change detection
 * of your component or embedded view. The `LetDirective` will render its template and manage change detection after it
 *   got an initial value. So if the incoming `Observable` emits its value lazily (e.g. data coming from `Http`), your
 *   template will be rendered lazily as well. This can very positively impact the initial render performance of your
 *   application.
 *
 *
 * ### Problems with `async` and `*ngIf`
 *
 * In Angular, a way of binding an observable to the view could look like that:
 * ```html
 * <ng-container *ngIf="observableNumber$ | async as n">
 *   <app-number [number]="n"></app-number>
 *   <app-number-special [number]="n"></app-number-special>
 * </ng-container>
 * ```
 *
 * The problem is that `*ngIf` interferes with rendering and in case of a `0` (a falsy value) the component
 * would be hidden. This issue doesn't concern the `LetDirective`.
 *
 * The `AsyncPipe` relies on the Zone to be present - it doesn't really trigger change detection by itself.
 * It marks the component and its children as dirty waiting for the Zone to trigger change detection. So, in case
 * you want to create a zone-less application, the `AsyncPipe` won't work as desired. `LetDirective` comes
 * with its own strategies to manage change detection every time a new notification is sent from
 * the bound Observable.
 *
 *
 * ### Features of `*rxLet`
 *
 * Included features for `*rxLet`:
 * - binding is always present. (see "Problems with `async` and `*ngIf`" section below)
 * - it takes away the multiple usages of the `async` or `push` pipe
 * - a unified/structured way of handling null and undefined
 * - triggers change-detection differently if `zone.js` is present or not (`ChangeDetectorRef.detectChanges` or
 *   `ChangeDetectorRef.markForCheck`)
 * - triggers change-detection differently if ViewEngine or Ivy is present (`ChangeDetectorRef.detectChanges` or
 *   `ɵdetectChanges`)
 * - distinct same values in a row (`distinctUntilChanged` operator),
 * - display custom templates for different observable notifications (rxSuspense, rxNext, rxError, rxComplete)
 * - notify about after changes got rendered to the template (RenderCallback)
 *
 *
 * ### Binding an Observable and using the view context
 *
 * The `*rxLet` directive takes over several things and makes it more convenient and save to work with streams in the
 * template:
 *
 * ```html
 * <ng-container *rxLet="observableNumber$; let n">
 *   <app-number [number]="n"></app-number>
 * </ng-container>
 *
 * <ng-container *rxLet="observableNumber$ as n">
 *   <app-number [number]="n"></app-number>
 * </ng-container>
 * ```
 *
 * In addition to that it provides us information from the whole observable context.
 * We can track the observables:
 * - next value
 * - error occurrence
 * - complete occurrence
 *
 * ```html
 * <ng-container *rxLet="observableNumber$; let n; let e = $rxError, let c = $rxComplete">
 *   <app-number [number]="n" *ngIf="!e && !c"></app-number>
 *   <ng-container *ngIf="e">
 *     There is an error: {{ e }}
 *   </ng-container>
 *   <ng-container *ngIf="c">
 *     Observable completed: {{ c }}
 *   </ng-container>
 * </ng-container>
 * ```
 *
 *
 * ### Using the template-binding
 *
 * You can also use template anchors and display template's content for different observable states:
 * - on complete
 * - on error
 * - on suspense - before the first value is emitted
 *
 * ```html
 * <ng-container
 *   *rxLet="
 *     observableNumber$;
 *     let n;
 *     rxError: error;
 *     rxComplete: complete;
 *     rxSuspense: suspense;
 *   "
 * >
 *   <app-number [number]="n"></app-number>
 * </ng-container>
 * <ng-template #error>ERROR</ng-template>
 * <ng-template #complete>COMPLETE</ng-template>
 * <ng-template #suspense>SUSPENSE</ng-template>
 * ```
 *
 * Internally, `*rxLet` is using a simple "view memoization" - it caches all anchored template references and re-uses
 * them whenever the observable notification (next/error/complete) is sent. Then, it only updates the context
 * (e.g. a value from the observable) in the view.
 *
 *
 * @docsCategory LetDirective
 * @docsPage LetDirective
 * @publicApi
 */
@Directive({
  selector: '[rxLet]',
  providers: [],
})
export class LetDirective<U> implements OnInit, OnDestroy, OnChanges {
  static ngTemplateGuard_rxLet: 'binding';

  /**
   * @description
   * The Observable to be bound to the context of a template.
   *
   * @example
   * <ng-container *rxLet="hero$; let hero">
   *   <app-hero [hero]="hero"></app-hero>
   * </ng-container>
   *
   * @param potentialObservable
   */
  @Input()
  set rxLet(potentialObservable: ObservableInput<U> | null | undefined) {
    this.observablesHandler.next(potentialObservable);
  }

  /**
   * @description
   * The rendering strategy to be used when rendering with the reactive context within a template.
   * Use it to dynamically manage your rendering strategy. You can switch the strategies
   * imperatively (with a string) or by bounding an Observable.
   * The default strategy is `'local'`.
   *
   * @example
   * \@Component({
   *   selector: 'app-root',
   *   template: `
   *     <ng-container *rxLet="hero$; let hero; strategy: strategy">
   *       <app-hero [hero]="hero"></app-hero>
   *     </ng-container>
   *   `
   * })
   * export class AppComponent {
   *   strategy = 'local';
   * }
   *
   * // OR
   *
   * \@Component({
   *   selector: 'app-root',
   *   template: `
   *     <ng-container *rxLet="hero$; let hero; strategy: strategy$">
   *       <app-hero [hero]="hero"></app-hero>
   *     </ng-container>
   *   `
   * })
   * export class AppComponent {
   *   strategy$ = new BehaviorSubject('local');
   * }
   *
   * @param strategy
   * @see {@link strategies}
   */
  @Input('rxLetStrategy')
  set strategy(strategyName: string | Observable<string> | undefined) {
    this.strategyHandler.next(strategyName);
  }

  /**
   * @description
   * A template to show if the bound Observable is in "complete" state.
   *
   * @example
   * <ng-container *rxLet="hero$; let hero; completeTpl: completeTemplate">
   *   <app-hero [hero]="hero"></app-hero>
   * </ng-container>
   * <ng-template #completeTemplate>
   *   <mat-icon>thumb_up</mat-icon>
   * </ng-template>
   *
   * @param templateRef
   */
  @Input('rxLetRxComplete') // TODO: rename: rxLetCompleteTpl
  rxComplete: TemplateRef<RxLetViewContext<U | undefined | null> | null>;

  /**
   * @description
   * A template to show if the bound Observable is in "error" state.
   *
   * @example
   * <ng-container *rxLet="hero$; let hero; errorTpl: errorTemplate">
   *   <app-hero [hero]="hero"></app-hero>
   * </ng-container>
   * <ng-template #errorTemplate>
   *   <mat-icon>thumb_down</mat-icon>
   * </ng-template>
   *
   * @param templateRef
   */
  @Input('rxLetRxError') // TODO: rename: rxLetErrorTpl
  rxError: TemplateRef<RxLetViewContext<U | undefined | null> | null>;

  /**
   * @description
   * A template to show before the first value is emitted from the bound Observable.
   *
   * @example
   * <ng-container *rxLet="hero$; let hero; suspenseTpl: suspenseTemplate">
   *   <app-hero [hero]="hero"></app-hero>
   * </ng-container>
   * <ng-template #suspenseTemplate>
   *   <mat-progress-spinner></mat-progress-spinner>
   * </ng-template>
   *
   * @param templateRef
   */
  @Input('rxLetRxSuspense') // TODO: rename: rxLetSuspenseTpl
  rxSuspense: TemplateRef<RxLetViewContext<U | undefined | null> | null>;

  @Input('rxLetRenderCallback')
  set renderCallback(callback: NextObserver<U>) {
    this._renderObserver = callback;
  }

  @Input('rxLetParent') renderParent = true;

  @Input('rxLetPatchZone') patchZone = this.strategyProvider.config.patchZone;

  // TODO: enable when tested and documented properly
  /* @Input('rxLetShowComplete')
   set showComplete(trigger$: Observable<any>) {
   this.triggerHandler.next(
   trigger$.pipe(mapTo(toRxCompleteNotification() as any))
   );
   }

   @Input('rxLetShowError')
   set showError(error$: Observable<any>) {
   this.triggerHandler.next(error$.pipe(map(toRxErrorNotification as any)));
   }

   @Input('rxLetShowSuspense')
   set showSuspense(trigger$: Observable<any>) {
   this.triggerHandler.next(
   trigger$.pipe(map(toRxSuspenseNotification as any))
   );
   }*/

  constructor(
    private strategyProvider: RxStrategyProvider,
    public cdRef: ChangeDetectorRef,
    public eRef: ElementRef,
    private ngZone: NgZone,
    private readonly nextTemplateRef: TemplateRef<RxLetViewContext<U>>,
    private readonly viewContainerRef: ViewContainerRef
  ) {}

  /** @internal */
  private observablesHandler = createTemplateNotifier<U>(() => !!this.rxSuspense);
  /** @internal */
  private strategyHandler = coerceAllFactory<string>(
    () => new ReplaySubject<RxStrategyNames<string>>(1)
  );
  /** @internal */
  private triggerHandler = coerceAllFactory<RxNotification<unknown>>(
    () => new Subject(),
    mergeAll()
  );

  /** @internal */
  private _renderObserver: NextObserver<any>;

  /** @internal */
  private subscription: Subscription = new Subscription();

  /** @internal */
  private templateManager: RxTemplateManager<
    U,
    RxLetViewContext<U | undefined | null>,
    rxLetTemplateNames
  >;

  /** @internal */
  private rendered$ = new Subject<void>();

  @Output() readonly rendered = defer(() => this.rendered$.pipe());

  /** @internal */
  static ngTemplateContextGuard<U>(
    dir: LetDirective<U>,
    ctx: unknown | null | undefined
  ): ctx is RxLetViewContext<U> {
    return true;
  }

  /** @internal */
  ngOnInit() {
    this.subscription.add(
      this.templateManager
        .render(this.observablesHandler.values$)
        .subscribe((n) => {
          this.rendered$.next(n);
          this._renderObserver?.next(n);
        })
    );
  }

  /** @internal */
  ngOnChanges(changes: SimpleChanges) {
    if (!this.templateManager) {
      this._createTemplateManager();
    }

    if (changes.rxComplete) {
      this.templateManager.addTemplateRef(
        RxLetTemplateNames.complete,
        this.rxComplete
      );
    }

    if (changes.rxSuspense) {
      this.templateManager.addTemplateRef(
        RxLetTemplateNames.suspense,
        this.rxSuspense
      );
    }

    if (changes.rxError) {
      this.templateManager.addTemplateRef(
        RxLetTemplateNames.error,
        this.rxError
      );
    }
  }

  /** @internal */
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /** @internal */
  private _createTemplateManager(): void {
    this.templateManager = createTemplateManager<
      U,
      RxLetViewContext<U>,
      rxLetTemplateNames
    >({
      templateSettings: {
        viewContainerRef: this.viewContainerRef,
        createViewContext,
        updateViewContext,
        customContext: (rxLet) => ({ rxLet }),
        patchZone: this.patchZone ? this.ngZone : false,
      },
      renderSettings: {
        cdRef: this.cdRef,
        eRef: this.eRef,
        parent: !!this.renderParent,
        patchZone: this.patchZone ? this.ngZone : false,
        defaultStrategyName: this.strategyProvider.primaryStrategy,
        strategies: this.strategyProvider.strategies,
      },
      notificationToTemplateName: {
        [RxNotificationKind.suspense]: () =>
          this.rxSuspense
            ? RxLetTemplateNames.suspense
            : RxLetTemplateNames.next,
        [RxNotificationKind.next]: () => RxLetTemplateNames.next,
        [RxNotificationKind.error]: () =>
          this.rxError ? RxLetTemplateNames.error : RxLetTemplateNames.next,
        [RxNotificationKind.complete]: () =>
          this.rxComplete
            ? RxLetTemplateNames.complete
            : RxLetTemplateNames.next,
      },
      templateTrigger$: this.triggerHandler.values$,
    });

    this.templateManager.addTemplateRef(
      RxLetTemplateNames.next,
      this.nextTemplateRef
    );
    this.templateManager.nextStrategy(this.strategyHandler.values$);
  }
}
/** @internal */
function createViewContext<T>(value: T): RxLetViewContext<T> {
  return {
    rxLet: value,
    $implicit: value,
    $error: false,
    $complete: false,
    $suspense: false,
  };
}
/** @internal */
function updateViewContext<T>(
  value: T,
  view: EmbeddedViewRef<RxLetViewContext<T>>,
  context: RxLetViewContext<T>
): void {
  Object.keys(context).forEach((k) => {
    view.context[k] = context[k];
  });
}
