import { RX_ANGULAR_RENDERING_CONFIG } from '@rx-angular/cdk/render-strategies';
import { PushPipe } from '../src/push.pipe';
import { TestBed } from '@angular/core/testing';
import { ChangeDetectorRef, Component } from '@angular/core';
import { EMPTY, NEVER, Observable, of } from 'rxjs';
// tslint:disable-next-line:nx-enforce-module-boundaries
import { mockConsole } from '@test-helpers';

function wrapWithSpace(str: string): string {
  return ' ' + str + ' ';
}

@Component({
  template: `
    {{ (value$ | push | json) || 'undefined' }}
  `
})
class PushPipeTestComponent {
  value$: Observable<number> = of(42);
}


@Component({
  template: `
    <p id="p1">{{ (value$ | push | json) || 'undefined' }}</p>
    <p id="p2">{{ (value$ | push | json) || 'undefined' }}</p>
    <p id="p3">{{ (value$ | push | json) || 'undefined' }}</p>
  `
})
class PushPipeMultipleTestComponent {
  value$: Observable<number> = of(42);
}

let fixturePushPipeTestComponent: any;
let pushPipeTestComponent: {
  value$: Observable<any> | undefined | null;
};
let componentNativeElement: any;

const setupPushPipeComponent = () => {
  TestBed.configureTestingModule({
    declarations: [PushPipe, PushPipeTestComponent],
    providers: [ChangeDetectorRef, {
      provide: RX_ANGULAR_RENDERING_CONFIG, useValue: {
        primaryStrategy: 'native'
      }
    }]
  });

  fixturePushPipeTestComponent = TestBed.createComponent(PushPipeTestComponent);
  pushPipeTestComponent = fixturePushPipeTestComponent.componentInstance;
  componentNativeElement = fixturePushPipeTestComponent.nativeElement;
};

describe('PushPipe used as pipe in the template', () => {
  beforeAll(() => mockConsole());

  beforeEach(setupPushPipeComponent);

  it('should be instantiable', () => {
    expect(fixturePushPipeTestComponent).toBeDefined();
    expect(pushPipeTestComponent).toBeDefined();
    expect(componentNativeElement).toBeDefined();
  });

  it('should return undefined as value when initially undefined was passed (as no value ever was emitted)', () => {
    pushPipeTestComponent.value$ = undefined;
    fixturePushPipeTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe(wrapWithSpace('undefined'));
  });

  it('should return null as value when initially null was passed (as no value ever was emitted)', () => {
    pushPipeTestComponent.value$ = null;
    fixturePushPipeTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe(wrapWithSpace('null'));
  });

  it('should return undefined as value when initially of(undefined) was passed (as undefined was emitted)', () => {
    pushPipeTestComponent.value$ = of(undefined);
    fixturePushPipeTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe(wrapWithSpace('undefined'));
  });

  it('should return null as value when initially of(null) was passed (as null was emitted)', () => {
    pushPipeTestComponent.value$ = of(null);
    fixturePushPipeTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe(wrapWithSpace('null'));
  });

  it('should return undefined as value when initially EMPTY was passed (as no value ever was emitted)', () => {
    pushPipeTestComponent.value$ = EMPTY;
    fixturePushPipeTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe(wrapWithSpace('undefined'));
  });

  it('should return undefined as value when initially NEVER was passed (as no value ever was emitted)', () => {
    pushPipeTestComponent.value$ = NEVER;
    fixturePushPipeTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe(wrapWithSpace('undefined'));
  });

  it('should emitted value from passed observable without changing it', () => {
    pushPipeTestComponent.value$ = of(42);
    fixturePushPipeTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe(wrapWithSpace('42'));
  });

  it('should return undefined as value when a new observable NEVER was passed (as no value ever was emitted from new observable)', () => {
    pushPipeTestComponent.value$ = of(42);
    fixturePushPipeTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe(wrapWithSpace('42'));
    pushPipeTestComponent.value$ = of(43);
    fixturePushPipeTestComponent.detectChanges();
    expect(componentNativeElement.textContent).toBe(wrapWithSpace('43'));
  });
});
