import { MENU_ITEMS as DYNAMIC_COUNTER_MENU } from './dynamic-counter/dynamic-counter.menu';

export const INTEGRATIONS_MENU_ITEMS = [
  {
    label: 'Dynamic Counter',
    link: 'dynamic-counter',
    children: DYNAMIC_COUNTER_MENU,
  },
  {
    label: 'Pokemon API w/ Pagination',
    link: 'pokemon-pagination',
  },
  {
    label: 'dnd',
    link: 'dnd',
  },
];
