import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Input,
} from '@angular/core';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';
import { Observable, Subject } from 'rxjs';
import { toBooleanArray } from './utils';
import { RxState } from '@rx-angular/state';
import { map } from 'rxjs/operators';

const chunk = (arr, n) =>
  arr.length ? [arr.slice(0, n), ...chunk(arr.slice(n), n)] : [];

@Component({
  selector: 'rxa-sibling-strategy',
  template: `
    <h3>{{ siblings.length }} Siblings</h3>
    <div class="d-flex flex-wrap">
      <div
        class="sibling"
        *rxFor="
          let item of siblings$;
          strategy: strategy$;
          trackBy: trackBy;
          renderCallback: rendered$
        "
      >
        <div [ngStyle]="{ background: item.color }"></div>
      </div>
    </div>
  `,
  host: {
    class: 'd-flex flex-column w-100',
  },
  styleUrls: ['./sibling.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiblingStrategyComponent extends RxState<{
  siblings: { filled: boolean; id: number; color: string }[];
  strategy: string;
  filled: boolean;
}> {
  filled$ = this.select('filled')
    .pipe
    //map(() => toBoolean(toRandom()))
    ();
  state$ = this.select();
  siblings$ = this.select('siblings');
  siblings = [];

  strategy$ = this.select('strategy');

  readonly rendered$ = new Subject<any>();

  @Input()
  set count(num$: Observable<number | string>) {
    this.connect(
      'siblings',
      num$.pipe(
        map((num) => {
          this.siblings = toBooleanArray(
            parseInt(num as any, 10)
          ).map((filled, id) => ({
            color: this.color(Math.random()),
            filled,
            id,
          }));
          return this.siblings;
        })
      )
    );
  }

  @Input()
  set filled(filled$: Observable<boolean>) {
    this.connect('filled', filled$);
  }

  @Input()
  value: any;

  @Input()
  set strategy(strategy: string) {
    this.set({ strategy });
  }

  trackBy = (idx: number, i: { id: number }) => i.id;

  color(a: number) {
    return '#' + Math.floor(a * 16777215).toString(16);
  }

  constructor(
    private strategyProvider: RxStrategyProvider
  ) {
    super();
    this.set({
      strategy: strategyProvider.primaryStrategy,
      filled: true,
    });
  }
}
