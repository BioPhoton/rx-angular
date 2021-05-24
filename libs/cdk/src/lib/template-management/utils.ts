import {
  ChangeDetectorRef,
  Component,
  EmbeddedViewRef,
  TemplateRef,
  Type,
  ViewContainerRef,
  ɵdetectChanges as detectChanges,
} from '@angular/core';
import {
  combineLatest,
  concat,
  merge,
  Observable,
  of,
  OperatorFunction,
} from 'rxjs';
import { MonoTypeOperatorFunction } from 'rxjs';
import {
  delay,
  ignoreElements,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';
import { asyncScheduler } from '@rx-angular/cdk/zone-less';
import { RxStrategyCredentials } from '../model';
import { onStrategy } from '../utils/onStrategy';
import { toRenderError } from './render-error';

// Below are constants for LView indices to help us look up LView members
// without having to remember the specific indices.
// Uglify will inline these when minifying so there shouldn't be a cost.
const TVIEW = 1;
const T_HOST = 6;
const L_CONTAINER_NATIVE = 7;
const CONTEXT = 8;
const HEADER_OFFSET = 20;

export type TNode = any;

/**
 * @internal
 *
 * Returns the TNode of the passed node form TVIEW of passed cdRef
 *
 * @param cdRef
 * @param native
 */
export function getTNode(cdRef: ChangeDetectorRef, native: Node): TNode {
  const lView = (cdRef as any)._cdRefInjectingView;
  if (!lView) {
    return undefined;
  }
  const tView = lView[TVIEW];
  let i = HEADER_OFFSET;
  let lContainer;
  while (!lContainer && i <= tView['bindingStartIndex']) {
    const candidate = lView[i];
    if (candidate && candidate[L_CONTAINER_NATIVE] === native) {
      lContainer = candidate;
    }
    i++;
  }
  return lContainer[T_HOST];
}

/**
 * @internal
 *
 * Returns a set of references to parent views
 *
 *
 * @param cdRef
 * @param tNode
 */
export function extractProjectionParentViewSet(
  cdRef: ChangeDetectorRef,
  tNode: TNode
): Set<Type<Component>> {
  const injectingLView = (cdRef as any)._cdRefInjectingView;
  const injectingTView = injectingLView[1];
  const components = new Set<number>(injectingTView['components']);
  const parentElements = new Set<Type<Component>>();
  let parent = tNode['parent'];
  while (parent != null && components.size > 0) {
    const idx = parent['index'];
    if (components.has(idx)) {
      // TODO: we should discuss about this. currently only the first Component will get returned, not a list of
      //  components. Maybe we should make the parent notification configurable regarding the level of `deepness`?
      // components.delete(idx);
      components.clear();
      parentElements.add(injectingLView[idx][CONTEXT]);
    }
    parent = parent['parent'];
  }
  return parentElements;
}

export function extractProjectionViews(
  cdRef: ChangeDetectorRef,
  tNode: TNode
): Type<any>[] {
  return Array.from(extractProjectionParentViewSet(cdRef, tNode));
}

/**
 * A side effect operator similar to `tap` but with a static logic
 *
 *
 *
 * @param cdRef
 * @param tNode
 * @param strategy$
 */
export function renderProjectionParents(
  cdRef: ChangeDetectorRef,
  tNode: TNode,
  strategy$: Observable<RxStrategyCredentials>
): OperatorFunction<any, any> {
  return (o$) =>
    o$.pipe(
      withLatestFrom(strategy$),
      switchMap(([_, strategy]) => {
        const parentElements = extractProjectionParentViewSet(cdRef, tNode);
        const behaviors = [];
        for (const el of parentElements.values()) {
          behaviors.push(
            onStrategy(
              el,
              strategy,
              (value, work, options) => {
                detectChanges(el);
              },
              { scope: el }
            )
          );
        }
        behaviors.push(
          onStrategy(
            null,
            strategy,
            (value, work, options) => work(cdRef, options.scope),
            { scope: (cdRef as any).context || cdRef }
          )
        );
        return merge(...behaviors);
      })
    );
}

/**
 * @internal
 * creates an embeddedViewRef
 *
 * @param viewContainerRef
 * @param templateRef
 * @param context
 * @param index
 * @return EmbeddedViewRef<C>
 */
export function createEmbeddedView<C>(
  viewContainerRef: ViewContainerRef,
  templateRef: TemplateRef<C>,
  context: C,
  index = 0
): EmbeddedViewRef<C> {
  const view = viewContainerRef.createEmbeddedView(templateRef, context, index);
  view.detectChanges();
  return view;
}

/**
 * @internal
 *
 * A factory function returning an object to handle `TemplateRef`'s.
 * You can add and get a `TemplateRef`.
 *
 */
export function templateHandling<N, C>(
  viewContainerRef: ViewContainerRef
): {
  add(name: N, templateRef: TemplateRef<C>): void;
  get(name: N): TemplateRef<C>;
  createEmbeddedView(name: N, context?: C, index?: number): EmbeddedViewRef<C>;
} {
  const templateCache = new Map<N, TemplateRef<C>>();

  const get = (name: N): TemplateRef<C> => {
    return templateCache.get(name);
  };
  return {
    add(name: N, templateRef: TemplateRef<C>): void {
      assertTemplate(name, templateRef);
      if (!templateCache.has(name)) {
        templateCache.set(name, templateRef);
      } else {
        throw new Error(
          'Updating an already existing Template is not supported at the moment.'
        );
      }
    },
    get,
    createEmbeddedView: (name: N, context?: C) =>
      createEmbeddedView(viewContainerRef, get(name), context),
  };

  //
  function assertTemplate<T>(
    property: any,
    templateRef: TemplateRef<T> | null
  ): templateRef is TemplateRef<T> {
    const isTemplateRefOrNull = !!(
      !templateRef || templateRef.createEmbeddedView
    );
    if (!isTemplateRefOrNull) {
      throw new Error(
        `${property} must be a TemplateRef, but received something else.`
      );
    }
    return isTemplateRefOrNull;
  }
}

/**
 * @internal
 *
 * A side effect operator similar to `tap` but with a static internal logic.
 * It calls detect changes on the 'VirtualParent' and the injectingViewCdRef.
 *
 * @param tNode
 * @param injectingViewCdRef
 * @param strategy
 * @param notifyNeeded
 */
export function notifyAllParentsIfNeeded<T>(
  tNode: TNode,
  injectingViewCdRef: ChangeDetectorRef,
  strategy: RxStrategyCredentials,
  notifyNeeded: () => boolean
): MonoTypeOperatorFunction<T> {
  return (o$) =>
    o$.pipe(
      delay(0, asyncScheduler),
      switchMap((v) => {
        const notifyParent = notifyNeeded();
        if (!notifyParent) {
          return of(v);
        }
        const behaviors = tNode
          ? getVirtualParentNotifications$(tNode, injectingViewCdRef, strategy)
          : [];
        // @TODO remove this CD on injectingViewCdRef if possible
        behaviors.push(
          onStrategy(
            null,
            strategy,
            (_v, work, options) => work(injectingViewCdRef, options.scope),
            {
              scope: (injectingViewCdRef as any).context || injectingViewCdRef,
            },
            (error) => toRenderError(error, injectingViewCdRef)
          )
        );
        if (behaviors.length === 1) {
          return of(v);
        }
        return concat(of(v), combineLatest(behaviors).pipe(ignoreElements()));
      })
    );
}

/**
 * @internal
 *
 * returns an Observable executing a side effects for change detection of parents
 *
 * @param injectingViewCdRef
 * @param strategy
 * @param notify
 */
export function notifyInjectingParentIfNeeded(
  injectingViewCdRef: ChangeDetectorRef,
  strategy: RxStrategyCredentials,
  notify: boolean
): Observable<null> {
  return concat(
    of(null),
    notify
      ? onStrategy(
          null,
          strategy,
          (value, work, options) => {
            // console.log('notify injectingView', injectingViewCdRef);
            work(injectingViewCdRef, options.scope);
          },
          {},
          (error) => toRenderError(error, injectingViewCdRef)
        ).pipe(ignoreElements())
      : (([] as unknown) as Observable<never>)
  );
}

/**
 * @internal
 *
 * Returns an array of observables triggering `detectChanges` on the __virtual parent__  (parent of the projected view)
 *
 * @param tNode - is a component that was projected into another component (virtual parent)
 * @param injectingViewCdRef - is needed to get the
 * @param strategy - the strategy to run the change detection
 */
export function getVirtualParentNotifications$(
  tNode: TNode,
  injectingViewCdRef: ChangeDetectorRef,
  strategy: RxStrategyCredentials
): Observable<Comment>[] {
  const parentElements = extractProjectionParentViewSet(
    injectingViewCdRef,
    tNode
  );
  const behaviors = [];
  for (const parentComponent of parentElements.values()) {
    behaviors.push(
      onStrategy(
        parentComponent,
        strategy,
        // Here we CD the parent to update their projected views scenarios
        (value, work, options) => {
          // console.log('parentComponent', parentComponent);
          detectChanges(parentComponent);
        },
        { scope: parentComponent },
        (error) => toRenderError(error, injectingViewCdRef)
      )
    );
  }
  return behaviors;
}
