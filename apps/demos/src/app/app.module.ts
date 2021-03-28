import { NgModule } from '@angular/core';

import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RX_ANGULAR_RENDERING_CONFIG } from '@rx-angular/cdk/render-strategies';
import { AppComponent, AppComponentModule } from './app-component';
import { ENVIRONMENT_SETTINGS } from './shared/environment.token';
import { environment } from '../environments/environment';
import { HttpClientModule } from '@angular/common/http';
import { HomeComponent } from './features/home/home.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppComponentModule
  ],
  providers: [
    {
      provide: ENVIRONMENT_SETTINGS,
      useValue: environment,
    },
    {
      provide: RX_ANGULAR_RENDERING_CONFIG,
      useValue: {
        primaryStrategy: 'normal',
        patchZone: true
      }
    }
  ],
  declarations: [HomeComponent],
  exports: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
