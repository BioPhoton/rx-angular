# Setting up a Reactive State

In this section, we will be working with an [imperative code base][setup.start.component.ts] to refactor
its state management to a [reactive setup][setup.solution.component.ts].

We will set up `RxState` in the component, initialize the component's local state, and render it in the template.

In addition, we've introduced automated subscription handling, the possibility for imperative interaction
over component's input bindings, and a clean separation of concerns.

---

## Implement RxState service

The first step is to introduce a reactive state to our component by using the `RxState` class.
This can be done either through inheritance, which means we extend the state service; or through composition, in which case we inject the service into the constructor and add the service to the component's `providers` section.

In this case, we will simply extend the service.
One distinct feature of this method, which is both its benefit and disadvantage, is that we can directly access the service's API using `this` (e.g., `this.select('prop')`.)

To this end, we have to extend our class and use the already existing `ComponentState` interface (see
[setup.start.component.ts] [setup.start.component.ts].)
```typescript

// 1- import RxState
import { RxState } from '@rx-angular/state';

...

// 2- define a component state
interface ComponentState {
  refreshInterval: number;
  list: DemoBasicsItem[];
  listExpanded: boolean;
}

// 3- extend the component, or alternatively, register a local provider and inject it
export class SetupStart implements OnInit, OnDestroy extends RxState<ComponentState> ... {
```

Since we decided to create a reactive state by extending an existing component, we will need to extend its class definition and call `super()` in the constructor.

```typescript
constructor(...) {
  super();
}
```

For the sake of example, we added the state to the same file, but for a more robust architecture, consider having it in a separate file with the `.state.ts` extension.

### Select and display state

The next step is to set up `model$`, a component property that holds all data we wish to display in the template.

By assigning the `model$` to the `$` property of the `RxState` class, we get the full state object as `Observable<ComponentState>`.

```typescript
@Component({
  selector: 'rxa-setup-solution',
  template: `
    model$: <pre>{{model$ | async | json}}</pre>
    ...
  `,
  ...
})
export class SetupReactiveComponentStateContainerComponent extends RxState<ComponentState> {
  model$ = this.select();
}
```

## Initialize the state

As `RxState` is empty and thus lazy at initialization, we can decide if we want to assign initial values to the state and which values these will be.
We can initialize the state imperatively by calling `set()` or by using an observable and the `connect()` method.

We will use `set()` as we already have initial values assigned to the `initComponentState` object's properties.

```typescript
 constructor(...) {
  ...
  this.set(initComponentState);
}
```

After we have completed all these steps, we should see the initial state in the template.

[setup.start.component.ts]: https://github.com/rx-angular/rx-angular/blob/master/apps/demos/src/app/features/tutorials/basics/1-setup/setup.start.component.ts
[setup.solution.component.ts]: https://github.com/rx-angular/rx-angular/blob/master/apps/demos/src/app/features/tutorials/basics/1-setup/setup.solution.component.ts
