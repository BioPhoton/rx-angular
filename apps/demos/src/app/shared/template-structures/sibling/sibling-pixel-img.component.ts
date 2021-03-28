import { ChangeDetectionStrategy, Component, Inject, Input } from '@angular/core';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';
import { Observable } from 'rxjs';
import { RxState, selectSlice } from '@rx-angular/state';
import { map } from 'rxjs/operators';
import { toInt } from '../../debug-helper/value-provider';
import { ImgInfo } from '../../image-array';
import { computeColorPrio } from '../../image-array/pixel-image';

const chunk = (arr, n) => arr.length ? [arr.slice(0, n), ...chunk(arr.slice(n), n)] : [];

@Component({
  selector: 'rxa-sibling-pixel-img',
  template: `
    <div class="pixel-map" [style.width.px]="width" *rxLet="width$, let width; strategy:'reactNormal'">
      <ng-container *ngFor="let sibling of pixelArray$ | push; trackBy:trackBy">
        <div class="pixel"
             [style.width.px]="pixelSize$ | push"
             [style.height.px]="pixelSize$ | push">
          <div *rxLet="color$; let c; strategy: get('colorPriority').get(sibling)"
               [ngStyle]="{background: c ? c : sibling}">
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .pixel-map {
      display: flex;
      flex-wrap: wrap;
    }

    .pixel {
      position: relative;
      min-width: 3px;
      min-height: 3px;
      padding: 0px;
      background-color: transparent;
    }

    .pixel div {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .pixel div.filled {
      background-color: orange;
    }

  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiblingPixelImgComponent extends RxState<{
  pixelArray: string[],
  pixelSize: number,
  width: number,
  colorPriority: Map<string, string>,
  filled: boolean
  fillColor: string
} & ImgInfo> {

  width$ = this.select(map(s => s.width * s.pixelSize));
  pixelArray$ = this.select('pixelArray');
  pixelSize$ = this.select('pixelSize');
  fillColor$ = this.select('fillColor');
  color$ = this.select(selectSlice(['filled', 'fillColor']),
    map(({ filled, fillColor }) => filled ? fillColor : '')
  );

  @Input()
  set imgInfo(imgInfo$: Observable<ImgInfo>) {
    this.connect(imgInfo$.pipe(map(i => ({
      ...i,
      colorPriority: computeColorPrio(i.colors)
    }))));
  };

  @Input()
  set pixelSize(pixelSize$: Observable<number | string>) {
    // tslint:disable-next-line:no-bitwise
    this.connect('pixelSize', pixelSize$.pipe(map(v => +v)));
  }

  @Input()
  set filled(filled$: Observable<boolean>) {
    this.connect('filled', filled$);
  }

  @Input()
  set fillColor(fillColor$: Observable<string>) {
    this.connect('fillColor', fillColor$);
  }

  trackBy = i => i;

  constructor(
    private strategyProvider: RxStrategyProvider
  ) {
    super();
    this.set({
      filled: false,
      pixelSize: 5,
      width: 5
    });
  }

  getStrategy(color: any) {
    return this.get('colorPriority').get(color);
    const [r, g, b, a] = color.replaceAll(')', '').replaceAll('rgba(', '').split(',');
    const transparency = a === '0';
    const black = [
      '000',
      '323232',
      '2061530',
      '137137137',
      '101101101',
      '858585',
      '206206206'
    ].includes([r, g, b].join(''));
    const rand = Object.keys(this.strategyProvider.strategies[this.strategyProvider.primaryStrategy])[toInt(undefined, 0, this.strategyProvider.strategyNames.length)];

    return transparency ? 'reactIdle' : black ? 'reactImmediate' : 'reactNormal';
  }

}

