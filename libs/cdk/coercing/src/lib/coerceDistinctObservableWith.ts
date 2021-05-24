import {
  Observable,
  ObservableInput,
  OperatorFunction,
} from 'rxjs';
import { distinctUntilChanged, switchAll } from 'rxjs/operators';
import { coerceObservableWith } from './coerceObservableWith';

/**
 * This operator takes an Observable of values ot Observables aof values and
 * It forwards only distinct values from distinct incoming Observables or values.
 * This comes in handy in any environment where you handle processing of incoming dynamic values and their state.
 *
 * Optionally you can pass a flatten strategy to get find grained control of the flattening process. E.g. mergeAll, switchAll
 *
 * @param flattenOperator - determines the flattening strategy e.g. mergeAll, concatAll, exhaust, switchAll. default is switchAll
 *
 */
export function coerceDistinctWith<T>(
  flattenOperator?: OperatorFunction<ObservableInput<T>, T>
) {
  flattenOperator = flattenOperator || switchAll();
  return (o$: Observable<Observable<T> | T>) =>
    o$.pipe(
      coerceObservableWith(),
      distinctUntilChanged(),
      flattenOperator,
      distinctUntilChanged()
    );
}
