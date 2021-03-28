import {
  ChangeDetectorRef,
  ElementRef,
  EmbeddedViewRef,
  NgZone,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { Observable } from 'rxjs';
import { RxNotification} from '@rx-angular/cdk/notifications';
import { RxStrategies } from '@rx-angular/cdk/render-strategies';

export type rxBaseTemplateNames = 'errorTpl' | 'completeTpl' | 'suspenseTpl';

export enum RxBaseTemplateNames {
  error = 'errorTpl',
  complete = 'completeTpl',
  suspense = 'suspenseTpl',
}

export const enum RxListTemplateChangeType {
  insert,
  remove,
  move,
  update,
  context,
}
export type RxListTemplateChange<T = any> = [RxListTemplateChangeType, T];
export type RxListTemplateChanges<T = any> = [
  RxListTemplateChange<T>[], // changes to apply
  boolean // notify parent
];

export interface RxViewContext<T> {
  // to enable `let` syntax we have to use $implicit (var; let v = var)
  $implicit: T;
  // set context var complete to true (var$; let e = $error)
  $error: false | Error;
  // set context var complete to true (var$; let c = $complete)
  $complete: boolean;
  // set context var suspense to true (var$; let s = $suspense)
  $suspense: any;
}

export interface RxRenderAware<T> {
  nextStrategy: (nextConfig: string | Observable<string>) => void;
  render: (values$: Observable<RxNotification<T>>) => Observable<void>;
}

export interface RxRenderSettings<T, C> {
  cdRef: ChangeDetectorRef;
  eRef: ElementRef;
  parent: boolean;
  patchZone: NgZone | false;
  strategies: RxStrategies<string>;
  defaultStrategyName: string;
}

export type CreateEmbeddedView<C> = (
  viewContainerRef: ViewContainerRef,
  patchZone: NgZone | false
) => (
  templateRef: TemplateRef<C>,
  context?: C,
  index?: number
) => EmbeddedViewRef<C>;

export type CreateViewContext<T, C, U = unknown> = (
  value: T,
  computedContext: U
) => C;

export type UpdateViewContext<T, C, U = unknown> = (
  value: T,
  view: EmbeddedViewRef<C>,
  computedContext?: U
) => void;

export interface RxTemplateSettings<T, C, U = unknown> {
  patchZone: NgZone | false;
  viewContainerRef: ViewContainerRef;
  createViewContext: CreateViewContext<T, C, U>;
  updateViewContext: UpdateViewContext<T, C, U>;
  initialTemplateRef?: TemplateRef<C>;
  customContext?: (value: T) => any;
}
