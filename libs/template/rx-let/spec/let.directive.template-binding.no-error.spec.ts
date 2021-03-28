import { Component } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Observable, of, Subject } from 'rxjs';
import { LetDirective } from '@rx-angular/template/rx-let';
// tslint:disable-next-line:nx-enforce-module-boundaries
import { mockConsole, MockChangeDetectorRef } from '@test-helpers';
import { RX_ANGULAR_RENDERING_CONFIG } from '@rx-angular/cdk/render-strategies';

@Component({
  template: `
    <ng-container *rxLet="value$; let value; rxSuspense: suspense; rxComplete: complete">{{
      value === undefined
        ? 'undefined'
        : value === null
        ? 'null'
        : (value | json)
    }}</ng-container>

    <ng-template #complete>complete</ng-template>
    <ng-template #suspense>suspense</ng-template>
  `
})
class LetDirectiveNoErrorTemplateTestComponent {
  value$: Observable<number> = of(1);
}

let fixture: ComponentFixture<LetDirectiveNoErrorTemplateTestComponent>;
let component: LetDirectiveNoErrorTemplateTestComponent;
let nativeElement: HTMLElement;

const setupTestComponent = () => {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: RX_ANGULAR_RENDERING_CONFIG, useValue: {
          primaryStrategy: 'native'
        }
      }
    ],
    declarations: [LetDirectiveNoErrorTemplateTestComponent, LetDirective],
  }).compileComponents();
};

const setUpFixture = () => {
  fixture = TestBed.createComponent(LetDirectiveNoErrorTemplateTestComponent);
  component = fixture.componentInstance;
  nativeElement = fixture.nativeElement;
};

describe('LetDirective when template binding without "error" template', () => {
  beforeAll(() => mockConsole());
  beforeEach(waitForAsync(setupTestComponent));
  beforeEach(() => {
    setUpFixture()
  });

  it('should be initiated', () => {
    expect(component).toBeDefined();
  });

  it('should fallback to and render "next" template when observable errors', () => {
    component.value$ = new Subject();
    fixture.detectChanges();

    (component.value$ as Subject<number>).next(1);
    fixture.detectChanges();

    (component.value$ as Subject<number>).error(new Error('test'));
    fixture.detectChanges();

    expectContentToBe('1');
  });

  it('should render undefined when observable errors immediately', () => {
    component.value$ = new Subject();
    fixture.detectChanges();

    (component.value$ as Subject<number>).error(new Error('test'));
    fixture.detectChanges();

    expectContentToBe('undefined');
  });
});

function expectContentToBe(content: string): void {
  expect(nativeElement.textContent).toBe(content);
}
