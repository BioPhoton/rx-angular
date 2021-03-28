import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';

import { isObservable, Observable, of } from 'rxjs';
import { Hooks, RxNotificationKind } from '../../../cdk';
import { mapTo } from 'rxjs/operators';
import { RxState } from '@rx-angular/state';
import { observableToRxTemplateName } from '../../../cdk/utils/rxjs/operators/observable-to-rx-template-name';

@Component({
  // tslint:disable-next-line:directive-selector component-selector
  selector: '[rxContextContainer]',
  template: `
    <!-- Everything but content with selectors -->
    <ng-content></ng-content>
    <!-- Context information -->
    <ng-container [rxSwitch]="templateName$">
      <ng-content
        *rxSwitchCase="rxSuspenseTpl"
        select="[rxSuspense]"
      ></ng-content>
      <ng-content *rxSwitchCase="rxErrorTpl" select="[rxError]"></ng-content>
      <ng-content
        *rxSwitchCase="rxCompleteTpl"
        select="[rxComplete]"
      ></ng-content>
    </ng-container>
    <!-- Content After the context information -->
    <ng-content select="[rxAfterContext]"> </ng-content>
  `,
  providers: [RxState],
  changeDetection: ChangeDetectionStrategy.OnPush
})
// tslint:disable-next-line:directive-class-suffix
export class RxContextContainer<U> extends Hooks implements OnInit {
  @Input('rxContextContainer')
  set rxContextContainer(
    potentialObservable: Observable<U> | null | undefined
  ) {
    this.rxState.connect(
      'templateName',
      potentialObservable.pipe(observableToRxTemplateName())
    );
  }

  @Input('rxContextStrategy')
  set strategy(strategyName$: string | Observable<string> | undefined) {
    this.rxState.connect(
      'strategyName',
      isObservable(strategyName$) ? strategyName$ : of(strategyName$)
    );
  }

  @Input('completeTrg')
  set rxCompleteTrigger(complete$: Observable<any>) {
    this.rxState.connect(
      'templateName',
      complete$.pipe(mapTo(RxNotificationKind.complete))
    );
  }

  @Input('errorTrg')
  set rxErrorTrigger(error$: Observable<any>) {
    this.rxState.connect(
      'templateName',
      error$.pipe(mapTo(RxNotificationKind.error))
    );
  }

  @Input('suspenseTrg')
  set rxSuspenseTrigger(suspense$: Observable<any>) {
    this.rxState.connect(
      'templateName',
      suspense$.pipe(mapTo(RxNotificationKind.suspense))
    );
  }

  constructor(
    private strategyProvider: RxStrategyProvider,
    private readonly rxState: RxState<{
      templateName: RxNotificationKind;
      strategyName: string;
    }>
  ) {
    super();
  }

  readonly templateName$ = this.rxState.select('templateName');
  readonly strategyName$ = this.rxState.select('strategyName');
  readonly rxSuspenseTpl = RxNotificationKind.suspense;
  readonly rxErrorTpl = RxNotificationKind.error;
  readonly rxCompleteTpl = RxNotificationKind.complete;

  ngOnInit() {
    if (!this.rxState.get('templateName')) {
      this.rxState.set({ templateName: RxNotificationKind.suspense });
    }
  }
}

