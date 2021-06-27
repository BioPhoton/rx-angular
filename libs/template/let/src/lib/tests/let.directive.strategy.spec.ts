import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { LetDirective } from '../let.directive';

@Component({
  template: `
    <ng-container *rxLet="value$; let value; strategy: strategy">{{
      (value | json) || 'undefined'
    }}</ng-container>
  `,
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
class LetDirectiveTestComponentStrategy {
  value$: Observable<number> = of(42);
  strategy: string;
}

let fixture: ComponentFixture<LetDirectiveTestComponentStrategy>;
let componentInstance: LetDirectiveTestComponentStrategy;
let componentNativeElement: HTMLElement;

describe('LetDirective strategies', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LetDirectiveTestComponentStrategy, LetDirective],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LetDirectiveTestComponentStrategy);
    componentInstance = fixture.componentInstance;
    componentNativeElement = fixture.nativeElement;
  });

  describe.each([
    [''], /* <- Invalid strategy should fallback. */
    ['invalid'], /* <- Same here. */
    ['noPriority'],
    ['immediate'],
    ['userBlocking'],
    ['normal'],
    ['low'],
    ['idle'],
    ['native'],
  ])('Strategy: %p', (strategy) => {
    it('should render with given strategy', async () => {
      componentInstance.strategy = strategy;

      fixture.detectChanges();
      await fixture.whenStable();

      expect(componentNativeElement.textContent).toBe('42');
    });
  });
});
