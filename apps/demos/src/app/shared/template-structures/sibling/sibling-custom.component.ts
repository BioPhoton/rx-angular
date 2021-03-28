import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';
import { BehaviorSubject } from 'rxjs';
import { toIntArray } from './utils';
import { map } from 'rxjs/operators';

const chunk = (arr, n) => arr.length ? [arr.slice(0, n), ...chunk(arr.slice(n), n)] : [];

@Component({
  selector: 'rxa-sibling-custom',
  template: `
    <rxa-visualizer>
      <div visualizerHeader>
        <h3>{{siblings.length}} Siblings Custom Strategy</h3>
        <rxa-strategy-select (strategyChange)="strategyChange$.next($event)"></rxa-strategy-select>
        <button mat-button [unpatch] (click)="filled$.next(num)">DoChange</button>
      </div>
      <div class="w-100 siblings">
        <div class="sibling" *rxFor="let sibling of siblings$; trackBy:trackBy">
          <rxa-work [load]="sibling"></rxa-work>
        </div>
      </div>
    </rxa-visualizer>
  `,
  host: {
    class: 'd-flex w-100'
  },
  styleUrls: ['./sibling.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiblingCustomComponent {

  num = 0;
  siblings = [];
  filled$ = new BehaviorSubject<number>(this.num);
  strategyChange$ = new BehaviorSubject<string>(this.strategyProvider.primaryStrategy);
  siblings$ = this.filled$.pipe(
    map(num =>  toIntArray(num))
  )

  @Input()
  set count(num: number) {
    this.num = num;
    this.filled$.next(num);
  };

  @Input()
  value: any;

  @Input()
  set strategy(strategy: string) {
    this.strategyChange$.next(strategy)
  };

  trackBy = i => i;

  constructor(
    private strategyProvider: RxStrategyProvider
  ) {

  }

}

