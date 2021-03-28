## LetDirective

The `*rxLet` directive serves a convenient way of binding observables to a view context. Furthermore, it helps
you structure view-related models into view context scope (DOM element's scope).

Under the hood, it leverages a `RenderStrategy` which in turn takes care of optimizing the change detection
of your component. The `LetDirective` will render its template and manage change detection after it got an initial value.
So if the incoming `Observable` emits its value lazily (e.g. data coming from `Http`), your template will be
rendered lazily as well. This can very positively impact the initial render performance of your application.

### Problems with `async` and `*ngIf`

In Angular, a way of binding an observable to the view could look like that:

```html
<ng-container *ngIf="observableNumber$ | async as n">
  <app-number [number]="n"></app-number>
  <app-number-special [number]="n"></app-number-special>
</ng-container>
```

The problem is that `*ngIf` interferes with rendering and in case of a `0` (a falsy value) the component
would be hidden. This issue doesn't concern the `LetDirective`.

The `AsyncPipe` relies on the Zone to be present - it doesn't really trigger change detection by itself.
It marks the component and its children as dirty waiting for the Zone to trigger change detection. So, in case
you want to create a zone-less application, the `AsyncPipe` won't work as desired. `LetDirective` comes
with its own strategies to manage change detection every time a new notification is sent from
the bound Observable.

### Features of `*rxLet`

Included features for `*rxLet`:

- binding is always present. (see "Problems with `async` and `*ngIf`" section below)
- it takes away the multiple usages of the `async` or `push` pipe
- a unified/structured way of handling null and undefined
- triggers change-detection differently if `zone.js` is present or not (`ChangeDetectorRef.detectChanges` or
  `ChangeDetectorRef.markForCheck`)
- triggers change-detection differently if ViewEngine or Ivy is present (`ChangeDetectorRef.detectChanges` or
  `ɵdetectChanges`)
- distinct same values in a row (`distinctUntilChanged` operator),
- display custom templates for different observable notifications (suspense, next, error, complete)

### Binding an Observable and using the view context

The `*rxLet` directive takes over several things and makes it more convenient and safe to work with streams in the
template:

```html
<ng-container *rxLet="observableNumber$; let n">
  <app-number [number]="n"></app-number>
</ng-container>

<ng-container *rxLet="observableNumber$ as n">
  <app-number [number]="n"></app-number>
</ng-container>
```

In addition to that it provides us information from the whole observable context.
We can track the observables:

- next value
- error occurrence
- complete occurrence

```html
<ng-container
  *rxLet="observableNumber$; let n; let e = $error, let c = $complete"
>
  <app-number [number]="n" *ngIf="!e && !c"></app-number>
  <ng-container *ngIf="e"> There is an error: {{ e }} </ng-container>
  <ng-container *ngIf="c"> Observable completed: {{ c }} </ng-container>
</ng-container>
```

### Using the template-binding

You can also use template anchors and display template's content for different observable states:

- on complete
- on error
- on suspense - before the first value is emitted

```html
<ng-container
  *rxLet="
    observableNumber$;
    let n;
    error: error;
    complete: complete;
    suspense: suspense;
  "
>
  <app-number [number]="n"></app-number>
</ng-container>
<ng-template #error>ERROR</ng-template>
<ng-template #complete>COMPLETE</ng-template>
<ng-template #suspense>SUSPENSE</ng-template>
```

Internally, `*rxLet` is using a simple "view memoization" - it caches all anchored template references and re-uses
them whenever the observable notification (next/error/complete) is sent. Then, it only updates the context
(e.g. a value from the observable) in the view.

## Signature

```TypeScript
class LetDirective<U> implements OnInit, OnDestroy {
  readonly strategies: StrategySelection;
  @Input() rxLet: ObservableInput<U> | null | undefined
  @Input('rxLetStrategy') strategy: string | Observable<string> | undefined
  @Input() rxLetComplete: TemplateRef<LetViewContext<U | undefined | null> | null>
  @Input() rxLetError: TemplateRef<LetViewContext<U | undefined | null> | null>
  @Input() rxLetSuspense: TemplateRef<LetViewContext<U | undefined | null> | null>
}
```

## Members

### strategies

##### typeof: StrategySelection

All strategies initialized and registered for the `LetDirective`. Pass a name of one the
`strategies` to the `strategy` input to switch between them on the fly.

### rxLet

##### typeof: ObservableInput&#60;U&#62; | null | undefined

The Observable to be bound to the context of a template.

_Example_

```TypeScript
<ng-container *rxLet="hero$; let hero">
  <app-hero [hero]="hero"></app-hero>
</ng-container>
```

### strategy

##### typeof: string | Observable&#60;string&#62; | undefined

The rendering strategy to be used when rendering with the reactive context within a template.
Use it to dynamically manage your rendering strategy. You can switch the strategies
imperatively (with a string) or by bounding an Observable.
The default strategy is `'local'`.

_Example_

```TypeScript
@Component({
  selector: 'app-root',
  template: `
    <ng-container *rxLet="hero$; let hero; strategy: strategy">
      <app-hero [hero]="hero"></app-hero>
    </ng-container>
  `
})
export class AppComponent {
  strategy = 'local';
}

// OR

@Component({
  selector: 'app-root',
  template: `
    <ng-container *rxLet="hero$; let hero; strategy: strategy$">
      <app-hero [hero]="hero"></app-hero>
    </ng-container>
  `
})
export class AppComponent {
  strategy$ = new BehaviorSubject('local');
}
```

### rxLetComplete

##### typeof: TemplateRef&#60;LetViewContext&#60;U | undefined | null&#62; | null&#62;

A template to show if the bound Observable is in "complete" state.

_Example_

```TypeScript
<ng-container *rxLet="hero$; let hero; complete: completeTemplate">
  <app-hero [hero]="hero"></app-hero>
</ng-container>
<ng-template #completeTemplate>
  <mat-icon>thumb_up</mat-icon>
</ng-template>
```

### rxLetError

##### typeof: TemplateRef&#60;LetViewContext&#60;U | undefined | null&#62; | null&#62;

A template to show if the bound Observable is in "error" state.

_Example_

```TypeScript
<ng-container *rxLet="hero$; let hero; error: errorTemplate">
  <app-hero [hero]="hero"></app-hero>
</ng-container>
<ng-template #errorTemplate>
  <mat-icon>thumb_down</mat-icon>
</ng-template>
```

### rxLetSuspense

##### typeof: TemplateRef&#60;LetViewContext&#60;U | undefined | null&#62; | null&#62;

A template to show before the first value is emitted from the bound Observable.

_Example_

```TypeScript
<ng-container *rxLet="hero$; let hero; suspense: suspenseTemplate">
  <app-hero [hero]="hero"></app-hero>
</ng-container>
<ng-template #suspenseTemplate>
  <mat-progress-spinner></mat-progress-spinner>
</ng-template>
```
