import { Component, ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, EMPTY, Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { RxEffects } from '@rx-angular/state';

// tslint:disable: max-classes-per-file

type TState = string;

class Store {
  state$ = new BehaviorSubject<TState>('');

  select<TResult>(selector: (store: TState) => TResult): Observable<TResult> {
    return this.state$.pipe(map(selector));
  }
}

const selector1 = (state: TState) => `${state}1`;
const selector2 = (state: TState) => `${state}2`;
const selector3 = (state: TState) => `${state}3`;
const selector4 = (state: TState) => `${state}4`;

class Service {
  method1(..._: any[]): void {
  }

  method2(..._: any[]): void {
  }

  method3(..._: any[]): void {
  }

  method4(..._: any[]): void {
  }

  method4OnError(..._: any[]): void {
  }

  method4OnComplete(..._: any[]): void {
  }
}

// tslint:disable-next-line: prefer-on-push-component-change-detection  use-component-selector
@Component({
  template: '',
  providers: [RxEffects]
})
class TestComponent {
  constructor(store: Store, service: Service, effects: RxEffects) {
    effects.register(store.select(selector1), service.method1);
    effects.register(store.select(selector2).pipe(tap(service.method2)));
    effects.register(store.select(selector3).subscribe(service.method3));
    effects.register(store.select(selector4), {
      next: service.method4,
      error: service.method4OnError,
      complete: service.method4OnComplete
    });
  }
}

// tslint:disable-next-line: prefer-on-push-component-change-detection  use-component-selector
@Component({
  template: '',
  providers: [RxEffects]
})
class TestUntilDestroyComponent {
  constructor(store: Store, service: Service, private effects: RxEffects) {
    store.state$.pipe(
      effects.untilDestroy()
    ).subscribe(service.method1);
  }
}

// tslint:disable-next-line: prefer-on-push-component-change-detection  use-component-selector
@Component({
  template: '',
  providers: [RxEffects]
})
class TestUntilEffectComponent {
  constructor(store: Store, service: Service, private effects: RxEffects) {
    const effectId1 = effects.register(store.select((v) => v === 'effectTrigger'), () => void 0);
    store.state$.pipe(
      effects.untilEffect(effectId1)
    ).subscribe(service.method1);

  }
}

// tslint:disable-next-line: prefer-on-push-component-change-detection  use-component-selector
@Component({
  template: '',
  providers: [RxEffects]
})
class TestOnDestroyComponent {
  constructor(store: Store, service: Service, private effects: RxEffects) {
    effects.registerOnDestroy(service.method1);
  }
}

// tslint:disable-next-line: prefer-on-push-component-change-detection  use-component-selector
@Component({
  template: '',
  providers: [RxEffects]
})
class TestUnregisterComponent {
  private readonly effectId1: number;
  private readonly effectId2: number;

  constructor(
    store: Store,
    service: Service,
    private readonly effects: RxEffects
  ) {
    this.effectId1 = effects.register(store.select(selector1), service.method1);
    this.effectId2 = effects.register(
      store.select(selector2).pipe(tap(service.method2))
    );
  }

  cancelEffect1(): void {
    this.effects.unregister(this.effectId1);
  }

  cancelEffect2(): void {
    this.effects.unregister(this.effectId2);
  }
}

describe('RxEffects', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should invoke callback for each value emitted', async () => {
    const service = {
      method1: jest.fn(),
      method2: jest.fn(),
      method3: jest.fn(),
      method4: jest.fn()
    };
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      providers: [Store, { provide: Service, useValue: service }]
    }).compileComponents();
    TestBed.createComponent(TestComponent);
    const store = TestBed.inject(Store);

    store.state$.next('foo');

    expect(service.method1).toHaveBeenCalledWith('foo1');
    expect(service.method2).toHaveBeenCalledWith('foo2');
    expect(service.method3).toHaveBeenCalledWith('foo3');
    expect(service.method4).toHaveBeenCalledWith('foo4');

    store.state$.next('bar');

    expect(service.method1).toHaveBeenCalledWith('bar1');
    expect(service.method2).toHaveBeenCalledWith('bar2');
    expect(service.method3).toHaveBeenCalledWith('bar3');
    expect(service.method4).toHaveBeenCalledWith('bar4');
  });

  test('should unsubscribe when component is destroyed', async () => {
    const service = {
      method1: jest.fn(),
      method2: jest.fn(),
      method3: jest.fn(),
      method4: jest.fn()
    };
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      providers: [Store, { provide: Service, useValue: service }]
    }).compileComponents();
    const fixture = TestBed.createComponent(TestComponent);
    const store = TestBed.inject(Store);

    store.state$.next('foo');

    expect(service.method1).toHaveBeenCalledWith('foo1');
    expect(service.method2).toHaveBeenCalledWith('foo2');
    expect(service.method3).toHaveBeenCalledWith('foo3');
    expect(service.method4).toHaveBeenCalledWith('foo4');

    service.method1.mockClear();
    service.method2.mockClear();
    service.method3.mockClear();
    service.method4.mockClear();

    fixture.destroy();

    store.state$.next('bar');

    expect(service.method1).not.toHaveBeenCalled();
    expect(service.method2).not.toHaveBeenCalled();
    expect(service.method3).not.toHaveBeenCalled();
    expect(service.method4).not.toHaveBeenCalled();
  });

  test('should isolate errors and invoke provided ErrorHandler', async () => {
    const service = {
      method1: () => {
        throw new Error('something went wrong');
      },
      method2: jest.fn(),
      method3: jest.fn(),
      method4: jest.fn()
    };
    const customErrorHandler: ErrorHandler = {
      handleError: jest.fn()
    };
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      providers: [
        Store,
        { provide: Service, useValue: service },
        {
          provide: ErrorHandler,
          useValue: customErrorHandler
        }
      ]
    }).compileComponents();
    TestBed.createComponent(TestComponent);
    const store = TestBed.inject(Store);

    store.state$.next('foo');

    expect(customErrorHandler.handleError).toHaveBeenCalledWith(
      new Error('something went wrong')
    );

    expect(service.method2).toHaveBeenCalledWith('foo2');
    expect(service.method3).toHaveBeenCalledWith('foo3');
    expect(service.method4).toHaveBeenCalledWith('foo4');
  });

  test('should invoke complete callback upon completion', async () => {
    const service = {
      method1: () => {
      },
      method2: () => {
      },
      method3: () => {
      },
      method4: () => {
      },
      method4OnComplete: jest.fn()
    };
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      providers: [Store, { provide: Service, useValue: service }]
    }).compileComponents();
    TestBed.createComponent(TestComponent);
    const store = TestBed.inject(Store);

    store.state$.next('foo');
    store.state$.next('bar');

    expect(service.method4OnComplete).not.toHaveBeenCalled();

    store.state$.complete();

    expect(service.method4OnComplete).toHaveBeenCalled();
  });

  test('should invoke error callback when source observable errors', async () => {
    const service = {
      method1: () => {
      },
      method2: () => {
      },
      method3: () => {
      },
      method4: () => {
      },
      method4OnError: jest.fn()
    };
    jest
      .spyOn(Store.prototype, 'select')
      .mockImplementation((selector) =>
        selector === selector4
          ? throwError(new Error('something went wrong'))
          : EMPTY
      );
    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      providers: [
        Store,
        { provide: Service, useValue: service },
        {
          provide: ErrorHandler, useValue: {
            handleError: () => {
            }
          }
        }
      ]
    }).compileComponents();
    TestBed.createComponent(TestComponent);
    const store = TestBed.inject(Store);

    store.state$.next('foo');

    expect(service.method4OnError).toHaveBeenCalledWith(
      new Error('something went wrong')
    );
  });

  test('should cancel side-effect if unregistered imperatively', async () => {
    const service = {
      method1: jest.fn(),
      method2: jest.fn()
    };
    await TestBed.configureTestingModule({
      declarations: [TestUnregisterComponent],
      providers: [Store, { provide: Service, useValue: service }]
    }).compileComponents();
    const fixture = TestBed.createComponent(TestUnregisterComponent);
    const component = fixture.componentInstance;
    const store = TestBed.inject(Store);

    store.state$.next('foo');

    expect(service.method1).toHaveBeenCalledWith('foo1');
    expect(service.method2).toHaveBeenCalledWith('foo2');

    service.method1.mockClear();
    service.method2.mockClear();
    component.cancelEffect1();
    store.state$.next('bar');

    expect(service.method1).not.toHaveBeenCalled();
    expect(service.method2).toHaveBeenCalledWith('bar2');

    service.method1.mockClear();
    service.method2.mockClear();
    component.cancelEffect2();
    store.state$.next('baz');

    expect(service.method1).not.toHaveBeenCalled();
    expect(service.method2).not.toHaveBeenCalled();
  });

  test('should cancel side-effect if components gets destroyed when using untilDestroy', async () => {
    const service = {
      method1: jest.fn(),
    };
    await TestBed.configureTestingModule({
      declarations: [TestUntilDestroyComponent],
      providers: [Store, { provide: Service, useValue: service }]
    }).compileComponents();
    const fixture = TestBed.createComponent(TestUntilDestroyComponent);
    const component = fixture.componentInstance;
    const store = TestBed.inject(Store);

    expect(service.method1).toHaveBeenCalledWith('');

    service.method1.mockClear();

    (component as any).effects.ngOnDestroy();

    store.state$.next('bar');

    expect(service.method1).not.toHaveBeenCalled();
  });

  test('should cancel side-effect if components gets destroyed when using untilEffect', async () => {
    const service = {
      method1: jest.fn(),
    };
    await TestBed.configureTestingModule({
      declarations: [TestUntilEffectComponent],
      providers: [Store, { provide: Service, useValue: service }]
    }).compileComponents();
    const fixture = TestBed.createComponent(TestUntilEffectComponent);
    const component = fixture.componentInstance;
    const store = TestBed.inject(Store);

    expect(service.method1).toHaveBeenCalledWith('');

    service.method1.mockClear();

    store.state$.next('foo');

    expect(service.method1).not.toHaveBeenCalled();

    store.state$.next('effectTrigger');
    store.state$.next('foo');

    expect(service.method1).not.toHaveBeenCalled();

  });

  test('should cancel side-effect if components gets destroyed when using onDestroy', async () => {
    const service = {
      method1: jest.fn(),
    };
    await TestBed.configureTestingModule({
      declarations: [TestOnDestroyComponent],
      providers: [Store, { provide: Service, useValue: service }]
    }).compileComponents();
    const fixture = TestBed.createComponent(TestOnDestroyComponent);
    const component = fixture.componentInstance;
    const store = TestBed.inject(Store);

    expect(service.method1).not.toHaveBeenCalled();

    service.method1.mockClear();

    (component as any).effects.ngOnDestroy();

    store.state$.next('bar');

    expect(service.method1).toHaveBeenCalled();
  });
});
