import { Component, Input } from '@angular/core';
import { defer, isObservable, Observable, of, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, pluck, switchMap, tap } from 'rxjs/operators';
import { Hooks } from '../../hooks';

@Component({
  selector: 'rxa-work-visualizer',
  template: `
    <div class="d-flex w-100">
      <rxa-dirty-check style="margin-right: 1rem"
                       [radius]="radius"></rxa-dirty-check>
      <rxa-renders *ngIf="renderingsOn" [value$]="valuesO$" [radius]="radius"></rxa-renders>
    </div>
    <div class="d-flex flex-wrap w-100">
      <div class="work-child" *ngFor="let child of getChildren()">
        <div [ngClass]="{filled: child % 2 === 0}" >&nbsp;</div>
      </div>
    </div>
    <ng-content select="[visualizerHeader]">
    </ng-content>
    <div class="w-100 h-100 d-flex align-items-center justify-content-center flex-grow-1">
      <ng-content>
      </ng-content>
    </div>
  `,
  host: {
    '[style.width.px]': 'size',
    '[class]': 'classNames'
  },
  styles: [`
    .work-child {
      position: relative;
      width: 4px;
      height: 4px;
      margin: 0 2px 2px 0;
      padding: 0px;
      outline: 1px solid green;
      background-color: transparent;
    }

    .work-child div {
      position: absolute;
      width: 100%;
      height: 100%;
    }
    .work-child div.filled {
      background-color: orange;
    }
  `]
})
export class WorkVisualizerComponent extends Hooks {
  @Input()
  size;

  @Input() work = 10;

  classNames = 'd-flex flex-column w-100 m-1 p-1 dh-l-view';

  @Input()
  set viewType(type: string) {
    if (type == null) {
      type = 'l-view';
    }
    this.classNames = [...this.classNames.split(' ').filter(c => c.indexOf('dh-') === -1), 'dh-' + type]
      .join(' ');
  }

  @Input()
  radius = 20;

  @Input()
  renderingsOn = false;

  changeO$ = new ReplaySubject<Observable<any>>(1);

  @Input()
  set value$(v$: Observable<any> | any) {
    if (isObservable(v$)) {
      this.changeO$.next(v$);
    } else {
      if (v$ != null) {
        this.renderingsOn = true;
        this.changeO$.next(of(v$));
      } else {
        this.renderingsOn = false;
      }
    }
  };

  @Input() key;

  valuesO$ = defer(() => this.afterViewInit$.pipe(
    switchMap(() => this.changeO$.pipe(
      distinctUntilChanged(),
      switchMap(o$ => this.key ? o$.pipe(pluck(this.key)) : o$),
      distinctUntilChanged(),
      tap(v => console.log('value', v))
      )
    ))
  );

  constructor() {
    super();
  }

  getChildren(): number[] {
    const items = [];
    for (let i = 0; i <= this.work * 10; i++) {
      items.push(Math.ceil(Math.random() * 100));
    }
    return items;
  }

}
