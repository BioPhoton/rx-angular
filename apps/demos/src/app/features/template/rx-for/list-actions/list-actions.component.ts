import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { asyncScheduler } from '@rx-angular/cdk/zone-less';
import { BehaviorSubject, defer, merge, scheduled, Subject } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  ArrayProviderService,
  removeItemsImmutable,
  shuffleItemsImmutable,
  TestItem,
} from '../../../../shared/debug-helper/value-provider';
import { ArrayProviderComponent } from '../../../../shared/debug-helper/value-provider/array-provider/array-provider.component';
import { RxState } from '@rx-angular/state';
import { Hooks } from '../../../../shared/debug-helper/hooks';
import { map, startWith, switchMap, switchMapTo, tap } from 'rxjs/operators';

let itemIdx = 0;

function getNewItem(): TestItem {
  const _idx = itemIdx;
  const i = { id: _idx, value: (itemIdx + 1) * 10 };
  ++itemIdx;
  return i;
}

function getItems(num: number) {
  return new Array(num).fill(null).map((_) => getNewItem());
}

const item0 = getNewItem();
const item1 = getNewItem();
const item2 = getNewItem();
const item3 = getNewItem();
const item4 = getNewItem();
const item5 = getNewItem();
const item6 = getNewItem();
const item7 = getNewItem();
const item8 = getNewItem();
const item9 = getNewItem();
const item10 = getNewItem();
const items10 = [
  item0,
  item1,
  item2,
  item3,
  item4,
  item5,
  item6,
  item7,
  item8,
  item9,
  item10,
];
const items5 = getItems(500);
const items5k = getItems(10);
const firstItems5k = items5k[0];
const lastItems5k = items5k[249];
const items5kSwapped = [...items5k];
items5kSwapped[0] = lastItems5k;
items5kSwapped[249] = firstItems5k;

/*const customChangeSet = [
  [],
  // insert 0,1,2,3,4
  [item0, item1, item2, item3, ...items5],
  // unchanged 0, remove 1, update 2 => 2232, move 3,2
  [item0, item3, { ...item2, value: '2232' }, ...items5],
  [item0, item3, { ...item2, value: '2232' }],
  [],
  // insert 0,1,2,3,4
  [item0, item3, { ...item2, value: '2232' }, ...items5],
  // unchanged 0, remove 1, update 2 => 2232, move 3,2
  [item0, item1, item2, item3, ...items5],
  [item0, item3, { ...item2, value: '2232' }],
  [],
  // insert 0,1,2,3,4
  [item0, ...items5, item1, item2, item3],
  // unchanged 0, remove 1, update 2 => 2232, move 3,2
  [item0, item3, { ...item2, value: '2232' }, ...items5],
  [item0, item3, { ...item2, value: '2232' }],
];*/

/*
 [141, 8191, 8970]
 [8191, 141, 8970]
 [8191, 8970, 141]
 [141, 8970, 8191]
 */
// const items5k
const items5k2 = shuffleItemsImmutable(items5k);
const items5k3 = shuffleItemsImmutable(items5k2);
const items5k4 = shuffleItemsImmutable(items5k3);
const items5k5 = removeItemsImmutable(items5k4, 5);
// const items5k6 = removeItemsImmutable(items5k5, 10);
const customChangeSet = [
  // [],
  [
    item0,
    item1,
    item2,
    item3,
    item4,
    // item5, item6, item7,item8, item9
  ],
  [
    item0,
    item4,
    item2,
    item3,
    item1,
    // item5, item1, item2, item8, item0
  ] /*
  [
    item2, item4, item0, item3, item1,
    // item7, item1, item2, item4, item0
  ],*/,
  [
    item0,
    item1,
    // item5, item6, item7,item8, item9
  ],
  /*[],
  [...items5k],
  [],*/
  // [item0, item1, item3, item4],
  // [item0, item1, item2, item3, item4],
  // [item2, item1, item3, item4, item0],
];

const moveChangeSet1 = [items5k];

