import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, tap } from 'rxjs/operators';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';

@Component({
  selector: 'rxa-rx-query-children',
  template: `
    <rxa-visualizer>
      <div visualizerHeader>
        <rxa-strategy-select (strategyChange)="strategyProvider.primaryStrategy = $event">
        </rxa-strategy-select>
        <button mat-raised-button [unpatch] (click)="updateValue.next()">Toggle ViewChild</button>
      </div>
      <div class="row">
        <div class="col-6">
          <rxa-rx-query-content [value]="viewChildState$">
            <div class="test">
              <div #viewChild
                   rxaContentTest
                   *rxLetTriggered="viewChildState$; let v"
                   class="view-child w-100 border-danger">{{ v }}</div>
            </div>
          </rxa-rx-query-content>

        </div>
      </div>
    </rxa-visualizer>
  `,
  styles: [
    `
      .view-child {
        height: 250px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RxQueryChildrenComponent {

  @ViewChild('viewChild') viewChild: ElementRef<HTMLElement>;

  updateValue = new Subject();
  viewChildState$ = this.updateValue.pipe(
    map(() => this.i++),
    distinctUntilChanged(),
    // the query child is undefined here because the parent never detects changes
    tap(() => setTimeout(() => console.log(this.viewChild), 200)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private i = 0;

  constructor(
    public strategyProvider: RxStrategyProvider,
  ) { }

}
