import { ChangeDetectorRef, Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { RxNotificationKind } from '@rx-angular/cdk/notifications';
import { createTemplateManager, RxTemplateManager } from '@rx-angular/cdk/template-management';
import {  RxStrategyCredentials } from '@rx-angular/cdk/render-strategies';

import { isObservable, Observable, of, ReplaySubject, Subscription, Unsubscribable } from 'rxjs';
import { Hooks } from '../../../cdk/hooks/hooks';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';
import { RxContextTemplateNames, rxContextTemplateNames, RxContextViewContext } from './model';
import { distinctUntilChanged, filter, map, mapTo, startWith, switchMap, withLatestFrom } from 'rxjs/operators';
import { RxState } from '@rx-angular/state';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[rxContext]',
  providers: [RxState]
})
// tslint:disable-next-line:directive-class-suffix
export class RxContext<U> extends Hooks implements OnInit, OnDestroy {

  @Input()
  set rxContext(potentialObservable: Observable<U> | null | undefined) {
    // this.rxState.connect('templateName', potentialObservable.pipe(toTemplateName()));
  }

  @Input('rxContextStrategy')
  set strategy(strategyName$: string | Observable<string> | undefined) {
    this.rxState.connect('strategyName', isObservable(strategyName$) ? strategyName$ : of(strategyName$));
  }

  @Input('rxContextCompleteTpl')
  set rxComplete(templateRef: TemplateRef<RxContextViewContext<U | undefined | null> | null>) {
    this.templateManager.addTemplateRef(RxContextTemplateNames.complete, templateRef);
  }

  @Input('rxContextErrorTpl')
  set rxError(templateRef: TemplateRef<RxContextViewContext<U | undefined | null> | null>) {
    this.templateManager.addTemplateRef(RxContextTemplateNames.error, templateRef);
  }

  @Input('rxContextSuspenseTpl')
  set rxSuspense(templateRef: TemplateRef<RxContextViewContext<U | undefined | null> | null>) {
    this.templateManager.addTemplateRef(RxContextTemplateNames.suspense, templateRef);
  }

  @Input('rxContextCompleteTrg')
  set rxCompleteTrigger(complete$: Observable<any>) {
    this.rxState.connect('templateName', complete$.pipe(mapTo(RxNotificationKind.complete)));
  }

  @Input('rxContextErrorTrg')
  set rxErrorTrigger(error$: Observable<any>) {
    this.rxState.connect('templateName', error$.pipe(mapTo(RxNotificationKind.error)));
  }

  @Input('rxContextSuspenseTrg')
  set rxSuspenseTrigger(suspense$: Observable<any>) {
    this.rxState.connect('templateName', suspense$.pipe(mapTo(RxNotificationKind.suspense)));
  }

  constructor(
    private strategyProvider: RxStrategyProvider,
    public cdRef: ChangeDetectorRef,
    private readonly nextTemplateRef: TemplateRef<RxContextViewContext<U>>,
    private readonly viewContainerRef: ViewContainerRef,
    private readonly rxState: RxState<{
      templateName: RxNotificationKind,
      strategyName: string
    }>
  ) {
    super();
   /* this.templateManager = createTemplateManager(
      this.viewContainerRef,
      this.initialViewContext
    );*/

  }

  static ngTemplateGuard_rxContext: 'binding';

  strategy$: Observable<any/*RxStrategyCredentials*/> = this.rxState.select(
    // ngInputFlatten(),
    startWith(this.strategyProvider.primaryStrategy),
    // nameToStrategyCredentials(this.strategyProvider.strategies, this.strategyProvider.primaryStrategy)
  );

  observablesFromTemplate$ = new ReplaySubject<Observable<U>>(1);
  valuesFromTemplate$ = this.observablesFromTemplate$.pipe(
    distinctUntilChanged()
  );

  private subscription: Unsubscribable = Subscription.EMPTY;

  private readonly templateManager: RxTemplateManager<U, RxContextViewContext<U | undefined | null>, rxContextTemplateNames>;

  private readonly initialViewContext: RxContextViewContext<U> = {
    $implicit: undefined,
    $error: false,
    $complete: false,
    $suspense: false
  };

  /** @internal */
  static ngTemplateContextGuard<U>(
    dir: RxContext<U>,
    ctx: unknown | null | undefined
  ): ctx is RxContextViewContext<U> {
    return true;
  }

  ngOnInit() {
    this.templateManager.addTemplateRef(RxContextTemplateNames.content, this.nextTemplateRef);
    // this.templateManager.displayView(RxContextTemplateNames.content);

    if(!this.rxState.get('templateName')) {
      this.rxState.set({ templateName: RxNotificationKind.suspense });
    }

    /*this.rxState.hold(this.rxState.select(
      map(s => s.templateName),
      distinctUntilChanged(),
      withLatestFrom(this.strategy$),
      switchMap(([templateName, strategy]) => {
        return of(templateName).pipe(
          strategy.behavior(() => {
           /!* const name = this.templateManager.getTemplateName(templateName as any, RxContextTemplateNames.content);
            // this.templateManager.displayContextView(name);
            const view = this.templateManager.getEmbeddedView(name);*!/
           /!* if (view) {
              strategy.work(view, view);
            }*!/
            strategy.work(this.cdRef, (this.cdRef as any)?.context || this.cdRef);
          }, this)
        );
      })
      )
    );*/
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    // this.templateManager.destroy();
  }

}

function toTemplateName<T>() {
  /*return (o$: Observable<T>): Observable<RxNotificationKind> => o$.pipe(
    rxMaterialize(),
    filter(notification => notification.kind === RxNotificationKind.next),
    map(n => n.kind)
  );*/
}
