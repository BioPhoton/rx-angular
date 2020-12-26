import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { ROUTES } from './nested-component-structure.routes';
import { MatButtonModule } from '@angular/material/button';
import { PushModule, LetModule, PushModule, UnpatchEventsModule } from '@rx-angular/template';
import { DirtyChecksModule } from '../../../shared/debug-helper/dirty-checks';
import { NestedComponentStructureComponent } from './nested-component-structure.component';
import { VisualizerModule } from '../../../shared/debug-helper/visualizer';
import { CdTriggerModule } from '../../../shared/debug-helper/cd-trigger/cd-trigger.module';
import { ValueProvidersModule } from '../../../shared/debug-helper/value-provider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { RenderingsModule } from '../../../shared/debug-helper/renderings';
import { RecursiveModule } from '../../../shared/template-structures/recursive/recursive.module';


@NgModule({
  declarations: [
    NestedComponentStructureComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(ROUTES),
    MatButtonModule,
    DirtyChecksModule,
    UnpatchEventsModule,
    PushModule,
    VisualizerModule,
    CdTriggerModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ValueProvidersModule,
    MatButtonToggleModule,
    RenderingsModule,
    LetModule, PushModule,
    RecursiveModule
  ],
  exports: []
})
export class NestedComponentStructureModule {
}
