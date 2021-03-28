## PushPipe

The `push` pipe serves as a drop-in replacement for Angulars built-in `async` pipe.
Just like the `*rxLet` Directive, it leverages a `RenderStrategy` under the hood which
in turn, takes care of optimizing the `ChangeDetection` of your component.

The rendering behavior can be configured per PushPipe instance using the strategy parameter.
You find more information about [`RenderStrategies`](https://github.com/rx-angular/rx-angular/tree/master/libs/template/docs/render-strategies.md) in the sections below.

Usage in the template

```html
<hero-search [term]="searchTerm$ | push"> </hero-search>
<hero-list-component [heroes]="heroes$ | push"> </hero-list-component>
```

Using different strategies

```html
<hero-search [term]="searchTerm$ | push: 'global'"> </hero-search>
<hero-list-component [heroes]="heroes$ | push: 'global'"> </hero-list-component>
```

Other Features:

- lazy rendering (see [LetDirective](https://github.com/rx-angular/rx-angular/tree/master/libs/template/docs/api/let-directive.md))
- Take observables or promises, retrieve their values and render the value to the template
- a unified/structured way of handling null, undefined or error
- distinct same values in a row skip not needed re-renderings
