import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisualizerModule } from '../../../../shared/debug-helper/visualizer';
import { V2AComponent } from './v2-a.component';
import { V2BComponent } from './v2-b.component';
import { V2CComponent } from './v2-c.component';
import { V2DComponent } from './v2-d.component';
import { V2EComponent } from './v2-e.component';
import { V2FComponent } from './v2-f.component';
import { V2HComponent } from './v2-h.component';
import { SharedModule } from '../shared/shared.module';
import { MatButtonModule } from '@angular/material/button';
import { LetModule } from '@rx-angular/template';
import { UnpatchEventsModule, PushModule } from '@rx-angular/template';
import { DirtyChecksModule } from '../../../../shared/debug-helper/dirty-checks';

@NgModule({
  declarations: [
    V2AComponent,
    V2BComponent,
    V2CComponent,
    V2DComponent,
    V2EComponent,
    V2FComponent,
    V2HComponent,
  ],
  imports: [
    CommonModule,
    VisualizerModule,
    SharedModule,
    MatButtonModule,
    UnpatchEventsModule,
    LetModule,
    PushModule,
    DirtyChecksModule
  ],
  exports: [V2AComponent]
})
export class PushVModule { }
