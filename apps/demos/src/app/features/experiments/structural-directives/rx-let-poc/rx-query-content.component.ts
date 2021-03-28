import { ChangeDetectionStrategy, Component, ContentChild, Directive, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';
import { RxEffects } from '../../../../shared/rx-effects.service';

@Directive({
  selector: '[rxaContentTest]'
})
export class RxQueryContentTestDirective {
}

@Component({
  selector: 'rxa-rx-query-content',
  template: `
    <ng-content select="rxaContentTest"></ng-content>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxEffects]
})
export class RxQueryContentComponent implements OnInit {

  @ContentChild(RxQueryContentTestDirective) contentChild: RxQueryContentTestDirective;

  @Input() value: Observable<any>;

  constructor(
    public strategyProvider: RxStrategyProvider,
    private effects: RxEffects
  ) {
  }

  ngOnInit() {
    this.effects.hold(this.value, () => {
      setTimeout(() => console.log(this.contentChild), 250);
    });
  }

}
