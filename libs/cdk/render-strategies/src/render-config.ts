import { InjectionToken } from '@angular/core';
import { RenderConfig } from './model';

export const RX_ANGULAR_RENDERING_CONFIG = new InjectionToken<RenderConfig<string>>(
  'rx-angular-rendering-config'
);
