import {
  zoneConfig,
  ZoneGlobalConfigurations,
  ZoneTestConfigurations,
  ZoneRuntimeConfigurations,
  ZoneFlagsHelperFunctions
} from '@rx-angular/cdk/zone-configurations';
import createSpy = jasmine.createSpy;

describe('zone-config', () => {

  const w = window as ZoneGlobalConfigurations &
    ZoneTestConfigurations &
    ZoneRuntimeConfigurations &
    ZoneFlagsHelperFunctions & { console: { log: () => void } }
    & { Zone?: any };

  beforeAll(() => {
    w.Zone = undefined;
  });

  beforeEach(() => {
    Object.keys(w).filter(key=>key.toLowerCase().startsWith('__zone')).forEach(key=>{
      delete w[key]
    })
  });

  it('should be created', () => {
    expect(zoneConfig).toBeTruthy();
  });

  describe('global flags', () => {
    it('should have global and disable flags present', () => {
      expect(typeof zoneConfig.global).toBe('object');
      expect(typeof zoneConfig.global.disable).toBe('object');
    });

    it('should have EventEmitter present', () => {
      expect(typeof zoneConfig.global.disable.EventEmitter).toBe('function');
      expect(w.__Zone_disable_EventEmitter).toBe(undefined);
      zoneConfig.global.disable.EventEmitter();
      expect(w.__Zone_disable_EventEmitter).toBe(true);
    });

    it('should have fs present', () => {
      expect(typeof zoneConfig.global.disable.fs).toBe('function');
      expect(w.__Zone_disable_fs).toBe(undefined);
      zoneConfig.global.disable.fs();
      expect(w.__Zone_disable_fs).toBe(true);
    });

    it('should have node_timers present', () => {
      expect(typeof zoneConfig.global.disable.node_timers).toBe('function');
      expect(w.__Zone_disable_node_timers).toBe(undefined);
      zoneConfig.global.disable.node_timers();
      expect(w.__Zone_disable_node_timers).toBe(true);
    });

    it('should have nextTick present', () => {
      expect(typeof zoneConfig.global.disable.nextTick).toBe('function');
      expect(w.__Zone_disable_nextTick).toBe(undefined);
      zoneConfig.global.disable.nextTick();
      expect(w.__Zone_disable_nextTick).toBe(true);
    });

    it('should have crypto present', () => {
      expect(typeof zoneConfig.global.disable.crypto).toBe('function');
      expect(w.__Zone_disable_crypto).toBe(undefined);
      zoneConfig.global.disable.crypto();
      expect(w.__Zone_disable_crypto).toBe(true);
    });

    it('should have defineProperty present', () => {
      expect(typeof zoneConfig.global.disable.defineProperty).toBe('function');
      expect(w.__Zone_disable_defineProperty).toBe(undefined);
      zoneConfig.global.disable.defineProperty();
      expect(w.__Zone_disable_defineProperty).toBe(true);
    });

    it('should have registerElement present', () => {
      expect(typeof zoneConfig.global.disable.registerElement).toBe('function');
      expect(w.__Zone_disable_registerElement).toBe(undefined);
      zoneConfig.global.disable.registerElement();
      expect(w.__Zone_disable_registerElement).toBe(true);
    });

    it('should have EventTargetLegacy present', () => {
      expect(typeof zoneConfig.global.disable.EventTargetLegacy).toBe('function');
      expect(w.__Zone_disable_EventTargetLegacy).toBe(undefined);
      zoneConfig.global.disable.EventTargetLegacy();
      expect(w.__Zone_disable_EventTargetLegacy).toBe(true);
    });

    it('should have timers present', () => {
      expect(typeof zoneConfig.global.disable.timers).toBe('function');
      expect(w.__Zone_disable_timers).toBe(undefined);
      zoneConfig.global.disable.timers();
      expect(w.__Zone_disable_timers).toBe(true);
    });

    it('should have blocking present', () => {
      expect(typeof zoneConfig.global.disable.blocking).toBe('function');
      expect(w.__Zone_disable_blocking).toBe(undefined);
      zoneConfig.global.disable.blocking();
      expect(w.__Zone_disable_blocking).toBe(true);
    });

    it('should have EventTarget present', () => {
      expect(typeof zoneConfig.global.disable.EventTarget).toBe('function');
      expect(w.__Zone_disable_EventTarget).toBe(undefined);
      zoneConfig.global.disable.EventTarget();
      expect(w.__Zone_disable_EventTarget).toBe(true);
    });

    it('should have FileReader present', () => {
      expect(typeof zoneConfig.global.disable.FileReader).toBe('function');
      expect(w.__Zone_disable_FileReader).toBe(undefined);
      zoneConfig.global.disable.FileReader();
      expect(w.__Zone_disable_FileReader).toBe(true);
    });

    it('should have MutationObserver present', () => {
      expect(typeof zoneConfig.global.disable.MutationObserver).toBe('function');
      expect(w.__Zone_disable_MutationObserver).toBe(undefined);
      zoneConfig.global.disable.MutationObserver();
      expect(w.__Zone_disable_MutationObserver).toBe(true);
    });

    it('should have IntersectionObserver present', () => {
      expect(typeof zoneConfig.global.disable.IntersectionObserver).toBe('function');
      expect(w.__Zone_disable_IntersectionObserver).toBe(undefined);
      zoneConfig.global.disable.IntersectionObserver();
      expect(w.__Zone_disable_IntersectionObserver).toBe(true);
    });

    it('should have on_property present', () => {
      expect(typeof zoneConfig.global.disable.on_property).toBe('function');
      expect(w.__Zone_disable_on_property).toBe(undefined);
      zoneConfig.global.disable.on_property();
      expect(w.__Zone_disable_on_property).toBe(true);
    });

    it('should have customElements present', () => {
      expect(typeof zoneConfig.global.disable.customElements).toBe('function');
      expect(w.__Zone_disable_customElements).toBe(undefined);
      zoneConfig.global.disable.customElements();
      expect(w.__Zone_disable_customElements).toBe(true);
    });

    it('should have XHR present', () => {
      expect(typeof zoneConfig.global.disable.XHR).toBe('function');
      expect(w.__Zone_disable_XHR).toBe(undefined);
      zoneConfig.global.disable.XHR();
      expect(w.__Zone_disable_XHR).toBe(true);
    });

    it('should have geolocation present', () => {
      expect(typeof zoneConfig.global.disable.geolocation).toBe('function');
      expect(w.__Zone_disable_geolocation).toBe(undefined);
      zoneConfig.global.disable.geolocation();
      expect(w.__Zone_disable_geolocation).toBe(true);
    });

    it('should have canvas present', () => {
      expect(typeof zoneConfig.global.disable.canvas).toBe('function');
      expect(w.__Zone_disable_canvas).toBe(undefined);
      zoneConfig.global.disable.canvas();
      expect(w.__Zone_disable_canvas).toBe(true);
    });

    it('should have ZoneAwarePromise present', () => {
      expect(typeof zoneConfig.global.disable.ZoneAwarePromise).toBe('function');
      expect(w.__Zone_disable_ZoneAwarePromise).toBe(undefined);
      zoneConfig.global.disable.ZoneAwarePromise();
      expect(w.__Zone_disable_ZoneAwarePromise).toBe(true);
    });

    it('should have DISABLE_WRAPPING_UNCAUGHT_PROMISE_REJECTION present', () => {
      expect(typeof zoneConfig.global.disable.DISABLE_WRAPPING_UNCAUGHT_PROMISE_REJECTION).toBe('function');
      expect(w.__zone_symbol__DISABLE_WRAPPING_UNCAUGHT_PROMISE_REJECTION).toBe(undefined);
      zoneConfig.global.disable.DISABLE_WRAPPING_UNCAUGHT_PROMISE_REJECTION();
      expect(w.__zone_symbol__DISABLE_WRAPPING_UNCAUGHT_PROMISE_REJECTION).toBe(true);
    });

  });

  describe('test flags', () => {
    it('should have test flags present', () => {
      expect(typeof zoneConfig.test).toBe('object');
    });

    it('should have test and disable flags present', () => {
      expect(typeof zoneConfig.test.disable).toBe('object');
    });

    it('should have fakeAsyncAutoFakeAsyncWhenClockPatched present', () => {
      expect(typeof zoneConfig.test.disable.fakeAsyncAutoFakeAsyncWhenClockPatched).toBe('function');
      expect(w.__zone_symbol__fakeAsyncAutoFakeAsyncWhenClockPatched).toBe(undefined);
      zoneConfig.test.disable.fakeAsyncAutoFakeAsyncWhenClockPatched();
      expect(w.__zone_symbol__fakeAsyncAutoFakeAsyncWhenClockPatched).toBe(true);
    });

    it('should have fakeAsyncDisablePatchingClock present', () => {
      expect(typeof zoneConfig.test.disable.fakeAsyncDisablePatchingClock).toBe('function');
      expect(w.__zone_symbol__fakeAsyncDisablePatchingClock).toBe(undefined);
      zoneConfig.test.disable.fakeAsyncDisablePatchingClock();
      expect(w.__zone_symbol__fakeAsyncDisablePatchingClock).toBe(true);
    });

    it('should have supportWaitUnResolvedChainedPromise present', () => {
      expect(typeof zoneConfig.test.disable.supportWaitUnResolvedChainedPromise).toBe('function');
      expect(w.__zone_symbol__supportWaitUnResolvedChainedPromise).toBe(undefined);
      zoneConfig.test.disable.supportWaitUnResolvedChainedPromise();
      expect(w.__zone_symbol__supportWaitUnResolvedChainedPromise).toBe(true);
    });

    it('should have jasmine present', () => {
      expect(typeof zoneConfig.test.disable.jasmine).toBe('function');
      expect(w.__Zone_disable_jasmine).toBe(undefined);
      zoneConfig.test.disable.jasmine();
      expect(w.__Zone_disable_jasmine).toBe(true);
    });

    it('should have jest present', () => {
      expect(typeof zoneConfig.test.disable.jest).toBe('function');
      expect(w.__Zone_disable_jest).toBe(undefined);
      zoneConfig.test.disable.jest();
      expect(w.__Zone_disable_jest).toBe(true);
    });

    it('should have mocha( present', () => {
      expect(typeof zoneConfig.test.disable.mocha).toBe('function');
      expect(w.__Zone_disable_mocha).toBe(undefined);
      zoneConfig.test.disable.mocha();
      expect(w.__Zone_disable_mocha).toBe(true);
    });

  });

  describe('events flags', () => {
    it('should have events flags present', () => {
      expect(typeof zoneConfig.events).toBe('object');
    });

    it('should have runtime and disable flags present', () => {
      expect(typeof zoneConfig.runtime.disable).toBe('object');
    });

    it('should have PASSIVE_EVENTS present', () => {
      expect(typeof zoneConfig.events.disable.PASSIVE_EVENTS).toBe('function');
      expect(w.__zone_symbol__PASSIVE_EVENTS).toBe(undefined);
      zoneConfig.events.disable.PASSIVE_EVENTS(['test']);
      expect(w.__zone_symbol__PASSIVE_EVENTS).toStrictEqual(['test']);
    });

    it('should have UNPATCHED_EVENTS present', () => {
      expect(typeof zoneConfig.events.disable.UNPATCHED_EVENTS).toBe('function');
      expect(w.__zone_symbol__UNPATCHED_EVENTS).toBe(undefined);
      zoneConfig.events.disable.UNPATCHED_EVENTS(['test']);
      expect(w.__zone_symbol__UNPATCHED_EVENTS).toStrictEqual(['test']);
    });

  });

  describe('runtime flags', () => {
    it('should have runtime flags present', () => {
      expect(typeof zoneConfig.runtime).toBe('object');
    });

    it('should have test and disable flags present', () => {
      expect(typeof zoneConfig.runtime.disable).toBe('object');
    });

    it('should have ignoreConsoleErrorUncaughtError present', () => {
      expect(typeof zoneConfig.runtime.disable.ignoreConsoleErrorUncaughtError).toBe('function');
      expect(w.__zone_symbol__ignoreConsoleErrorUncaughtError).toBe(undefined);
      zoneConfig.runtime.disable.ignoreConsoleErrorUncaughtError();
      expect(w.__zone_symbol__ignoreConsoleErrorUncaughtError).toBe(true);
    });

  });

  describe('convenience methods', () => {
    it('should have unpatchXHR method', () => {
      zoneConfig.unpatchXHR();
      expect(w.__Zone_disable_XHR).toBe(true);
      expect(w.__zone_symbol__UNPATCHED_EVENTS).toEqual(['load', 'error']);
    });

   it('should have unpatchXHR method', () => {
      zoneConfig.useUnpatchedPassiveScrollEvents();
      expect(w.__zone_symbol__UNPATCHED_EVENTS).toEqual(['scroll']);
      expect(w.__zone_symbol__PASSIVE_EVENTS).toEqual(['scroll']);
    });

  });

  describe('zone-flags log', () => {
    it('should have log function present', () => {
      expect(typeof w.__rxa_zone_config__log).toBe('function');
    });

    it('should log zone-flags if called', () => {
      w.console.log = createSpy('console.log');
      zoneConfig.events.disable.UNPATCHED_EVENTS(['test']);
      zoneConfig.events.disable.PASSIVE_EVENTS(['test']);
      zoneConfig.global.disable.XHR();
      zoneConfig.global.disable.timers();
      w.__rxa_zone_config__log();

      expect(w.console.log).toHaveBeenCalledTimes(4);
    });

  });
});
