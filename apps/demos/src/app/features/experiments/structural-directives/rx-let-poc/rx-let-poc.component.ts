import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';

@Component({
  selector: 'rxa-rx-let-poc',
  template: `
    <rxa-visualizer>
      <div visualizerHeader>
        <rxa-strategy-select
          (strategyChange)="strategyProvider.primaryStrategy = $event"
        >
        </rxa-strategy-select>
        <rxa-trigger-provider
          #triggers="rxaTriggerProvider"
        ></rxa-trigger-provider>
        <br />
        <rxa-value-provider
          [buttons]="true"
          #v="rxaValueProvider"
        ></rxa-value-provider>
      </div>
      <div class="mt-5 row w-100 d-flex">
        <div class="col-6 dh-embedded-view p-2">
          <ng-template #suspense>
            <rxa-list-item-ghost></rxa-list-item-ghost>
          </ng-template>
          <div
            *rxLet="
              v.incremental$;
              let n;
              suspenseTrg: triggers.suspense$;
              errorTrg: triggers.error$;
              completeTrg: triggers.complete$;
              let s = $suspenseVal;
              let e = $errorVal;
              let c = $completeVal
            "
          >
            <mat-progress-bar
              *ngIf="s"
              color="primary"
              mode="indeterminate"
            ></mat-progress-bar>
            <rxa-dirty-check></rxa-dirty-check>
            n: {{ n }} s: {{ s }}, e: {{ e }}, c: {{ c }}
          </div>
        </div>
        <div class="col-6 dh-embedded-view p-2">
          <div
            *rxLet="
              v.incremental$;
              let n;
              errorTpl: error;
              completeTpl: complete;
              suspenseTpl: suspense;
              suspenseTrg: triggers.suspense$;
              errorTrg: triggers.error$;
              completeTrg: triggers.complete$
            "
          >
            <rxa-dirty-check></rxa-dirty-check>
            n: {{ n }}
          </div>
          <ng-template #suspense>
            <rxa-list-item-ghost></rxa-list-item-ghost>
          </ng-template>
          <ng-template #error>
            <rxa-dirty-check></rxa-dirty-check>
            ERROR
          </ng-template>
          <ng-template #complete>
            <rxa-dirty-check></rxa-dirty-check>
            COMPLETE
          </ng-template>
        </div>
      </div>
    </rxa-visualizer>
  `,
  changeDetection: ChangeDetectionStrategy.Default,
  host: {
    class: 'm-1 p-1',
    style: 'display: block;',
  },
  providers: [],
})
export class RxLetPocComponent {
  constructor(public strategyProvider: RxStrategyProvider) {}
}
