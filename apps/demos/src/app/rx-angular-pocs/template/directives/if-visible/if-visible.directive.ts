import { Subscription } from 'rxjs';
import { filter, mergeAll } from 'rxjs/operators';
import {
  ChangeDetectorRef,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  Input,
  NgZone,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Hooks, intersectionObserver } from '../../../cdk';

import { RxNotificationKind } from '@rx-angular/cdk/notifications';
import { createTemplateManager, RxTemplateManager } from '@rx-angular/cdk/template-management';

import {
  RxIfVisibleTemplateNames,
  rxIfVisibleTemplateNames,
  RxIfVisibleViewContext,
} from './model';
import { RxEffects } from '../../../state/rx-effects';
import { coerceAllFactory } from '@rx-angular/cdk/coercing';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[ifVisible]',
  providers: [RxEffects],
})
export class IfVisibleDirective<U> extends Hooks implements OnInit {
  displayed = false;
  private observer = intersectionObserver();
  private subscription: Subscription = new Subscription();

  private strategyHandler = coerceAllFactory<string>(undefined, mergeAll());

  private templateManager: RxTemplateManager<
    U,
    RxIfVisibleViewContext<U>,
    rxIfVisibleTemplateNames
  >;
  @Input('rxIfParent') renderParent: boolean;

  @Input('rxIfPatchZone') patchZone: boolean;

  constructor(
    private rxEf: RxEffects,
    public templateRef: TemplateRef<any>,
    private strategyProvider: RxStrategyProvider,
    private cdRef: ChangeDetectorRef,
    private eRef: ElementRef<Comment>,
    private ngZone: NgZone,
    private readonly viewTemplateRef: TemplateRef<any>,
    private readonly viewContainerRef: ViewContainerRef
  ) {
    super();
  }

  ngOnInit() {
    this.templateManager = createTemplateManager<
      U,
      RxIfVisibleViewContext<U>,
      rxIfVisibleTemplateNames
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
        [RxNotificationKind.suspense]: () => RxIfVisibleTemplateNames.suspense,
        [RxNotificationKind.next]: () => RxIfVisibleTemplateNames.view,
        [RxNotificationKind.error]: () => RxIfVisibleTemplateNames.error,
        [RxNotificationKind.complete]: () => RxIfVisibleTemplateNames.complete,
      },
    });
    this.templateManager.addTemplateRef(
      RxIfVisibleTemplateNames.view,
      this.viewTemplateRef
    );
    this.templateManager.nextStrategy(this.strategyHandler.values$);
    this.subscription.add(
      this.templateManager
        .render(
          this.observer.entries$.pipe(
            filter((entry) => entry.isIntersecting && !this.displayed),
            this.rxEf.untilDestroy()
          )
        )
        .subscribe(() => {
          this.displayed = true;
          this.observer.unobserve(this.eRef.nativeElement.parentElement);
        })
    );
    this.onAfterViewInit$.subscribe(() => {
      this.observer.observe(this.eRef.nativeElement.parentElement);
    });
  }
}

function createViewContext<T>(value: T): RxIfVisibleViewContext<T> {
  return {
    rxIfVisible: value,
    $implicit: value,
    $error: false,
    $complete: false,
    $suspense: false,
  };
}

function updateViewContext<T>(
  value: T,
  view: EmbeddedViewRef<RxIfVisibleViewContext<T>>,
  context: RxIfVisibleViewContext<T>
): void {
  Object.keys(context).forEach((k) => {
    view.context[k] = context[k];
  });
}


