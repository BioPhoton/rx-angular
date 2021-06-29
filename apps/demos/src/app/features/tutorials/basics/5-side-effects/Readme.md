# Handling Side Effects Reactively

This section introduces and explores the concept of side effects and their reactive handling.

Before we get any further, let's define two terms, *side effect* and *pure function*.

**Pure function:**
A function is called pure if:

- Its return value is the same for the same arguments, e.g. `function add(a, b) { return a + b}`
- Its executed internal logic has no side effects

**Side Effect:**
A function has a *side effect* if:

- There's a mutation of local static variables, e.g. `this.prop = value`
- Non-local variables are used

---

## Examples

Let's look at a couple of examples that will make the above definitions easier to understand.

```typescript
let state = true;
sideEffectFn();

function sideEffectFn() {
  state = true;
}
```

- mutable reference arguments get passed

```typescript
let state = { isVisible: false };
let newState = sideEffectFn(state);

function sideEffectFn(oldState) {
  oldState.isVisible = true;
  return oldState;
}
```

- I/O is changed

```typescript
let state = { isVisible: false };
sideEffectFn(state);

function sideEffectFn(state) {
  console.log(state);
  // or
  this.render(state);
}
```

As a good rule of thumb, you can consider every function without a return value to be a side effect.

Yet, essentially, a side effect always has 2 important parts associated with it:

- the trigger
- the side-effect logic

In the above examples, the trigger was the method call itself. That is one way of doing it, but not the only one. We can also set a value emitted from an `Observable` as a trigger.
Thus, you may use a render call or any other logic executed by the trigger as the side-effect logic.  

## Application

With this in mind, let's take a look at the component logic and see if we can identify a side effect:

First, we initialize a background process in the `ngOnInit` over `resetRefreshTick` (see [side-effects.start.component.ts] [side-effects.start.component.ts].)

```typescript
  ngOnInit(): void {
    this.resetRefreshTick();
  }
```

The interval also gets reset whenever the input binding for `refreshInterval` changes.

```typescript
   @Input()
    set refreshInterval(refreshInterval: number) {
      if (refreshInterval > 4000) {
        this.set({ refreshInterval });
        this.resetRefreshTick()
      }
    }
```

Another side effect is contained in the `onRefreshClicks` callback. Here, we dispatch an action to the global store.

```typescript
  onRefreshClicks(event) {
    this.listService.refetchList();
  }
```

Let's refactor those parts and handle them in a clean and reactive way.

# Refactor to a reactive UI

As RxJS provides us with a very powerful way of composing emitted events, we will refactor our UI interaction with the streams.

UI interaction, in general, can come from buttons, inputs, forms, scroll or resize events, etc.

In our case, we have the refresh button as UI interaction. To get this interaction as an `Observable`, we create a `Subject` in the component class and fire its `next` method on every button click.

```html
<button mat-raised-button color="primary" (click)="refreshClicks.next($event)">
  Refresh List
</button>
```

```typescript
export class SideEffectsStart
  extends RxState<ComponentState>
  implements OnInit, OnDestroy {
  refreshClicks$ = new Subject<Event>();
  //...
}
```

This is the trigger for our side effect.

## Manage side effects

To maintain side effects RxAngular provides a deprecated method `RxState#hold`. 
As this method will get removed in the future we directly focus on the new method and use `RxEffects#register`.

`RxEffects` is used in the same way as `RxState` as "component only provider". This means we need to add it to the components `providers` array.


```typescript
@Component({
  ...
  providers: [
    RxEffects
  ] 
})
export class SideEffectsStart extends RxState<ComponentState> {
 constructor(private rxEffects: RxEffects) {
   
 }
}
```

From the `resetRefreshTick` method, we now move the logic that starts the tick and place it in the `register` method of `RxEffects` as a callback parameter.

The `register` method's job, as the name implies, is to *registers/holds* something. Namely, it holds a subscription to a side effect and takes care of its initialization.
Furthermore, it automatically handles the subscription management and unsubscribes if the component gets destroyed.

```typescript
constructor(...) {
  this.rxEffects.register(this.refreshClicks$, () => this.listService.refetchList());
}
```

With this implementation, we should be able to dispatch an action on every button click.

Optionally, we could also put the side effect into a tap operator. To that end, we create a new property in our class called `refreshListSideEffect$` and assign the newly created click `Observable` to it:

```typescript
refreshListSideEffect$ = this.refreshClicks$.pipe(
  tap(() => this.listService.refetchList())
);
```

and then register it directly:

```typescript
constructor(...) {
  this.rxEffects.register(refreshListSideEffect$);
}
```

## Refactor the background-process side effect

Another side effect in this component is the background process that dispatches the refresh action in an interval defined over the `refreshInterval` input binding.

If we take a look at the current implementation of `resetRefreshTick`, we will see 2 pieces:

* One piece is responsible for deriving an interval from the current `refreshInterval` value in milliseconds.
* The other piece fires the actual side effect.

Let's first refactor the trigger `this.select('refreshInterval').pipe(switchMap(ms => timer(0, ms)))` to a separate class property.

```typescript
intervalRefreshTick$ = this.select(
  map((s) => s.refreshInterval),
  switchMap((ms) => timer(0, ms))
);
```

If we think about it, both the button click and interval are triggers for the same side effect.
Besides, their emitted value is irrelevant for the side effect and only serves as a trigger for its execution.

This means we can simply merge their outputs together.

```typescript
refreshListSideEffect$ = merge(
  this.refreshClicks,
  this.intervalRefreshTick$
).pipe(tap((_) => this.listService.refetchList()));
```

As a last step, we could use another overload of the `register` method to get better readability of the code.

The second overload of the `register` method takes a trigger `Observable` and a separate function that is executed whenever the trigger fires.
It generally looks like this:

`register(o$: Observable<T>, sideEffect: (v: T) => void)`

In our constructor, we can use it as following:

```typescript
constructor(...) {
  // ...
  this.rxEffects.register(refreshListSideEffect$, () => this.listService.refetchList());
}
```

Now, it's time to reap the benefits!

Let's delete code.

In the example, we can get rid of the following snippets:

```typescript
  implements OnInit, OnDestroy
  // ..
  intervalSubscription = new Subscription();
  // ...
  ngOnDestroy(): void {
    this.intervalSubscription.unsubscribe();
  }
  // ...
  ngOnInit(): void {
    this.resetRefreshTick();
  }
  // ...
  resetRefreshTick() {
    this.intervalSubscription.unsubscribe();
    this.intervalSubscription = this.select('refreshInterval')
      .pipe(
        switchMap(ms => interval(ms)),
        tap(_ => this.listService.refetchList())
      )
      .subscribe();
  }
  // ...
  onRefreshClicks(event) {
    this.listService.refetchList();
  }
  // ...
}
```

We can say without any doubt we did an excellent job. :)

Side effects are now organized in a structured and readable way, and the subscription handling gets done automatically by the state layer.
Furthermore, we managed to get rid of all implemented lifecycles as well as the callback function for the button click.

All in all, an amazing job!

[side-effects.start.component.ts]: https://github.com/rx-angular/rx-angular/tree/master/apps/demos/src/app/features/tutorials/basics/5-side-effects
