import { ComparableData } from '../interfaces/comparable-data-type';
import { isKeyOf } from '../../core';

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
    return sanitizedKeys.length
      ? sanitizedKeys.every((k) => original[k] === incoming[k])
      : defaultCompare(original, incoming);
  }

  return (compare || defaultCompare)(original, incoming);
}
