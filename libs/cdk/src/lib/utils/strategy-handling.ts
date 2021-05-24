import { RxStrategyCredentials, RxCustomStrategyCredentials } from '../model';
import { Observable, ReplaySubject } from 'rxjs';
import { map, share, startWith, switchAll } from 'rxjs/operators';
import { hotFlatten } from './hotFlatten';

/**
 * @internal
 *
 * A factory function returning an object to handle the process of turning strategy names into `RxStrategyCredentials`
 * You can next a strategy name as Observable or string and get an Observable of `RxStrategyCredentials`
 *
 * @param defaultStrategyName
 * @param strategies
 */
export function strategyHandling(
  defaultStrategyName: string,
  strategies: RxCustomStrategyCredentials<string>
): {
  strategy$: Observable<RxStrategyCredentials>;
  next(name: string | Observable<string>): void;
} {
  const hotFlattened = hotFlatten(
    () => new ReplaySubject<string | Observable<string>>(1),
    switchAll()
  );
  return {
    strategy$: hotFlattened.values$.pipe(
      startWith(defaultStrategyName),
      nameToStrategyCredentials(strategies, defaultStrategyName),
      share()
    ),
    next(name: string | Observable<string>) {
      hotFlattened.next(name);
    },
  };
}

/**
 * @internal
 */
function nameToStrategyCredentials(
  strategies: RxCustomStrategyCredentials<string>,
  defaultStrategyName: string
) {
  return (
    o$: Observable<string | null | undefined>
  ): Observable<RxStrategyCredentials> =>
    o$.pipe(
      map((name) =>
        name && Object.keys(strategies).includes(name)
          ? strategies[name]
          : strategies[defaultStrategyName]
      )
    );
}
