import { coerceBooleanProperty } from '@angular/cdk/coercion';
import {
  ChangeDetectorRef,
  Directive,
  ElementRef, EmbeddedViewRef,
  Input,
  IterableDiffers,
  NgIterable,
  NgZone,
  OnDestroy,
  OnInit,
  TemplateRef,
  TrackByFunction,
  ViewContainerRef
} from '@angular/core';
import { coerceDistinctWith } from '@rx-angular/cdk/coercing';
import {
  createListTemplateManager,
  RxListManager,
  RxListViewComputedContext, RxListViewContext, RxDefaultListViewContext
} from '@rx-angular/cdk/template-management';
import { RxStrategyProvider
} from '@rx-angular/cdk/render-strategies';

import { ReplaySubject, Subject, Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * @Directive RxFor
 *
 * @description
 *
 * The `*rxFor` structural directive provides a convenient and performant way for rendering
 * templates out of a list of items.
 * Input values can be provided either as `Observable`, `Promise` or `static` values. Just as the `*ngFor` directive, the
 * `*rxFor` is placed on an
 * element, which becomes the parent of the cloned templates.
 *
 * The `RxFor` implements `EmbeddedView Rendering`.
 * Compared to the `NgForOf`, `RxFor` treats each child template as single renderable entity. For each
 * change in the provided list of items it will apply and detect changes to only affected views.
 *
 * Under the hood, it leverages the power of the `StrategyCredential`s which in turn take care of scheduling and
 * prioritizing the change detection for each child template (aka item in the list).
 * This way the rendering behavior of each instance of `RxFor` can be configured individually.
 *
 * `RxStrategyCredentials` and `EmbeddedView Rendering` together build the basis for the `concurrent mode`. Based on
 * the configured strategy every template will get processed in an individual task, which enables chunked and
 * cancellable rendering of the list.
 *
 * As further improvement compared to the basic `*ngFor` implementation, `*rxFor` is able to take care of
 * `ChangeDetection` in situations which include `projected views` (aka `@ContentChild` or `@ViewChild`).
 * Learn more about this in the example section.
 *
 *
 * ### Context Variables
 *
 * The following context variables are available for each template:
 *
 * - $implicit: `T` // the default variable accessed by `let val`
 * - item$: `Observable<T>` // the same value as $implicit, but as `Observable`
 * - index: `number` // current index of the item
 * - count: `number` // count of all items in the list
 * - first: `boolean` // true if the item is the first in the list
 * - last: `boolean` // true if the item is the last in the list
 * - even: `boolean` // true if the item has on even index (index % 2 === 0)
 * - odd: `boolean` // the opposite of even
 * - index$: `Observable<number>` // index as `Observable`
 * - count$: `Observable<number>` // count as `Observable`
 * - first$: `Observable<boolean>` // first as `Observable`
 * - last$: `Observable<boolean>` // last as `Observable`
 * - even$: `Observable<boolean>` // even as `Observable`
 * - odd$: `Observable<boolean>` // odd as `Observable`
 * - select: `(keys: (keyof T)[], distinctByMap) => Observable<Partial<T>>` // returns a selection function which
 * accepts an array of properties to pluck out of every list item. The function returns the selected properties of
 * the current list item as distinct `Observable` key-value-pair. See the example below:
 *
 * This example showcases the `select` view-context function used for deeply nested lists.
 *
 *  ```html
 * <ul>
 *   <li *rxFor="let hero of heroes$; trackBy: trackItem; let select = select;">
 *     <div>
 *       <strong>{{ hero.name }}</strong></br>
 *       Defeated enemies:
 *     </div>
 *      <span *rxFor="let enemy of select(['defeatedEnemies']); trackBy: trackEnemy;">
 *        {{ enemy.name }}
 *      </span>
 *   </li>
 * </ul>
 *  ```
 *
 * ### Input properties
 *
 *  - trackBy: `(index: number, item: T) => any`
 *  - trackBy: `keyof T`
 *  - strategy: `string`
 *  - strategy: `Observable<string>`
 *  - parent: `boolean`;
 *  - renderCallback: `Subject<T[]>`
 *
 *
 * ### Features of `*rxFor`
 *
 * Included features for `*rxFor`:
 * - Push based architecture
 * - Immutable as well as mutable data structures (`trackBy`)
 * - Provide a comprehensive set of context variables for each view
 * - Provide a way to fix `ChangeDetection` issues in `Projected Views` scenarios
 * - automatically runs out of `NgZone`, provide an easy way to opt-in (`patchZone`)
 * - Notify about when rendering of child templates is finished (`renderCallback`)
 * - Reactive as well as imperative values in the template (`ngFor` drop-in replacement)
 * - `ListManager`: special logic for differ mechanism to avoid over-rendering; abstracts away low level logic
 * - render every `EmbeddedView` on its own while applying the configured `RxStrategyCredentials#behavior`
 * - cancel any scheduled work if a remove was triggered for a `trackById`
 * - cancel any update if a new update was triggered for the same `trackById`
 *
 *
 * ### Simple example using `*rxFor` with `Observable` values
 * ```html
 * <ul>
 *   <li *rxFor="let item of observableItems$; trackBy: trackItem">
 *      {{ item }}
 *   </li>
 * </ul>
 * ```
 *
 * ### Simple example using `*rxFor` with simple static values
 * ```html
 * <ul>
 *   <li *rxFor="let item of items; trackBy: trackItem">
 *      {{ item }}
 *   </li>
 * </ul>
 * ```
 *
 *
 * ### Using the context variables
 *
 * ```html
 * <ul>
 *   <li
 *     *rxFor="
 *       let item of observableItems$;
 *       let count = count;
 *       let index = index;
 *       let first = first;
 *       let last = last;
 *       let even = even;
 *       let odd = odd;
 *       trackBy: trackItem;
 *     "
 *   >
 *     <div>{{ count }}</div>
 *     <div>{{ index }}</div>
 *     <div>{{ item }}</div>
 *     <div>{{ first }}</div>
 *     <div>{{ last }}</div>
 *     <div>{{ even }}</div>
 *     <div>{{ odd }}</div>
 *   </li>
 * </ul>
 * ```
 *
 * ### Projected Views (`parent`)
 *
 * Imagine the following situation:
 *
 * ```ts
 * \@Component({
 *   selector: 'app-list-component',
 *   template: `
 *     <ng-content select="app-list-item"></ng-content>
 *   `
 * })
 * export class AppListComponent {
 *  \@ContentChildren(AppListItemComponent) appListItems: QueryList<AppListItemComponent>:
 * }
 * ```
 *
 * `AppListComponent` has a `contentOutlet` where it expects `AppListItemComponents` to be inserted into. In this case
 * `AppListComponent`s state is dependent on its `ContentChildren`.
 * This situation leads to the problem that `AppListComponent` needs to get informed about updates of its child views.
 * This is a known issue which has never been solved for `ngFor` (or other structural directives) especially in
 * combination with `CD OnPush` see here: (https://github.com/angular/angular/pull/35428)
 * `RxFor` solves this issue for you by providing a simple input parameter `parent: boolean`.
 * If set to `true`, `*rxFor` will automatically detect every other `Component` where its
 * `EmbeddedView`s were inserted into. Those components will get change detected as well in order to force
 * update their state accordingly.
 *
 * The usage of `AppListComponent` looks like this:
 *
 * ```html
 * <app-list-component>
 *   <app-list-item
 *     *rxFor="
 *       let item of observableItems$;
 *       parent: true;
 *     "
 *   >
 *     <div>{{ item }}</div>
 *   </app-list-item>
 * </app-list-component>
 * ```
 * ### `NgZone` patch
 *
 * By default `*rxFor` will create it's `EmbeddedViews` outside of `NgZone` which drastically speeds up the
 * performance.
 * There are scenarios where you want to opt-in to `NgZone` though. If views are created out of `NgZone`, all
 * `EventListeners` attached to them run out `NgZone` as well.
 *
 * Take a look at the following example:
 *
 * ```ts
 * \@Component({
 *   selector: 'app-root',
 *   template: `
 *     <!-- clickedHeroName won't get updated due to `NgZone` not noticing the click -->
 *     {{ clickedHeroName }}
 *     <ng-container *rxFor="let hero of heroes$; trackBy: trackHero">
 *       <!-- click runs out of `NgZone` -->
 *       <button (click)="heroClicked(hero)">{{ hero.name }}</button>
 *     </ng-container>
 *   `
 * })
 * export class AppComponent {
 *   clickedHeroName = '';
 *
 *   heroClicked(hero: Hero) {
 *     // this will run out of `NgZone` and thus not update the DOM
 *     this.clickedHeroName = hero.name;
 *   }
 * }
 * ```
 *
 * There are several ways to get around this issue.
 * `*rxFor` can be configured to create views inside of `NgZone` with the `patchZone` flag:
 *
 * ```html
 * <ng-container *rxFor="let hero of heroes$; trackBy: trackHero; patchZone: true">
 *   <!-- click now gets detected by `NgZone` -->
 *   <button (click)="heroClicked(hero)">{{ hero.name }}</button>
 * </ng-container>
 * ```
 *
 * However, `patchZone: true` can in some cases have a negative impact on the performance of the `*rxFor` Directive.
 * Since the creation of the `EmbeddedViews` will most likely happen in batches, every batch will result in one
 * `NgZone` cycle resulting in a possible re-rendering of many other `Components`.
 *
 * Another approach would be to manually detect changes coming from `unpatched` EventListeners or wrapping them in
 * `NgZone`.
 *
 * ```ts
 * export class AppComponent {
 *   clickedHeroName = '';
 *
 *   constructor(
 *     private cdRef: ChangeDetectorRef, // option1
 *     private ngZone: NgZone // option 2
 *   ) {}
 *
 *   heroClicked(hero: Hero) {
 *     // this will run out of `NgZone` and thus not update the DOM
 *     this.clickedHeroName = hero.name;
 *     this.cdRef.markForCheck(); // option 1
 *
 *     // option 2
 *     this.ngZone.run(() => this.clickedHeroName = hero.name);
 *   }
 * }
 * ```
 *
 *
 * @docsCategory RxFor
 * @docsPage RxFor
 * @publicApi
 */
@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[rxFor]'
})
export class RxFor<T, U extends NgIterable<T> = NgIterable<T>>
  implements OnInit, OnDestroy {
  /** @internal */
  static ngTemplateGuard_rxFor: 'binding';

  /**
   * @description
   * The iterable input
   *
   * @example
   * <ng-container *rxFor="heroes$; let hero">
   *   <app-hero [hero]="hero"></app-hero>
   * </ng-container>
   *
   * @param potentialObservable
   */
  @Input()
  set rxFor(
    potentialObservable:
      | Observable<NgIterable<T>>
      | NgIterable<T>
      | null
      | undefined
  ) {
    this.observables$.next(potentialObservable);
  }

  /** @internal */
  @Input()
  set rxForOf(
    potentialObservable:
      | Observable<NgIterable<T>>
      | NgIterable<T>
      | null
      | undefined
  ) {
    this.observables$.next(potentialObservable);
  }

  /**
   * @description
   * The rendering strategy to be used for each template of the list of items.
   * Use it to dynamically manage your rendering strategy. You can switch the strategies
   * imperatively (with a string) or by binding an Observable.
   * The default strategy is `'normal'`.
   *
   * @example
   * \@Component({
   *   selector: 'app-root',
   *   template: `
   *     <ng-container *rxFor="let hero of heroes$; strategy: strategy">
   *       <app-hero [hero]="hero"></app-hero>
   *     </ng-container>
   *   `
   * })
   * export class AppComponent {
   *   strategy = 'low';
   * }
   *
   * // OR
   *
   * \@Component({
   *   selector: 'app-root',
   *   template: `
   *     <ng-container *rxFor="let hero of heroes$; strategy: strategy$">
   *       <app-hero [hero]="hero"></app-hero>
   *     </ng-container>
   *   `
   * })
   * export class AppComponent {
   *   strategy$ = new BehaviorSubject('immediate');
   * }
   *
   * @param strategyName
   * @see {@link strategies}
   */
  @Input('rxForStrategy')
  set strategy(strategyName: string | Observable<string> | undefined) {
    this.strategyInput$.next(strategyName);
  }

  /**
   * @description
   *  If `parent` is set to `true` (default to `false`), `*rxFor` will automatically detect every other `Component` where its
   * `EmbeddedView`s were inserted into. Those components will get change detected as well in order to force
   * update their state accordingly. In the given example, `AppListComponent` will get notified about which insert
   * or remove any `AppListItemComponent`.
   *
   * @example
   * \@Component({
   *   selector: 'app-root',
   *   template: `
   *    <app-list-component>
   *      <app-list-item
   *        *rxFor="
   *          let item of items$;
   *          trackBy: trackItem;
   *          parent: true;
   *        "
   *      >
   *        <div>{{ item.name }}</div>
   *      </app-list-item>
   *    </app-list-component>
   *   `
   * })
   * export class AppComponent {
   *   items$ = itemService.getItems();
   * }
   *
   * @param renderParent
   */
    // tslint:disable-next-line:no-input-rename
  @Input('rxForParent') renderParent = true;

  /**
   * @description
   * A flag to control whether *rxFor templates are created within `NgZone` or not.
   * By default `*rxFor` will create it's `EmbeddedViews` outside of `NgZone` which drastically speeds up the
   * performance.
   * If `patchZone` is set to `true` (defaults to `false`), `*rxFor` will create its EmbeddedViews inside of `NgZone`.
   *
   * @example
   * \@Component({
   *   selector: 'app-root',
   *   template: `
   *    <app-list-component>
   *      <app-list-item
   *        *rxFor="
   *          let item of items$;
   *          trackBy: trackItem;
   *          patchZone: true;
   *        "
   *      >
   *        <div>{{ item.name }}</div>
   *      </app-list-item>
   *    </app-list-component>
   *   `
   * })
   * export class AppComponent {
   *   items$ = itemService.getItems();
   * }
   *
   * @param patchZone
   */
  // tslint:disable-next-line:no-input-rename
  @Input('rxForPatchZone') patchZone = this.strategyProvider.config.patchZone;

  /**
   * @description
   * A function or key that defines how to track changes for items in the iterable.
   *
   * When items are added, moved, or removed in the iterable,
   * the directive must re-render the appropriate DOM nodes.
   * To minimize churn in the DOM, only nodes that have changed
   * are re-rendered.
   *
   * By default, rxFor assumes that the object instance identifies the node in the iterable (equality check `===`).
   * When a function or key is supplied, rxFor uses the result to identify the item node.
   *
   * @example
   * \@Component({
   *   selector: 'app-root',
   *   template: `
   *    <app-list-component>
   *      <app-list-item
   *        *rxFor="
   *          let item of items$;
   *          trackBy: 'id';
   *        "
   *      >
   *        <div>{{ item.name }}</div>
   *      </app-list-item>
   *    </app-list-component>
   *   `
   * })
   * export class AppComponent {
   *   items$ = itemService.getItems();
   * }
   *
   * // OR
   *
   * \@Component({
   *   selector: 'app-root',
   *   template: `
   *    <app-list-component>
   *      <app-list-item
   *        *rxFor="
   *          let item of items$;
   *          trackBy: trackItem;
   *        "
   *      >
   *        <div>{{ item.name }}</div>
   *      </app-list-item>
   *    </app-list-component>
   *   `
   * })
   * export class AppComponent {
   *   items$ = itemService.getItems();
   *   trackItem = (idx, item) => item.id;
   * }
   *
   * @param trackByFnOrKey
   */
  @Input('rxForTrackBy')
  set trackBy(trackByFnOrKey: string | ((idx: number, i: T) => any)) {
    this._trackBy =
      typeof trackByFnOrKey !== 'function'
        ? (i, a) => a[trackByFnOrKey]
        : trackByFnOrKey;
  }

  /**
   * @internal
   * A function that defines how to track `updates` of items.
   * In addition to track when items are added, moved, or removed you can provide a function that determines if any
   * updates happened to an item. Use this is if you want to have even more control about what changes lead to
   * re-renderings of the DOM.
   *
   * By default, rxFor identifies if an update happens by doing an (equality check `===`).
   * When a function supplied, rxFor uses the result to identify the item node.
   *
   * @internal
   * \@Component({
   *   selector: 'app-root',
   *   template: `
   *    <app-list-component>
   *      <app-list-item
   *        *rxFor="
   *          let item of items$;
   *          trackBy: trackItem;
   *          distinctBy: distinctItem;
   *        "
   *      >
   *        <div>{{ item.name }}</div>
   *      </app-list-item>
   *    </app-list-component>
   *   `
   * })
   * export class AppComponent {
   *   items$ = itemService.getItems();
   *   trackItem = (idx, item) => item.id;
   *   // only changes to the name lead to a re-rendering of a child template
   *   distinctItem = (itemA, itemB) => itemA.name === itemB.name;
   * }
   *
   * @param distinctBy
   */
  /*@Input('rxForDistinctBy')*/
  set distinctBy(distinctBy: (a: T, b: T) => boolean) {
    this._distinctBy = distinctBy;
  }

  /**
   * @description
   * A `Subject` which emits whenever *rxFor finished rendering a set changes to the view.
   * This enables developers to perform actions when a list has finished rendering.
   * The `renderCallback` is useful in situations where you rely on specific DOM properties like the `height` a
   * table after all items got rendered.
   * It is also possible to use the renderCallback in order to determine if a view should be visible or not. This
   * way developers can hide a list as long as it has not finished rendering.
   *
   * The result of the `renderCallback` will contain the currently rendered set of items in the iterable.
   *
   * @example
   * \@Component({
   *   selector: 'app-root',
   *   template: `
   *    <app-list-component>
   *      <app-list-item
   *        *rxFor="
   *          let item of items$;
   *          trackBy: trackItem;
   *          renderCallback: itemsRendered;
   *        "
   *      >
   *        <div>{{ item.name }}</div>
   *      </app-list-item>
   *    </app-list-component>
   *   `
   * })
   * export class AppComponent {
   *   items$: Observable<Item[]> = itemService.getItems();
   *   trackItem = (idx, item) => item.id;
   *   // only changes to the name lead to a re-rendering of a child template
   *   distinctItem = (itemA, itemB) => itemA.name === itemB.name;
   *   // this emits whenever rxFor finished rendering changes
   *   itemsRendered = new Subject<Item[]>();
   * }
   *
   * @param renderCallback
   */
  @Input('rxForRenderCallback') set renderCallback(renderCallback: Subject<U>) {
    this._renderCallback = renderCallback;
  }

  /** @internal */
  constructor(
    private iterableDiffers: IterableDiffers,
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone,
    private eRef: ElementRef,
    private readonly templateRef: TemplateRef<RxDefaultListViewContext<T>>,
    private readonly viewContainerRef: ViewContainerRef,
    private strategyProvider: RxStrategyProvider
  ) {}

  /** @internal */
  private strategyInput$ = new ReplaySubject<string | Observable<string>>(1);

  /** @internal */
  private observables$ = new ReplaySubject<
    Observable<NgIterable<T>> | NgIterable<T>
  >(1);

  /** @internal */
  private _renderCallback: Subject<any>;

  /** @internal */
  private readonly values$ = this.observables$.pipe(coerceDistinctWith());

  /** @internal */
  private readonly strategy$ = this.strategyInput$.pipe(coerceDistinctWith());

  /** @internal */
  private listManager: RxListManager<T>;

  /** @internal */
  private _subscription = Subscription.EMPTY;

  /** @internal */
  static ngTemplateContextGuard<U>(
    dir: RxFor<U>,
    ctx: unknown | null | undefined
  ): ctx is RxDefaultListViewContext<U> {
    return true;
  }

  /** @internal */
  _trackBy: TrackByFunction<T> = (i, a) => a;
  /** @internal */
  _distinctBy = (a: T, b: T) => a === b;

  /** @internal */
  ngOnInit() {
    this.listManager = createListTemplateManager<T, RxDefaultListViewContext<T>>({
      iterableDiffers: this.iterableDiffers,
      renderSettings: {
        cdRef: this.cdRef,
        eRef: this.eRef,
        strategies: this.strategyProvider.strategies as any,  // TODO: move strategyProvider
        defaultStrategyName: this.strategyProvider.primaryStrategy,
        parent: coerceBooleanProperty(this.renderParent),
        patchZone: this.patchZone ? this.ngZone : false,
      },
      templateSettings: {
        viewContainerRef: this.viewContainerRef,
        templateRef: this.templateRef,
        createViewContext: this.createViewContext,
        updateViewContext: this.updateViewContext,
      },
      trackBy: this._trackBy
    });
    this.listManager.nextStrategy(this.strategy$);
    this._subscription = this.listManager.render(this.values$)
      .pipe(
        tap((v) => {
          this._renderCallback?.next(v);
        })
      ).subscribe();
  }
  /** @internal */
  createViewContext(item: T, computedContext: RxListViewComputedContext): RxDefaultListViewContext<T> {
    return new RxDefaultListViewContext<T>(item, computedContext);
  }

  /** @internal */
  updateViewContext(
    item: T,
    view: EmbeddedViewRef<RxListViewContext<T>>,
    computedContext: RxListViewComputedContext
  ): void {
    view.context.updateContext(computedContext);
    view.context.$implicit = item;
  }

  /** @internal */
  ngOnDestroy() {
    this._subscription.unsubscribe();
    this.viewContainerRef.clear();
  }
}

