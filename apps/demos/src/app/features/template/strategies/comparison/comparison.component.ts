import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';
import { map, tap } from 'rxjs/operators';

@Component({
  selector: 'rxa-concurrent-strategies',
  template: `
    <rxa-visualizer>
      <ng-container visualizerHeader>
        <h1 class="mat-headline">Strategy Comparison</h1>
        <div class="row">
          <div class="col-12 d-flex">
            <mat-form-field class="mr-2">
              <mat-label>Num Siblings</mat-label>
              <input *rxLet="count$; let count" matInput #i [unpatch] type="number" [value]="count"
                     (input)="count$.next(i.value)">
            </mat-form-field>
            <button mat-button unpatch (click)="filled$.next(!filled$.getValue())">
              do change
            </button>
          </div>
          <div class="col-12">
            <div class="w-100 strategy-multiselect">
              <mat-checkbox #c *rxFor="let strategy of strategies$; trackBy:trackByStrategyName"
                            [checked]="strategy.checked"
                            (change)="setStrategy(strategy.name, c.checked)">
                {{strategy.name}}
              </mat-checkbox>

            </div>
          </div>
        </div>
      </ng-container>
      <div class="row w-100">
        <ng-container
          *rxFor="let strategy of strategies$; strategy: 'immediate'; trackBy:trackByStrategyName">
          <div class="col d-flex flex-column"
               *rxIf="strategy.checked; strategy: 'immediate'">
            <h2 class="mat-subheader">{{strategy.name}}</h2>
            <rxa-sibling-strategy [strategy]="strategy.name" [count]="count$" [filled]="filled$"></rxa-sibling-strategy>
          </div>
        </ng-container>
      </div>
    </rxa-visualizer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .strategy-multiselect {
      display: flex;
      flex-wrap: wrap;
    }

    .strategy-multiselect .mat-checkbox {
      flex-grow: 1;
      width: 200px;
    }
  `]
})
export class ComparisonComponent {

  selectedStrategies$ = new BehaviorSubject<{ [strategy: string]: boolean }>(
    /*this.strategyProvider.strategyNames.reduce((selectedStrategies, strategy) => {
      selectedStrategies[strategy] = true;
      return selectedStrategies;
    }, {})*/{}
  );
  strategies$ = this.selectedStrategies$.pipe(
    map((selectedStrategies) => this.strategyProvider.strategyNames.map(strategy => ({name: strategy, checked: selectedStrategies[strategy] || false})))
  );
  count$ = new BehaviorSubject<string | number>('500');
  filled$ = new BehaviorSubject<boolean>(false);

  constructor(public strategyProvider: RxStrategyProvider) {
  }

  setStrategy(strategy, state) {
    const old = this.selectedStrategies$.getValue();
    this.selectedStrategies$.next({ ...old, [strategy]: state });
  }

  visible(choice: string) {
    return (o$: Observable<{ [name: string]: boolean }>) => o$.pipe(map((s) => s[choice] === true))
  }

  trackByStrategyName = (idx, v: {name: string}) => v.name

}
