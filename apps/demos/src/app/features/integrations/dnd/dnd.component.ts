import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { delay, map, shareReplay, tap } from 'rxjs/operators';
import { RxForModule } from '../../../rx-angular-pocs/template/directives/for/rx-for.module';

@Component({
  selector: 'rxa-dnd',
  template: `
    <div
      cdkDropList
      (cdkDropListDropped)="drop($event)"
    >
      <h3>ngFor</h3>
      <ul>
        <li
          cdkDrag
          *ngFor="let item of items$ | async"
        >{{item.value}}</li>
      </ul>
    </div>

    <div
      cdkDropList
      (cdkDropListDropped)="drop($event)"
    >
      <h3>ngFor with error</h3>
      <ul>
        <li
          cdkDrag
          (cdkDragStarted)="dragging$.next(true)"
          (cdkDragEnded)="dragging$.next(false)"
          *ngFor="let item of errorItems$ | async; trackBy: trackItem"
        >{{item.value}}</li>
      </ul>
    </div>

    <div
      cdkDropList
      (cdkDropListDropped)="drop($event)"
    >
      <h3>rxFor errorItems with</h3>
      <ul>
        <li
          cdkDrag
          (cdkDragStarted)="dragging$.next(true)"
          (cdkDragEnded)="dragging$.next(false)"
          *rxFor="let item of errorItems$; trackBy: trackItem; strategy: 'normal'"
        >{{item.value}}</li>
      </ul>
    </div>

    <div
      cdkDropList
      (cdkDropListDropped)="drop($event)"
    >
      <h3>rxFor errorItems with noop-switch</h3>
      <ul>
        <li
          cdkDrag
          (cdkDragStarted)="dragging$.next(true)"
          (cdkDragEnded)="dragging$.next(false)"
          *rxFor="let item of errorItems$; trackBy: trackItem; strategy: noopWhileDrag$"
        >{{item.value}}</li>
      </ul>
    </div>

    <div
      cdkDropList
      (cdkDropListDropped)="drop($event)"
    >
      <h3>rxFor</h3>
      <ul>
        <li
          cdkDrag
          *rxFor="let item of items$; trackBy: trackItem; strategy: 'normal'"
        >{{item.value}}</li>
      </ul>
    </div>

    <div
      cdkDropList
      (cdkDropListDropped)="drop($event)"
    >
      <h3>rxFor with noop-switch</h3>
      <ul>
        <li
          cdkDrag
          (cdkDragStarted)="dragging$.next(true)"
          (cdkDragEnded)="dragging$.next(false)"
          *rxFor="let item of items$; trackBy: trackItem; strategy: noopWhileDrag$"
        >{{item.value}}</li>
      </ul>
    </div>

    <style>
      :host {
        display: flex;
        width: 100%;
        justify-content: space-around;
      }

      div[cdkDropList] {
        height: 84vh;
        overflow-y: auto;
      }
    </style>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DndComponent {
  items$ = new BehaviorSubject<any>(createItems(50));
  private errorItems = [
    {
      id: 1,
      value: 'item - 1'
    },
    {
      id: 2,
      value: 'item - 2'
    }
  ];
  private errorItemsSwapped = [
    {
      id: 2,
      value: 'item - 2'
    },
    {
      id: 1,
      value: 'item - 1'
    }
  ];
  _errorItems$ = new BehaviorSubject<any>(this.errorItems);
  dragging$ = new BehaviorSubject<boolean>(false);
  errorItems$ = this.dragging$.pipe(
    delay(1000),
    map(d => !d ? [...this.errorItems] : [...this.errorItemsSwapped]),
    tap(data => console.log('items', data)),
    shareReplay({ bufferSize: 1, refCount: true })
  )

  noopWhileDrag$ = this.dragging$.pipe(
    map(d => d ? 'noop' : 'normal')
  )

  constructor() {}

  drop(event: CdkDragDrop<any>) {
    const items = this.items$.value;
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    const start = Date.now();
    while (Date.now() < start + 150) {
      /**
       * spend time
       * This is siulating some thread-blocking work,
       * or just waiting for an enpoint to save something.
       * it also fails with smaller numbers
       * but it becomes harder to reproduce.
       * (it even ocasionally fails without the slowdown,
       * but its near impossible to trigger on purpose then)
       */
    }
    this.items$.next([...items.map(i => ({
      id: i.id,
      group: i.group,
      value: i.value
    }))]);
    // this.items$.next([...items]);
  }

  trackItem(i: number, item: any) {
    return item.id;
  }
}

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: DndComponent,
      },
    ]),
    DragDropModule,
    CommonModule,
    RxForModule,
  ],
  declarations: [DndComponent],
})
export class DndComponentModule {}

const randomInt = (max: number, min = 0) =>
  Math.floor(Math.random() * (max - min)) + min;

function createItems(groups = randomInt(20, 10)) {
  const pre = Array.from({ length: groups }, (_, i) => `group #${i} - `);
  return pre.reduce((tot, group) => {
    return tot.concat(
      Array.from({ length: randomInt(5, 1) }, (_, id) => ({
        id: `${group}${id}`,
        group,
        value: `${group} Item #${id}`
      }))
    );
  }, []);
}
