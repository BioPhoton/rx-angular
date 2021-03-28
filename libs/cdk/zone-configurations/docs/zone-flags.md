# Zone Configurations with ZoneFlags

---

#### Enhance your applications performance by disabling `zone.js` partially

---

# Resources

**Example applications:**
A demo application is available on [stackblitz](https://stackblitz.com/edit/angular-zone-flags).

# Motivation

**How zone.js works by default**

By default `zone.js` wraps almost all browser events – like mouse events, XHR events, timers and so on.
Every time event is invoked, zone initiates app re-render. This is cool feature of a framework – every time data has a \***\*chance\*\*** to update, Angular checks and re-renders the app.

![Angular change-detection based on zone](https://raw.githubusercontent.com/rx-angular/rx-angular/master/libs/cdk/docs/zone-configuration/images/angular-zone-change-detection_michael-hladky.png)

How it influences on the performance of the app
But when we talk about big complex apps – we might not need this to be done over all the app on every event, it influences badly on the performance. Better manually control re-renders with change detection strategy onPush and decide explicitly should something be re-rendered or not.
Zone can be (disabled fully)[https://angular.io/guide/zone#disabling-zone], but it's too big step for an existent app – things would break. So better approach is to disable events one by one, controlling affected area.
**Here zone flags come to action**.

To set up zone flags we can use the direct `window` properties as documented in the [official docs](https://angular.io/guide/zone#setting-up-zonejs). The best documentation can be found in the source [zone-flags](https://github.com/angular/angular/blob/master/packages/zone.js/lib/zone.configurations.api.ts).

# Available Approaches

In the following, we will discuss the vanilla JavaScript approach without any abstraction or DX to understand the fundamentals, as well as serve an approach for a setup with RxAngulars `@rx-angular/cdk/zone-config` helper.

RxAngular should be our go-to approach as it serves as a more convenient way to setup zone-flags, debug them and give assertions if they are not set up correctly.

**The Benefits**

✅ Good documentation and maintenance  
✅ Typed methods  
✅ IDE autocompletion  
✅ IDE inline documentation  
✅ Predefined event names  
✅ Assertion if zone-flags are not correctly used  
✅ Convenience methods

# Impact

Zone flags can land an incredible performance improvement, but also can cause a lot of problems related to change detection if it was not in a proper state.

The impact is introduced by removing the following process:

- get rid of `markForCheck()` which mark path from target to root as dirty
- trigger `ApplicationRef#tick`

Check the difference in flame charts: it's a performance snapshot from list view of clickup being scrolled down.
A second charts is with timer, scroll and xhr events turned off.

![angular and zone flags performance comparison](https://raw.githubusercontent.com/rx-angular/rx-angular/master/libs/cdk/docs/zone-configuration/images/angular-zone-flags_performance-comparison_michael-hladky.png)

# Risks & What can break

Applications that rely on global state management are in a good position because they rely on push-based change propagation already. Therefore there is no reason for the dirty marking from the root.
With some specific local state management, it is manageable to fix possible bugs quite easily for most of the flags.

Another risk with zone flags is it will also affect **third-party libs** that rely on change detection through the zone flagged APIs.

In general, if you turn off one-two flags, nothing may break cause others are still present. And only when 70% of flags would be turned off, you'd see some major regression in UI.
That's why important not only to disable the flag and check that app is ok but also to go over the codebase checking that change detection would be triggered correctly without zone.

# Migration and Precondition

1. Make sure `ChangeDetectionStrategy.OnPush` is set for the app's root component and the app is working properly. This is needed to ensure an immutable change propagation.
2. To prioritize the flags we need to compare we can ask the following questions:

- Where and how often it is used?
- How hard is it to fix the resulting issues?

3. Pick an easy-to-control API u want to flag. Safest is to go one by one.
   A good example of easy flags are:

- HTTP requests(XHR flags) are easy to flag because the HTTP layer needs to be encapsulated and not used in components
- setTimeout and setInterval (timers flag) cause it's easy to find them all in a codebase, measure impact and check that nothing broke
- mouse/input/keyboard events cause every mouse event has an explicit handler in the code
- requestAnimationFrame cause there are very few of them in the codebase

4. Search the application's codebase for the APIs used to figure out the spots where it may break.
5. Consider third-party libs that use the flagged API and their usage may also break
6. Switch on the zone flag in question.
7. Take flame chart measurements or use breakpoints to ensure they are working
8. Test your application and see everything works fine

# Alternatives

An even **less granular way** to disable zone functionality is turning it off completely.

- disable `zone.js` completely

More **fine-grained ways** to control zone would be:

- Custom EventManager (downside is we lose typing in the template)
- Custom HttpClientFactory
- RxAngular unpatch directive
