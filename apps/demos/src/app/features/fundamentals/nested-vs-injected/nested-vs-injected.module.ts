import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ROUTES } from './nested-vs-injected.routes';
import { MatButtonModule } from '@angular/material/button';
import { DirtyChecksModule } from '../../../shared/debug-helper/dirty-checks';
import { UnpatchEventsModule } from '@rx-angular/template';
import { DetectChangesInjectedComponent } from './injected/detect-changes.injected.component';
import { CdDefaultModule } from '../../../shared/debug-helper/cd-default/cd-default.module';
import { VisualizerModule } from '../../../shared/debug-helper/visualizer';
import { CdOnPushModule } from '../../../shared/debug-helper/cd-on-push/cd-on-push.module';
import { CdTriggerModule } from '../../../shared/debug-helper/cd-trigger/cd-trigger.module';
import { DetectChangesNestedComponent } from './nested/detect-changes.nested.component';
import { CdDefault1Component } from './nested/default-1.component';
import { CdDefault2Component } from './nested/default-2.component';
import { CdDefault3Component } from './nested/default-3.component';
import { CdOnPush1Component } from './nested/push-1.component';
import { CdOnPush2Component } from './nested/push-2.component';
import { CdOnPush3Component } from './nested/push-3.component';
import { NestedVsInjectedComponent } from './nested-vs-injected.component';
import { CdDefault4Component } from './nested/default-4.component';

@NgModule({
  declarations: [
    CdDefault1Component,
    CdDefault2Component,
    CdDefault3Component,
    CdDefault4Component,
    CdOnPush1Component,
    CdOnPush2Component,
    CdOnPush3Component,
    DetectChangesInjectedComponent,
    DetectChangesNestedComponent,
    NestedVsInjectedComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(ROUTES),
    MatButtonModule,
    DirtyChecksModule,
    UnpatchEventsModule,
    CdDefaultModule,
    VisualizerModule,
    CdOnPushModule,
    CdTriggerModule
  ]
})
export class NestedVsInjectedModule {
}
