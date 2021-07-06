import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const SHOWCASES_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dynamic-counter',
    pathMatch: 'full',
  },
  {
    path: 'dynamic-counter',
    loadChildren: () =>
      import('./dynamic-counter/dynamic-counter.module').then(
        (m) => m.DynamicCounterModule
      ),
  },
  {
    path: 'pokemon-pagination',
    loadChildren: () =>
      import('./pokemon-pagination/pokemon-pagination.module').then(
        (m) => m.PokemonPaginationModule
      ),
  },
  {
    path: 'dnd',
    loadChildren: () =>
      import('./dnd/dnd.component').then(
        (m) => m.DndComponentModule
      )
  },
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(SHOWCASES_ROUTES)],
})
export class IntegrationsShellModule {}
