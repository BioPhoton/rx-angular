import { RxViewContext } from '@rx-angular/cdk/template-management';

export interface RxIfVisibleViewContext<T> extends RxViewContext<T> {
  // to enable `as` syntax we have to assign the directives selector (var as v)
  rxIfVisible: T | undefined;
}
