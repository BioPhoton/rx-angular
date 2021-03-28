import { ChangeDetectorRef, Component, TemplateRef, ViewContainerRef } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { LetDirective } from '@rx-angular/template/rx-let';
// tslint:disable-next-line:nx-enforce-module-boundaries
import { mockConsole, MockChangeDetectorRef } from '@test-helpers';
import { RX_ANGULAR_RENDERING_CONFIG } from '@rx-angular/cdk/render-strategies';

@Component({
  template: `
    <ng-container *rxLet="value$; $error as error">{{ error }}</ng-container>
  `
})
class LetDirectiveTestErrorComponent {
  value$: Observable<number> = of(42);
}

const setupLetDirectiveTestComponentError = (): void => {
  TestBed.configureTestingModule({
    declarations: [LetDirectiveTestErrorComponent, LetDirective],
    providers: [
      { provide: ChangeDetectorRef, useClass: MockChangeDetectorRef },
      TemplateRef,
      ViewContainerRef,
      {
        provide: RX_ANGULAR_RENDERING_CONFIG, useValue: {
          primaryStrategy: 'native'
        }
      }
    ]
  });

  fixtureLetDirectiveTestComponent = TestBed.createComponent(
    LetDirectiveTestErrorComponent
  );
  letDirectiveTestComponent =
    fixtureLetDirectiveTestComponent.componentInstance;
  componentNativeElement = fixtureLetDirectiveTestComponent.nativeElement;
};

let fixtureLetDirectiveTestComponent: any;
let letDirectiveTestComponent: {
  strategy: any;
  value$: Observable<any> | undefined | null;
};
let componentNativeElement: any;

describe('LetDirective when error', () => {
  beforeAll(() => mockConsole());
  beforeEach(waitForAsync(setupLetDirectiveTestComponentError));

  it('should render the error to false if next or complete', () => {
    letDirectiveTestComponent.value$ = of(1);
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('false');
  });

  it('should render the error to true if one occurs', () => {
    letDirectiveTestComponent.value$ = throwError(new Error('error message'));
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('Error: error message');
  });
});
