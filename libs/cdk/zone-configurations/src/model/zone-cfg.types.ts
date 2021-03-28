import {
  RxZoneGlobalDisableConfigurationsKey,
  RxZoneGlobalSettingsConfigurationsKey,
  RxZoneTestDisableConfigurationsKey,
  RxZoneTestSettingsConfigurationsKey,
  RxZoneGlobalEventsConfigurationsKey,
  RxZoneRuntimeConfigurationsKey,
} from './configurations.types';

export type RxGlobalDisableConfigurationMethods = {
  [disabledFlag in RxZoneGlobalDisableConfigurationsKey]: () => void;
} &
  {
    [symbolFlag in RxZoneGlobalSettingsConfigurationsKey]: () => void;
  };

export type RxTestDisableConfigurationMethods = {
  [disabledFlag in RxZoneTestDisableConfigurationsKey]: () => void;
} &
  {
    [symbolFlag in RxZoneTestSettingsConfigurationsKey]: () => void;
  };

export type RxZoneGlobalEventsConfigurationsMethods = {
  [disabledFlag in RxZoneGlobalEventsConfigurationsKey]: (
    eventNames: string[]
  ) => void;
};

export type RxRuntimeConfigurationMethods = {
  [disabledFlag in RxZoneRuntimeConfigurationsKey]: () => void;
};

export interface RxZoneConfigConvenienceMethods {
  /**
   * Unpatch all related to XHR
   **/
  unpatchXHR: () => void;
  /**
   * Unpatch passive events https://developers.google.com/web/updates/2016/06/passive-event-listeners
   **/
  useUnpatchedPassiveScrollEvents: () => void;
}

export interface RxZoneConfigConfiguration {
  global: {
    disable: RxGlobalDisableConfigurationMethods;
  };
  test: {
    disable: RxTestDisableConfigurationMethods;
  };
  events: {
    disable: RxZoneGlobalEventsConfigurationsMethods;
  };
  runtime: {
    disable: RxRuntimeConfigurationMethods;
  };
}

export type RxZoneConfig = RxZoneConfigConfiguration & RxZoneConfigConvenienceMethods;
