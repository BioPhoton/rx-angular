import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RxLetModule } from '../../../../rx-angular-pocs';
import { UnpatchEventsModule } from '@rx-angular/template';
import { VisualizerModule } from '../../../../shared/debug-helper/visualizer';
import { V4AComponent } from './v4-a.component';
import { V4BComponent } from './v4-b.component';
import { V4CComponent } from './v4-c.component';
import { V4DComponent } from './v4-d.component';
import { V4EComponent } from './v4-e.component';
import { V4FComponent } from './v4-f.component';
import { V4HComponent } from './v4-h.component';
import { SharedModule } from '../shared/shared.module';
import { MatButtonModule } from '@angular/material/button';
import { PushModule } from '../../../../rx-angular-pocs';
import { DirtyChecksModule } from '../../../../shared/debug-helper/dirty-checks';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    V4AComponent,
    V4BComponent,
    V4CComponent,
    V4DComponent,
    V4EComponent,
    V4FComponent,
    V4HComponent,
  ],
  imports: [
    CommonModule,
    VisualizerModule,
    SharedModule,
    RxLetModule,
    MatButtonModule,
    UnpatchEventsModule,
    UnpatchEventsModule,
    RxLetModule,
    PushModule,
    DirtyChecksModule,
    ReactiveFormsModule
  ],
  exports: [V4AComponent]
})
export class RxFormVModule { }
