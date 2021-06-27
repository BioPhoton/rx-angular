import { isPlatformServer } from '@angular/common';
import { Component, Inject, NgZone, OnInit, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'rx-angular-root',
  template: `
    <div id="let" *rxLet="color$ as color; strategy">{{ color }}</div>
    <div id="push">{{ color$ | push }}</div>
    <div id="unpatch" [unpatch]="['click']" (click)="onClick()"></div>
  `,
})
export class AppComponent implements OnInit {
  color$ = new BehaviorSubject('red');

  constructor(@Inject(PLATFORM_ID) private platformId: string) {}

  ngOnInit() {
    if (isPlatformServer(this.platformId)) {
      this.color$.next('green');
    }
  }

  // Just a dummy method to ensure that the `unpatch` directive is instantiated w/o exceptions
  // on the server side.
  onClick(): void {
    console.log(NgZone.isInAngularZone());
  }
}
