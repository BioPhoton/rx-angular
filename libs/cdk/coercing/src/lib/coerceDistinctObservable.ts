import {
  Observable,
  ObservableInput,
  OperatorFunction,
} from 'rxjs';
import { distinctUntilChanged, switchAll } from 'rxjs/operators';
import { coerceObservable } from './coerceObservable';

/**
 * This Observable factory creates an Observable out of a static value or ObservableInput.
 * It forwards only distinct values from distinct incoming Observables or values.
 * This comes in handy in any environment where you handle processing of incoming dynamic values and their state.
 *
 * Optionally you can pass a flatten strategy to get find grained control of the flattening process. E.g. mergeAll, switchAll
 *
 * @param o$ - The Observable to coerce and map to a Observable with distinct values
 * @param flattenOperator - determines the flattening strategy e.g. mergeAll, concatAll, exhaust, switchAll. default is switchAll
 */
export function coerceDistinctObservable<T>(
  o$: Observable<Observable<T> | T>,
  flattenOperator?: OperatorFunction<ObservableInput<T>, T>
) {
  flattenOperator = flattenOperator || switchAll();
  return coerceObservable(o$).pipe(
    distinctUntilChanged(),
    flattenOperator,
    distinctUntilChanged()
  );
}
