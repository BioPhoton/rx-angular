import { NgIterable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, map, pluck } from 'rxjs/operators';

export interface RxListViewComputedContext {
  index: number;
  count: number;
}

export interface RxListViewContext<T, U = RxListViewComputedContext>
  extends RxListViewComputedContext {
  $implicit: T;
  item$: Observable<T>;
  updateContext(newProps: Partial<U>): void;
}

const computeFirst = ({ count, index }) => index === 0;
const computeLast = ({ count, index }) => index === count - 1;
const computeEven = ({ count, index }) => index % 2 === 0;

export class RxDefaultListViewContext<
  T,
  U extends NgIterable<T> = NgIterable<T>,
  K = keyof T
> implements RxListViewContext<T> {
  readonly _item = new ReplaySubject<T>(1);
  item$ = this._item.asObservable();
  private _$implicit: T;
  private _$complete: boolean;
  private _$error: false | Error;
  private _$suspense: any;
  private readonly _context$ = new BehaviorSubject<RxListViewComputedContext>({
    index: -1,
    count: -1,
  });

  set $implicit($implicit: T) {
    this._$implicit = $implicit;
    this._item.next($implicit);
  }

  get $implicit(): T {
    return this._$implicit;
  }

  get $complete(): boolean {
    return this._$complete;
  }

  get $error(): false | Error {
    return this._$error;
  }

  get $suspense(): any {
    return this._$suspense;
  }

  get index(): number {
    return this._context$.getValue().index;
  }

  get count(): number {
    return this._context$.getValue().count;
  }

  get first(): boolean {
    return computeFirst(this._context$.getValue());
  }

  get last(): boolean {
    return computeLast(this._context$.getValue());
  }

  get even(): boolean {
    return computeEven(this._context$.getValue());
  }

  get odd(): boolean {
    return !this.even;
  }

  get index$(): Observable<number> {
    return this._context$.pipe(pluck('index'), distinctUntilChanged());
  }

  get count$(): Observable<number> {
    return this._context$.pipe(pluck('count'), distinctUntilChanged());
  }

  get first$(): Observable<boolean> {
    return this._context$.pipe(map(computeFirst), distinctUntilChanged());
  }

  get last$(): Observable<boolean> {
    return this._context$.pipe(map(computeLast), distinctUntilChanged());
  }

  get even$(): Observable<boolean> {
    return this._context$.pipe(map(computeEven), distinctUntilChanged());
  }

  get odd$(): Observable<boolean> {
    return this.even$.pipe(map((even) => !even));
  }

  constructor(private item: T, customProps?: { count: number; index: number }) {
    // tslint:disable-next-line:no-unused-expression
    this.$implicit = item;
    if (customProps) {
      this.updateContext(customProps);
    }
  }

  updateContext(newProps: Partial<RxListViewComputedContext>): void {
    this._context$.next({
      ...this._context$.getValue(),
      ...newProps,
    });
  }

  select = (props: K[]): Observable<any> => {
    return this.item$.pipe(pluck(...(props as any)));
  };
}
