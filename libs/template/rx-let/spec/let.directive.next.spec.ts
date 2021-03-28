import { ChangeDetectorRef, Component, TemplateRef, ViewContainerRef } from '@angular/core';
import { EMPTY, interval, NEVER, Observable, of } from 'rxjs';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { take } from 'rxjs/operators';
import { LetDirective } from '@rx-angular/template/rx-let';
// tslint:disable-next-line:nx-enforce-module-boundaries
import { mockConsole, MockChangeDetectorRef } from '@test-helpers';
import { RX_ANGULAR_RENDERING_CONFIG } from '@rx-angular/cdk/render-strategies';

@Component({
  template: `
    <ng-container
      *rxLet="value$; let value">{{
      value === undefined
        ? 'undefined'
        : value === null
        ? 'null'
        : (value | json)
      }}</ng-container>
  `
})
class LetDirectiveTestComponent {
  value$: Observable<number> = of(42);
}

let fixtureLetDirectiveTestComponent: any;
let letDirectiveTestComponent: {
  strategy: any;
  value$: Observable<any> | undefined | null;
};
let componentNativeElement: any;

const setupLetDirectiveTestComponent = (): void => {
  TestBed.configureTestingModule({
    declarations: [LetDirectiveTestComponent, LetDirective],
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
    LetDirectiveTestComponent
  );
  letDirectiveTestComponent =
    fixtureLetDirectiveTestComponent.componentInstance;
  componentNativeElement = fixtureLetDirectiveTestComponent.nativeElement;
};

describe('LetDirective when nexting values', () => {
  beforeAll(() => mockConsole());
  beforeEach((setupLetDirectiveTestComponent));

  it('should be instantiable', () => {
    expect(fixtureLetDirectiveTestComponent).toBeDefined();
    expect(letDirectiveTestComponent).toBeDefined();
    expect(componentNativeElement).toBeDefined();
  });

  it('should render nothing when initially undefined was passed (as no value ever was emitted)', () => {
    letDirectiveTestComponent.value$ = undefined;
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('');
  });

  it('should render null as value when initially null was passed (as no value ever was emitted)', () => {
    letDirectiveTestComponent.value$ = null;
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('null');
  });

  it('should render undefined as value when initially of(undefined) was passed (as undefined was emitted)', () => {
    letDirectiveTestComponent.value$ = of(undefined);
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('undefined');
  });

  it('should render null as value when initially of(null) was passed (as null was emitted)', () => {
    letDirectiveTestComponent.value$ = of(null);
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('null');
  });

  it('should render undefined as value when initially EMPTY was passed (as no value ever was emitted)', () => {
    letDirectiveTestComponent.value$ = EMPTY;
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('undefined');
  });

  it('should render nothing as value when initially NEVER was passed (as no value ever was emitted)', () => {
    letDirectiveTestComponent.value$ = NEVER;
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('');
  });

  it('should render emitted value from passed observable without changing it', () => {
    letDirectiveTestComponent.value$ = of(42);
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('42');
  });

  it('should render undefined as value when a new observable NEVER was passed (as no value ever was emitted from new observable)', () => {
    letDirectiveTestComponent.value$ = of(42);
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('42');
    letDirectiveTestComponent.value$ = NEVER;
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('undefined');
  });

  it('should render new value as value when a new observable was passed', () => {
    letDirectiveTestComponent.value$ = of(42);
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('42');
    letDirectiveTestComponent.value$ = of(45);
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('45');
  });

  it('should render the last value when a new observable was passed', () => {
    letDirectiveTestComponent.value$ = of(42, 45);
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('45');
  });

  it('should render values over time when a new observable was passed', fakeAsync(() => {
    letDirectiveTestComponent.value$ = interval(1000).pipe(take(3));
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('');
    tick(1000);
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('0');
    tick(1000);
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('1');
    tick(1000);
    fixtureLetDirectiveTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe('2');

    tick(1000);
    fixtureLetDirectiveTestComponent.detectChanges();
    // Remains at 2, since that was the last value.
    expect(componentNativeElement.textContent).toBe('2');
  }));
});
