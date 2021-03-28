import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';

@Component({
  selector: 'rxa-rx-let-poc',
  template: `
    <rxa-visualizer>
      <div visualizerHeader>
        <h1>*ifVisible and under the fold optimizations</h1>
      </div>
      <div class="mt-5 row w-100 d-flex">
        <div style="margin-top: 300px" class="col-6 dh-embedded-view p-2">
          <div *ifVisible>
            Content Under The Fold
          </div>
        </div>
      </div>
    </rxa-visualizer>
  `,
  changeDetection: ChangeDetectionStrategy.Default,
  host: {
    class: 'm-1 p-1',
    style: 'display: block;'
  },
  providers: []
})
export class IfVisibleComponent {


  log(n) {
    console.log('render', n);
    return n;
  }

}
