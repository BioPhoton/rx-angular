import { ChangeDetectorRef, Component, ElementRef, TemplateRef, ViewContainerRef } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { LetDirective } from '@rx-angular/template/rx-let';
// tslint:disable-next-line:nx-enforce-module-boundaries
import { mockConsole, MockChangeDetectorRef, MockElementRef } from '@test-helpers';
import { RX_ANGULAR_RENDERING_CONFIG, RxDefaultStrategyNames,
  RxStrategyProvider } from '@rx-angular/cdk/render-strategies';

@Component({
  template: `
    <ng-container
      *rxLet="value$; let value; strategy: strategy;"
    >{{ (value | json) || 'undefined' }}</ng-container
    >
  `
})
class LetDirectiveTestComponentStrategy {
  value$: Observable<number> = of(42);
  strategy: string;
}

let fixtureLetDirectiveTestComponent: any;
let letDirectiveTestComponent: LetDirectiveTestComponentStrategy;
let letDirective: LetDirective<number>;
let activeStrategy: RxDefaultStrategyNames;
let componentNativeElement: any;

const setupLetDirectiveTestComponentStrategy = (): void => {
  TestBed.configureTestingModule({
    declarations: [LetDirectiveTestComponentStrategy, LetDirective],
    providers: [
      RxStrategyProvider,
      { provide: ChangeDetectorRef, useClass: MockChangeDetectorRef },
      { provide: ElementRef, useValue: new MockElementRef({}) },
      TemplateRef,
      ViewContainerRef,
      LetDirective,
      {
        provide: RX_ANGULAR_RENDERING_CONFIG, useValue: {
          primaryStrategy: 'native'
        }
      }
    ]
  });
  fixtureLetDirectiveTestComponent = TestBed.createComponent(
    LetDirectiveTestComponentStrategy
  );
  letDirectiveTestComponent =
    fixtureLetDirectiveTestComponent.componentInstance;
  letDirective = fixtureLetDirectiveTestComponent.debugElement.injector.get(LetDirective);
  activeStrategy = letDirective['strategyProvider'].primaryStrategy as any;
  letDirective['strategyHandler'].values$.subscribe((as: any) => {
    activeStrategy = as
  });
  componentNativeElement = fixtureLetDirectiveTestComponent.nativeElement;
};

describe('LetDirective when using strategy', () => {
  beforeAll(() => mockConsole());
  beforeEach(setupLetDirectiveTestComponentStrategy);

  it('should work with different if a strategy other than the default', () => {
    letDirectiveTestComponent.value$ = of(1, 2, 3, 4, 5);
    letDirectiveTestComponent.strategy = 'native';
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('5');
  });

  it('should apply default strategy if none is declared by the user', () => {
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(activeStrategy).toEqual(letDirective['strategyProvider'].primaryStrategy);
  });
});
