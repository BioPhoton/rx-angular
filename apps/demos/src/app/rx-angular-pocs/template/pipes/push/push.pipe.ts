import {
  ChangeDetectorRef,
  OnDestroy,
  OnInit,
  Pipe,
  PipeTransform,
} from '@angular/core';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';
import {
  NextObserver,
  Observable,
  ObservableInput,
  Subscription,
  Unsubscribable,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { createRenderAware, RenderAware } from '../../../cdk/render-aware/render-aware';
import { RxTemplateObserver } from '../../../cdk/utils/rxjs/Notification';

@Pipe({ name: 'push', pure: false })
export class PushPipe<U> implements PipeTransform, OnDestroy, OnInit {
  private renderedValue: U | null | undefined;

  private readonly renderAware: RenderAware<U | null | undefined>;
  private subscription: Unsubscribable;
  private renderCallbackSubscription: Unsubscribable = Subscription.EMPTY;

  private readonly templateObserver: RxTemplateObserver<
    U | null | undefined
  > = {
    suspense: () => (this.renderedValue = undefined),
    next: (value: U | null | undefined) => {
      this.renderedValue = value;
    },
  };

  constructor(
    private cdRef: ChangeDetectorRef,
    strategyProvider: RxStrategyProvider
  ) {
    this.renderAware = createRenderAware<U>({
      strategies: strategyProvider.strategies,
      defaultStrategyName: strategyProvider.primaryStrategy,
      templateObserver: this.templateObserver,
      getContext: () => (this.cdRef as any).context,
      getCdRef: () => this.cdRef,
    });
    this.renderAware.subscribe();
  }

  transform<T>(
    potentialObservable: null,
    config?: string | Observable<string>,
    renderCallback?: NextObserver<U>
  ): null;
  transform<T>(
    potentialObservable: undefined,
    config?: string | Observable<string>,
    renderCallback?: NextObserver<U>
  ): undefined;
  transform<T>(
    potentialObservable: ObservableInput<T>,
    config?: string | Observable<string>,
    renderCallback?: NextObserver<U>
  ): T;
  transform<T>(
    potentialObservable: ObservableInput<T> | null | undefined,
    strategyName: string | Observable<string> | undefined,
    renderCallback?: NextObserver<U>
  ): T | null | undefined {
    this.renderAware.nextStrategy(strategyName);
    this.renderAware.nextPotentialObservable(potentialObservable);
    this.subscribeRenderCallback(renderCallback);
    return this.renderedValue as any;
  }

  ngOnDestroy(): void {
    this.renderCallbackSubscription.unsubscribe();
    this.subscription?.unsubscribe();
  }

  private subscribeRenderCallback(renderCallback?: NextObserver<U>): void {
    if (renderCallback) {
      this.renderCallbackSubscription.unsubscribe();
      this.renderCallbackSubscription = this.renderAware.rendered$
        .pipe(map(({ value }) => value))
        .subscribe(renderCallback);
    }
  }

  ngOnInit(): void {
    this.subscription = this.renderAware.rendered$.subscribe();
  }
}
