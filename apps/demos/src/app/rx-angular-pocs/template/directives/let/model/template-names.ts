import { RxBaseTemplateNames } from '@rx-angular/cdk/template-management';

export type rxLetTemplateNames = 'nextTpl' | RxBaseTemplateNames;

export const RxLetTemplateNames = {
  ...RxBaseTemplateNames,
  next: 'nextTpl',
} as const;
