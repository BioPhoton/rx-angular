import { Component, Input } from '@angular/core';
import { defer, isObservable, Observable, of, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, pluck, switchMap, tap } from 'rxjs/operators';
import { Hooks } from '../../hooks';

@Component({
  selector: 'rxa-visualizer',
  template: `
    <div class="d-flex w-100">
      <rxa-dirty-check style="margin-right: 1rem" [radius]="radius"></rxa-dirty-check>
      <rxa-renders *ngIf="renderingsOn" [value$]="valuesO$" [radius]="radius"></rxa-renders>
      <span *ngIf="cDS">{{cDS}}</span>
    </div>
    <ng-content select="[visualizerHeader]"></ng-content>
    <div class="w-100 h-100 d-flex align-items-center justify-content-center flex-grow-1">
      <ng-content></ng-content>
    </div>
  `,
  host: {
    '[style.width.px]': 'size',
    '[class]': 'classNames'
  }
})
export class VisualizerComponent extends Hooks {
  @Input()
  size;

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
  cDS: string;

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

}
