import { isKeyOf } from '../guards/guards';
import { ComparableData } from '../interfaces';

export function valuesComparer<T>(
  original: T,
  incoming: T,
  compare?: ComparableData<T>
): boolean {
  const defaultCompare = (a: T, b: T) => a === b;

  if (isKeyOf<T>(compare)) {
    return original[compare] === incoming[compare];
  }

  if (Array.isArray(compare)) {
    const sanitizedKeys = compare.filter((k) => isKeyOf<T>(k));
    return sanitizedKeys.length > 0
      ? sanitizedKeys.every((k) => original[k] === incoming[k])
      : defaultCompare(original, incoming);
  }

  compare = typeof compare === 'function' ? compare : defaultCompare;
  return compare(original, incoming);
}
