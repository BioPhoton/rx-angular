import { ɵglobal } from '@angular/core';
import {
  RxZoneFlagsHelperFunctions,
  zoneGlobalDisableConfigurationsKeys,
  zoneGlobalEventsConfigurationsKeys,
  zoneGlobalSettingsConfigurationsKeys,
  zoneRuntimeConfigurationsKeys,
  zoneTestDisableConfigurationsKeys,
  zoneTestSettingsConfigurationsKeys,
} from './model/configurations.types';
import { RxZoneGlobalConfigurations } from './model/zone.configurations.api';
import {
  RxZoneConfigConfiguration,
  RxZoneConfig,
  RxGlobalDisableConfigurationMethods,
  RxTestDisableConfigurationMethods,
  RxZoneGlobalEventsConfigurationsMethods,
  RxRuntimeConfigurationMethods,
} from './model/zone-cfg.types';
import { convenienceMethods } from './convenience-methods';

const zoneDisable = '__Zone_disable_';
const zoneSymbol = '__zone_symbol__';

/**
 * https://angular.io/guide/zone#setting-up-zonejs
 **/
function assertZoneConfig() {
  if ((window as any).Zone !== undefined) {
    // @TODO link to docs
    console.error('zone-flags file needs to get imported before zone.js');
  }
}

const addDisableFlag = (prop: string) => ({
  [prop]: () => {
    assertZoneConfig();
    return ((window as any)[zoneDisable + prop] = true);
  },
});

const addSymbolFlag = (prop: string) => ({
  [prop]: () => {
    assertZoneConfig();
    return ((window as any)[zoneSymbol + prop] = true);
  },
});

const addArraySymbolFlag = (prop: string) => ({
  [prop]: (eventNames: string[]) => {
    assertZoneConfig();
    const w: any = window as any;
    return (w[zoneSymbol + prop] = [
      ...(Array.isArray(w[zoneSymbol + prop]) ? w[zoneSymbol + prop] : []),
      ...eventNames,
    ]);
  },
});

const reduceToObject = <T>(methodsArray: any[]): T => {
  return methodsArray.reduce((map, item) => ({ ...map, ...item }), {} as T);
};

/**
 * factory function to create a `RxZoneConfig` object.
 *
 * @Example
 * import { globalEvents,xhrEvent, zoneConfig} from '@rx-angular/cdk/zone-flags';
 *
 * const zoneConfig = createZoneFlagsConfigurator();
 *
 * zoneConfig.global.disable.requestAnimationFrame();
 * zoneConfig.global.disable.timers();
 * zoneConfig.events.disable.UNPATCHED_EVENTS([...globalEvents, ...xhrEvent]);
 *
 */
function createZoneFlagsConfigurator(): RxZoneConfig {
  const cfg = (ɵglobal as unknown) as RxZoneGlobalConfigurations;
  const configProps = [
    ...[
      ...zoneGlobalDisableConfigurationsKeys,
      ...zoneTestDisableConfigurationsKeys,
    ].map((prop) => zoneDisable + prop),
    ...[
      ...zoneGlobalSettingsConfigurationsKeys,
      ...zoneTestSettingsConfigurationsKeys,
      ...zoneGlobalEventsConfigurationsKeys,
      ...zoneRuntimeConfigurationsKeys,
    ].map((prop) => zoneSymbol + prop),
  ];

  // append as global method for easy debugging
  (cfg as RxZoneFlagsHelperFunctions).__rxa_zone_config__log = (): void => {
    configProps.forEach((flag) => {
      // tslint:disable-next-line:no-unused-expression
      cfg[flag] && console.log(flag, cfg[flag]);
    });
  };

  const zoneConfigObj: RxZoneConfigConfiguration = {
    global: {
      disable: reduceToObject<RxGlobalDisableConfigurationMethods>([
        ...zoneGlobalDisableConfigurationsKeys.map(addDisableFlag),
        ...zoneGlobalSettingsConfigurationsKeys.map(addSymbolFlag),
      ]),
    },
    test: {
      disable: reduceToObject<RxTestDisableConfigurationMethods>([
        ...zoneTestDisableConfigurationsKeys.map(addDisableFlag),
        ...zoneTestSettingsConfigurationsKeys.map(addSymbolFlag),
      ]),
    },
    events: {
      disable: reduceToObject<RxZoneGlobalEventsConfigurationsMethods>(
        zoneGlobalEventsConfigurationsKeys.map(addArraySymbolFlag)
      ),
    },
    runtime: {
      disable: reduceToObject<RxRuntimeConfigurationMethods>(
        zoneRuntimeConfigurationsKeys.map(addSymbolFlag)
      ),
    },
  };

  return {
    ...zoneConfigObj,
    ...convenienceMethods(zoneConfigObj),
  };
}

/**
 * An object for typed zone-flags configuration.
 *
 * @Example
 *
 * create file `zone-flags.ts` parallel to your `polyfills.ts` and insert following content:
 * ```typescript
 * import { globalEvents, xhrEvent, zoneConfig} from '@rx-angular/cdk/zone-flags';
 *
 * zoneConfig.global.disable.requestAnimationFrame();
 * zoneConfig.global.disable.timers();
 * zoneConfig.events.disable.UNPATCHED_EVENTS([...globalEvents, ...xhrEvent]);
 * ```
 * In `polyfills.ts` above the zone import, import `zone-flags.ts`
 *
 * ```typescript
 * import './zone-flags';
 * // Zone JS is required by default for Angular itself.
 * import 'zone.js/dist/zone';
 * ```
 *
 */
export const zoneConfig = createZoneFlagsConfigurator();
