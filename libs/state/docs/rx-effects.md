# Resources

**Example applications:**  
A demo application is available on [GitHub](https://github.com/BioPhoton/rx-angular-state-rx-effects).

# Motivation

There are many situations where you need to manage side effects inside your components.
In the context of state management every piece of code which does not manipulate, transform or read state can be considered as side effect.
Side effects can be triggered by state changes though.

Side effects (most of the time coming from subscriptions) always yield the potential of a memory leak if not cleaned up correctly.
Like local state, local side-effects need to be coupled to the lifecycle of the component.

To accomplish this, we need to make sure to clean up every side effect in the `OnDestroy` method. Here we can de-reference local variables and unsubscribe open subscriptions.

With `RxEffects` RxAngular introduces another light weight tool only designed to manage local side-effects.

```ts
@Component({
  // ...
})
export class FooComponent implements OnDestroy {
  // ⚠ Notice: The destroy hook must be reactive to use `takeUntil`
  private readonly destroy$ = new Subject<void>();

  constructor() {
    effect$
      .pipe(
        takeUntil(this.destroy$)
        // ⚠ Notice: Don't put any operator after takeUntil to avoid potential subscription leaks
      )
      .subscribe(doSideEffect);
  }

  ngOnDestroy(): void {
    // ⚠ Notice: Never forget to cleanup the subscription
    this.destroy$.next();
  }
}
```

Using the `subscription` to run the clean up logic.

```ts
@Component({
  // ...
})
export class FooComponent implements OnDestroy {
  // ⚠ Notice: The created subscriptin must be stored to `unsubscribe` later
  private readonly subscription: Subscription;

  constructor() {
    // ⚠ Notice: Never forget to store the subscription
    this.subscription = effect$.subscribe(doSideEffect);
  }

  ngOnDestroy(): void {
    // ⚠ Notice: Never forget to cleanup the subscription
    this.subscription.unsubscribe();
  }
}
```

In RxAngular we think the essential problem here is the call to `subscribe` itself. All `Subscription`s need to get unsubscribed manually which most of the time produces heavy boilerplate or even memory leaks if ignored or did wrong. 
Like `RxState`, `RxEffects` is a local service provided by a component and thus tied to the components life cycle.
We can manage `Observables` as reactive triggers for side effects or manage `Subscription`s which internally hold side effects.
To also provide an imperative way for developers to unsubscribe from the side effect `register` returns an "asyncId" similar to `setTimeout`.
This can be used later on to call `unregister` and pass the async id retreived from a previous `register` call. This stops and cleans up the side effect when invoked.

As an automatism any registered side effect will get cleaned up when the related component is destroyed.

Using `RxEffect` to maintain side-effects

```ts
@Component({
  // ...
  providers: [RxEffects],
})
export class FooComponent {
  constructor(effects: RxEffects) {
    effects.register(obs$, doSideEffect);
  }
}
```

> **⚠ Notice:**
> Avoid calling `register`, `unregister` , `subscribe` inside the side-effect function. (here named `doSideEffect`)

# Impact

Compared to common approaches `RxEffects` does not rely on additional decorators or operators.
In fact, it remove the necessity of the `subscribe`.

This results in less boilerplate and a good guidance to resilient and ergonomic component architecture.
Furthermore, the optional imperative methods help to glue third party libs and a mixed but clean codestyle in Angular.

# Concept of Side Effect

Let's have some fundamental thoughts on the concept of side effects and their reactive handling.
Before we get any further, let's define two terms, _side effect_ and _pure function_.

**Pure function:**
A function is called pure if:

- Its return value is the same for the same arguments, e.g. `function add(a, b) { return a + b}`
- Its executed internal logic has no side effects

**Side Effect:**
A function has a _side effect_ if:

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
  ```

function sideEffectFn(oldState) {
oldState.isVisible = true;
return oldState;
}

````

- I/O is changed

  ```typescript
let state = { isVisible: false };
sideEffectFn(state);

function sideEffectFn(state) {
  console.log(state);
  // or
  this.render(state);
}
````

As a good rule of thumb, you can consider every function without a return value to be a side effect.

## Anatomy

Yet, essentially, a side effect always has 2 important parts associated with it:

- the trigger
- the side-effect logic

In the above examples, the trigger was the method call itself. That is one way of doing it, but not the only one.

```typescript
some code
```

We can also set a value emitted from an `Observable` as a trigger.
Thus, you may use a render call or any other logic executed by the trigger as the side-effect logic.

```typescript
some code
```

# Setup

# Usage