@Component({
  selector: 'rxa-rx-for-list-actions',
  template: `
    <rxa-visualizer>
      <div visualizerHeader class="row">
        <div class="col-sm-12">
          <h2>Reactive Iterable Differ</h2>
          <rxa-array-provider
            [unpatched]=""
            [buttons]="true"
            #arrayP="rxaArrayProvider"
          ></rxa-array-provider>
          <rxa-strategy-select
            (strategyChange)="strategy$.next($event)"
          ></rxa-strategy-select>
          <mat-button-toggle-group
            name="visibleExamples"
            *rxLet="view; let viewMode"
            aria-label="Visible Examples"
            [value]="viewMode"
            #group="matButtonToggleGroup"
          >
            <mat-button-toggle value="tile" (click)="view.next('tile')"
              >Tile
            </mat-button-toggle>
            <mat-button-toggle value="list" (click)="view.next('list')"
              >List
            </mat-button-toggle>
          </mat-button-toggle-group>
          <button mat-raised-button (click)="triggerChangeSet.next()">
            ChangeSet
          </button>
          <button mat-raised-button (click)="triggerMoveSet.next()">
            MoveSet
          </button>
          <button mat-raised-button (click)="triggerMoveSetSwapped.next()">
            MoveSet Swapped
          </button>
          <p *rxLet="rendered$; let rendered">
            <strong>Rendered</strong> {{ rendered }}
          </p>
          <p *rxLet="viewBroken$; let viewBroken">
            <ng-container>
              <span [ngStyle]="{ color: viewBroken ? 'red' : 'green' }"
                >VIEW BROKEN {{ viewBroken }}</span
              >
            </ng-container>
          </p>
        </div>
      </div>
      <div class="d-flex flex-column justify-content-start w-100">
        <div
          class="work-container d-flex flex-wrap w-100"
          [class.list-view]="viewMode === 'list'"
          *rxLet="view; let viewMode"
        >
          <div
            #workChild
            class="work-child d-flex"
            *rxFor="
              let a of data$;
              let index = index;
              let count = count;
              let even = even;
              let odd = odd;
              let first = first;
              let last = last;
              renderCallback: renderCallback;
              trackBy: trackById;
              strategy: strategy$
            "
            [title]="a.id + '_' + index + '_' + count"
            [class.even]="even"
          >
            <div class="child-bg" [ngStyle]="{ background: color(a) }"></div>
            <!--<div class="child-bg" [class.even]="even"></div>-->
            <div class="child-context flex-column flex-wrap">
              <button (click)="clickMe()">click me</button>
              <!--<small>{{ a }}</small>-->
              <small>id: {{ a.id }}</small>
              <small>value: {{ a.value }}</small>
              <small>index: {{ index }}</small>
              <small>count: {{ count }}</small>
              <small>even: {{ even }}</small>
              <small>odd: {{ odd }}</small>
              <small>first: {{ first }}</small>
              <small>last: {{ last }}</small>
            </div>
          </div>
        </div>
      </div>
    </rxa-visualizer>
  `,
  changeDetection: environment.changeDetection,
  encapsulation: ViewEncapsulation.None,
  providers: [ArrayProviderService],
  styles: [
    `
      .work-container.list-view {
        flex-direction: column;
      }

      .work-container.list-view .work-child {
        width: 100%;
        height: 65px;
        margin: 0.5rem 0;
        background-color: transparent !important;
      }

      .child-context {
        display: none;
      }

      .work-container.list-view .work-child .child-context {
        display: flex;
      }

      .work-container.list-view .work-child .child-bg {
        margin-right: 0.5rem;
        width: 50px;
        position: relative;
      }

      .work-child {
        position: relative;
        width: 10px;
        height: 10px;
        margin: 0 2px 2px 0;
        padding: 0px;
        outline: 1px solid white;
        background-color: transparent;
      }

      .work-child.even {
        outline: 1px solid black;
      }

      .work-child .child-bg {
        position: absolute;
        width: 100%;
        height: 100%;
      }

      .work-child .child-bg.even {
        background-color: red;
      }
    `,
  ],
})
export class ListActionsComponent extends Hooks implements AfterViewInit {
  @ViewChild('arrayP', { read: ArrayProviderComponent, static: true }) arrayP;

  @ViewChildren('workChild') workChildren: QueryList<ElementRef<HTMLElement>>;

  private numRendered = 0;

  readonly view = new BehaviorSubject<'list' | 'tile'>('list');
  readonly triggerChangeSet = new Subject<void>();
  readonly activeChangeSet$ = this.triggerChangeSet.pipe(
    switchMapTo(scheduled(customChangeSet, asyncScheduler)),
    // tap((data) => console.log(data))
  );

  readonly triggerMoveSet = new Subject<void>();
  readonly triggerMoveSetSwapped = new Subject<void>();
  readonly activeMoveSet$ = merge(
    this.triggerMoveSet.pipe(switchMap(() => [items5k])),
    this.triggerMoveSetSwapped.pipe(switchMap(() => [items5kSwapped]))
  );

  readonly data$ = defer(() =>
    merge(this.arrayP.array$, this.activeChangeSet$, this.activeMoveSet$)
  );
  readonly renderCallback = new Subject();
  readonly rendered$ = this.renderCallback.pipe(
    map(() => ++this.numRendered),
  );
  readonly viewBroken$ = this.renderCallback.pipe(
    map(() => {
      const children = Array.from(
        document.getElementsByClassName('work-child')
      );
      let broken = false;
      let i = 0;
      for (const child of children) {
        const even = i % 2 === 0;
        if (
          (even && !child.classList.contains('even')) ||
          (!even && child.classList.contains('even'))
        ) {
          broken = true;
          break;
        }
        i++;
      }
      return broken;
    })
  );
  strategy$ = new Subject<string>();
  customChangeSet = customChangeSet;
  customChangeSet$ = new Subject<any>();

  trackById = (idx, item) => {
    return item.id;
  };

  constructor(public state: RxState<any>, public cdRef: ChangeDetectorRef) {
    super();
  }

  ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.state.hold(this.workChildren.changes, (workChildren) => {
      // console.log('workChildren', this.workChildren.toArray());
    });
  }

  clickMe() {
    console.log('clicked me');
  }

  trackByIdFn = (a) => a.id;

  color(a) {
    return '#' + Math.floor(a.value * 16777215).toString(16);
  }
}
