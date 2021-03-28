import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { NextObserver, Observable, ReplaySubject,
  Subject,
  Subscription,} from 'rxjs';
import { mergeAll } from 'rxjs/operators';
import { RxIfTemplateNames, rxIfTemplateNames, RxIfViewContext } from './model';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  coerceObservable,
  coerceAllFactory
} from '@rx-angular/cdk/coercing';
import { RxNotificationKind, createTemplateNotifier } from '@rx-angular/cdk/notifications';
import { createTemplateManager, RxTemplateManager } from '@rx-angular/cdk/template-management';
import {  RxStrategyProvider } from '@rx-angular/cdk/render-strategies';

@Directive({
  selector: '[rxIf]',
})
export class RxIf<U> implements OnInit, OnDestroy {
  private subscription = new Subscription();
  private _renderObserver: NextObserver<any>;
  private templateManager: RxTemplateManager<U,
    RxIfViewContext<U>,
    rxIfTemplateNames
    >;

  @Input()
  set rxIf(potentialObservable: Observable<U> | U | null | undefined) {
    this.observablesHandler.next(coerceObservable(potentialObservable));
  }

  @Input('rxIfStrategy')
  set strategy(strategyName: Observable<string> | string | null | undefined) {
    this.strategyHandler.next(strategyName);
  }

  @Input('rxIfElse')
  set else(templateRef: TemplateRef<any>) {
    if (templateRef) {
      this.templateManager.addTemplateRef(RxIfTemplateNames.else, templateRef);
    }
  }

  @Input('rxIfParent') renderParent: boolean;

  @Input('rxIfPatchZone') patchZone: boolean;

  @Input('rxIfRenderCallback')
  set renderCallback(callback: NextObserver<U>) {
    this._renderObserver = callback;
  }

  /** @internal */
  private observablesHandler = createTemplateNotifier<U>();
  private readonly strategyHandler = coerceAllFactory<string>(
    () => new ReplaySubject<string | Observable<string>>(1),
    mergeAll()
  );
  private readonly rendered$ = new Subject<void>();

  constructor(
    private strategyProvider: RxStrategyProvider,
    private cdRef: ChangeDetectorRef,
    private eRef: ElementRef<Comment>,
    private ngZone: NgZone,
    private readonly thenTemplateRef: TemplateRef<any>,
    private readonly viewContainerRef: ViewContainerRef
  ) {

  }

  ngOnInit() {
    this.templateManager = createTemplateManager<
      U,
      RxIfViewContext<U>,
      rxIfTemplateNames
      >({
      templateSettings: {
        viewContainerRef: this.viewContainerRef,
        createViewContext,
        updateViewContext,
        customContext: (rxIf) => ({ rxIf }),
        patchZone: this.patchZone ? this.ngZone : false,
      },
      renderSettings: {
        cdRef: this.cdRef,
        eRef: this.eRef,
        parent: coerceBooleanProperty(this.renderParent),
        patchZone: this.patchZone ? this.ngZone : false,
        defaultStrategyName: this.strategyProvider.primaryStrategy,
        strategies: this.strategyProvider.strategies,
      },
      notificationToTemplateName: {
        [RxNotificationKind.suspense]: () => RxIfTemplateNames.suspense,
        [RxNotificationKind.next]: (value, templates) => {
          return value ?
            RxIfTemplateNames.then as rxIfTemplateNames
            : templates.get(RxIfTemplateNames.else) ?
              RxIfTemplateNames.then
              : undefined
        },
        [RxNotificationKind.error]: () => RxIfTemplateNames.error,
        [RxNotificationKind.complete]: () => RxIfTemplateNames.complete
      }
    });
    this.templateManager.addTemplateRef(
      RxIfTemplateNames.then,
      this.thenTemplateRef
    );
    this.templateManager.nextStrategy(this.strategyHandler.values$);
    this.subscription.add(
      this.templateManager
        .render(this.observablesHandler.values$)
        .subscribe((n) => {
          this.rendered$.next(n);
          this._renderObserver?.next(n);
        })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}

function createViewContext<T>(value: T): RxIfViewContext<T> {
  return {
    rxIf: value,
    rxElse: false,
    $implicit: value,
    $error: false,
    $complete: false,
    $suspense: false,
  };
}

function updateViewContext<T>(
  value: T,
  view: EmbeddedViewRef<RxIfViewContext<T>>,
  context: RxIfViewContext<T>
): void {
  Object.keys(context).forEach((k) => {
    view.context[k] = context[k];
  });
}
