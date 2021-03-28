import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

import { RouterModule } from '@angular/router';
import { ROUTES } from './rx-if.routes';
import { RxIfBasicComponent } from './rx-if-basic.component';
import { VisualizerModule } from '../../../shared/debug-helper/visualizer';
import { UnpatchEventsModule } from '@rx-angular/template';
import { ValueModule } from '../../../shared/debug-helper/value-provider/value/value.module';
import { StrategySelectModule } from '../../../shared/debug-helper/strategy-select';
import { ValueProvidersModule } from '../../../shared/debug-helper/value-provider';
import { GhostElementsModule } from '../../../shared/ghost-elements';
import { DirtyChecksModule } from '../../../shared/debug-helper/dirty-checks';
import { RxIfModule } from '../../../rx-angular-pocs';

const DECLARATIONS = [RxIfBasicComponent];

@NgModule({
  declarations: DECLARATIONS,
  imports: [
    CommonModule,
    VisualizerModule,
    UnpatchEventsModule,
    MatButtonModule,
    DirtyChecksModule,
    ValueModule,
    GhostElementsModule,
    ValueProvidersModule,
    StrategySelectModule,
    RouterModule.forChild(ROUTES),
    RxIfModule
  ],
  exports: DECLARATIONS,
})
export class RxIfDemoModule {}
