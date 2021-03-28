import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RxForModule } from '../../../../rx-angular-pocs/template/directives/for/rx-for.module';
import { UnpatchEventsModule } from '@rx-angular/template';
import { ValueProvidersModule } from '../../../../shared/debug-helper/value-provider/value-providers.module';
import { VisualizerModule } from '../../../../shared/debug-helper/visualizer/visualizer.module';
import { StatefulComponent } from './stateful.component';

const routes: Routes = [{
  path: '',
  component: StatefulComponent
}]

@NgModule({
  declarations: [StatefulComponent],
  imports: [
    RouterModule.forChild(routes),
    UnpatchEventsModule,
    RxForModule,
    CommonModule,
    ValueProvidersModule,
    VisualizerModule,
  ],
})
export class StatefulModule {}
