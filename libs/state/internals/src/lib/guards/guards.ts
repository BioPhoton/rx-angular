import { OperatorFunction } from 'rxjs';

export function isPromiseGuard<T>(value: unknown): value is Promise<T> {
  return (
    !!value &&
    typeof (<any>value).subscribe !== 'function' &&
    typeof (value as any).then === 'function'
  );
}

export function isOperateFnArrayGuard<T, R = T>(
  op: any[]
): op is OperatorFunction<T, R>[] {
  if (!Array.isArray(op)) {
    return false;
  }
  return op.length > 0 && op.every((i: any) => typeof i === 'function');
}

export function isStringArrayGuard(op: any[]): op is string[] {
  if (!Array.isArray(op)) {
    return false;
  }
  return op.length > 0 && op.every((i: any) => typeof i === 'string');
}

export function isIterableGuard<T>(obj: unknown): obj is Array<T> {
  if (obj === null || obj === undefined) {
    return false;
  }
  return typeof (obj as any)[Symbol.iterator] === 'function';
}

export function isKeyOf<O>(k: unknown): k is keyof O {
  return (
    !!k &&
    (typeof k === 'string' || typeof k === 'symbol' || typeof k === 'number')
  );
}

export function isObjectGuard(obj: unknown): obj is object {
  return !!obj && typeof obj === 'object' && !Array.isArray(obj);
}

export function isDefined(val: unknown): val is NonNullable<any> {
  return val !== null && val !== undefined;
}
