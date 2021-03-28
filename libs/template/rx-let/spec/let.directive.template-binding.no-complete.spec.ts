import { ChangeDetectorRef, Component, TemplateRef, ViewContainerRef } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { EMPTY, Observable, of } from 'rxjs';
import { LetDirective } from '@rx-angular/template/rx-let';
// tslint:disable-next-line:nx-enforce-module-boundaries
import { mockConsole, MockChangeDetectorRef } from '@test-helpers';
import { RX_ANGULAR_RENDERING_CONFIG } from '@rx-angular/cdk/render-strategies';


@Component({
  template: `
    <ng-container *rxLet="value$; let value;">{{
      value === undefined
        ? 'undefined'
        : value === null
        ? 'null'
        : (value | json)
    }}</ng-container>
  `
})
class LetDirectiveNoCompleteTemplateTestComponent {
  value$: Observable<number> = of(1);
}

let fixture: ComponentFixture<LetDirectiveNoCompleteTemplateTestComponent>;
let component: LetDirectiveNoCompleteTemplateTestComponent;
let nativeElement: HTMLElement;

const setupTestComponent = () => {
  TestBed.configureTestingModule({
    declarations: [LetDirectiveNoCompleteTemplateTestComponent, LetDirective],
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
  }).compileComponents();
};

const setUpFixture = () => {
  fixture = TestBed.createComponent(LetDirectiveNoCompleteTemplateTestComponent);
  component = fixture.componentInstance;
  nativeElement = fixture.nativeElement;
};

describe('LetDirective when template binding without "complete" template', () => {
  beforeAll(() => mockConsole());
  beforeEach(waitForAsync(setupTestComponent));
  beforeEach(setUpFixture);

  it('should be initiated', () => {
    expect(component).toBeDefined();
  });

  it('should fallback to and render "next" template when observable completes', () => {
    component.value$ = of(1);
    fixture.detectChanges();
    expectContentToBe('1');
  });

  it('should render undefined when observable completes immediately (by passing EMPTY)', () => {
    component.value$ = EMPTY;
    fixture.detectChanges();
    expectContentToBe('undefined');
  });
});

function expectContentToBe(content: string): void {
  expect(nativeElement.textContent).toBe(content);
}
