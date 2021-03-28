import { EmbeddedViewRef, TemplateRef } from '@angular/core';
import { EMPTY, merge, Observable } from 'rxjs';
import {
  catchError,
  ignoreElements,
  switchMap,
  withLatestFrom,
} from 'rxjs/operators';
import {
  RxCompleteNotification,
  RxErrorNotification,
  RxNextNotification,
  RxNotification,
  RxNotificationKind,
  RxSuspenseNotification,
} from '@rx-angular/cdk/notifications';
import {
  RxCoalescingOptions,
} from '@rx-angular/cdk/coalescing';
import {
  rxBaseTemplateNames,
  RxRenderAware,
  RxRenderSettings,
  RxTemplateSettings,
  RxViewContext,
} from './model';
import {
  getTNode,
  notifyAllParentsIfNeeded,
  notifyInjectingParentIfNeeded,
  createTemplateHandler,
  TNode,
} from './utils';
import { RxStrategyCredentials, onStrategy, createStrategyHandler, RxRenderWork } from '@rx-angular/cdk/render-strategies';

export interface RxTemplateManager<
  T,
  C extends RxViewContext<T>,
  N = rxBaseTemplateNames | string
> extends RxRenderAware<T> {
  addTemplateRef: (name: N, templateRef: TemplateRef<C>) => void;
  // addTrigger: (trigger$: Observable<RxNotification<T>>) => void;
  // activeTemplate: N;
}

/**
 * @internal
 *
 * A factory function that returns a map of projections to turn a notification of a Observable (next, error, complete)
 *
 * @param customNextContext - projection function to provide custom properties as well as override existing
 */
export function notificationKindToViewContext<T>(
  customNextContext: (value: T) => Record<string, unknown>
): RxViewContextMap<T> {
  // @TODO rethink overrides
  return {
    suspense: (notification: RxSuspenseNotification<T>) => {
      const $implicit: T | null | undefined = notification.value as T;
      return {
        $implicit,
        $suspense: true,
        $error: false,
        $complete: false,
        ...customNextContext($implicit),
      };
    },
    next: (notification: RxNextNotification<T>) => {
      const $implicit: T | null | undefined = notification.value as T;
      return {
        $implicit,
        $suspense: false,
        $error: false,
        $complete: false,
        ...customNextContext($implicit),
      };
    },
    error: (notification: RxErrorNotification<T>) => {
      const $implicit: T | null | undefined = notification.value as T;
      return {
        $implicit,
        $complete: false,
        $error: notification.error,
        $suspense: false,
        ...customNextContext($implicit),
      };
    },
    complete: (notification: RxCompleteNotification<T>) => {
      const $implicit: T | null | undefined = notification.value as T;
      return {
        $implicit,
        $error: false,
        $complete: true,
        $suspense: false,
        ...customNextContext($implicit),
      };
    },
  };
}

export type RxViewContextMap<T> = Record<
  RxNotificationKind,
  (value?: any) => Partial<RxViewContext<T>>
>;

export type RxNotificationTemplateNameMap<T, C, N> = Record<
  RxNotificationKind,
  (value?: T, templates?: { get: (name: N) => TemplateRef<C> }) => N
>;

export function createTemplateManager<
  T,
  C extends RxViewContext<T>,
  N = rxBaseTemplateNames | string
>(config: {
  renderSettings: RxRenderSettings<T, C>;
  templateSettings: RxTemplateSettings<T, C>;
  templateTrigger$?: Observable<RxNotification<unknown>>;
  notificationToTemplateName: RxNotificationTemplateNameMap<T, C, N>;
}): RxTemplateManager<T, C, N> {
  const {
    renderSettings,
    notificationToTemplateName,
    templateSettings,
  } = config;
  const {
    defaultStrategyName,
    strategies,
    cdRef: injectingViewCdRef,
    patchZone,
    parent,
    eRef,
  } = renderSettings;

  const tNode: TNode = parent
    ? getTNode(injectingViewCdRef, eRef.nativeElement)
    : false;

  let activeTemplate: N;

  const strategyHandling$ = createStrategyHandler(defaultStrategyName, strategies);
  const templates = createTemplateHandler<N, C>(templateSettings.viewContainerRef);
  const viewContainerRef = templateSettings.viewContainerRef;

  const triggerHandling = config.templateTrigger$ || EMPTY;
  const getContext = notificationKindToViewContext(
    templateSettings.customContext
  );

  const workFactory = patchZone
    ? (work: VoidFunction) => patchZone.run(work)
    : (work: VoidFunction) => work();

  return {
    addTemplateRef: templates.add,
    // addTrigger: triggerHandling.next,
    nextStrategy: strategyHandling$.next,
    render(values$: Observable<RxNotification<T>>): Observable<any> {
      return values$.pipe(
        /* tslint:disable */
        // mergeWith(triggerHandling.trigger$ || EMPTY),
        /* tslint:enable */
        withLatestFrom(strategyHandling$.strategy$),
        // Cancel old renders
        switchMap(([notification, strategy]: [RxNotification<T>, RxStrategyCredentials]) => {
          const kind: RxNotificationKind = notification.kind;
          const value: T = notification.value as T;
          const templateName = notificationToTemplateName[kind](
            value,
            templates
          );

          const template = templates.get(templateName);
          const isNewTemplate = activeTemplate !== templateName;
          const notifyParent = isNewTemplate && parent;
          return merge(
            onStrategy(
              value,
              strategy,
              (v: T, work: RxRenderWork, options: RxCoalescingOptions) => {
                const context = <C>getContext[kind](notification);
                if (isNewTemplate) {
                  // template has changed (undefined => next; suspense => next; ...)
                  // handle remove & insert
                  // remove current view if there is any
                  if (viewContainerRef.length > 0) {
                    // patch removal if needed
                    workFactory(() => viewContainerRef.clear());
                  }
                  // create new view if any
                  if (template) {
                    // createEmbeddedView is already patched, no need for workFactory
                    workFactory(() =>
                      templates.createEmbeddedView(templateName, context)
                    );
                  }
                } else if (template) {
                  // template didn't change, update it
                  // handle update
                  const view = <EmbeddedViewRef<C>>viewContainerRef.get(0);
                  Object.keys(context).forEach((k) => {
                    view.context[k] = context[k];
                  });
                  // update view context, patch if needed
                  workFactory(() => work(view, options.scope, notification));
                }
                activeTemplate = templateName;
              }
              // we don't need to specify any scope here. The template manager is the only one
              // who will call `viewRef#detectChanges` on any of the templates it manages.
              // whenever a new value comes in, any pre-scheduled work of this taskManager will
              // be nooped before a new work will be scheduled. This happens because of the implementation
              // of `StrategyCredential#behavior`
            ).pipe(
              notifyAllParentsIfNeeded(
                tNode,
                injectingViewCdRef,
                strategy,
                () => notifyParent
              )
            ),
            notifyInjectingParentIfNeeded(
              injectingViewCdRef,
              strategy,
              isNewTemplate
            ).pipe(ignoreElements())
          );
        }),
        catchError((e) => {
          console.error(e);
          return EMPTY;
        })
      );
    },
  };
}
