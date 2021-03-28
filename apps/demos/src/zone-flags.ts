import {
  globalEvents,
  xhrEvents,
  zoneConfig
} from '@rx-angular/cdk/zone-configurations';

//zoneConfig.global.disable.requestAnimationFrame();
//zoneConfig.global.disable.timers();
zoneConfig.events.disable.UNPATCHED_EVENTS([...globalEvents, ...xhrEvents]);
// requestAnimationFrame
//(window as any).__Zone_disable_requestAnimationFrame = true;
// setTimeout, setInterval
//(window as any).__Zone_disable_timers = true;
