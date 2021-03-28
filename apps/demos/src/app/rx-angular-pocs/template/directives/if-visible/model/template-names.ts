import { RxBaseTemplateNames, rxBaseTemplateNames } from '@rx-angular/cdk/template-management';

export type rxIfVisibleTemplateNames = 'viewTpl' | rxBaseTemplateNames;

export const RxIfVisibleTemplateNames = {
  ...RxBaseTemplateNames,
  view: 'viewTpl'
} as const;
