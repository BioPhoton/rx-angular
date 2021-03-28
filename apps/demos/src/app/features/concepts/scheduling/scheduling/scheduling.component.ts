import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';

import { Observable, of, Subject } from 'rxjs';
import { scan, tap } from 'rxjs/operators';
import { priorityTickMap, SchedulingPriority } from './utils';

@Component({
  selector: 'rxa-scheduling',
  template: `
    <rxa-visualizer>
      <div visualizerHeader>
        <h2>Scheduling Options</h2>
        <button mat-raised-button [unpatch] (click)="scheduleAllPrios()">
          scheduleAll
        </button>
        <button mat-raised-button [unpatch] (click)="scheduleByPrio()">
          Unscheduled
        </button>
        <button mat-raised-button [unpatch] (click)="scheduleByPrio(prios.Promise)">
          Promise
        </button>
        <button mat-raised-button [unpatch] (click)="scheduleByPrio(prios.setTimeout)">
          setTimeout
        </button>
        <button mat-raised-button [unpatch] (click)="scheduleByPrio(prios.setInterval)">
          setInterval
        </button>
        <button mat-raised-button [unpatch] (click)="scheduleByPrio(prios.animationFrame)">
          animationFrame
        </button>
        <button mat-raised-button [unpatch] (click)="scheduleByPrio(prios.idleCallback)">
          idleCallback
        </button>
        <button mat-raised-button [unpatch] (click)="scheduleByPrio(prios.background)">
          background
        </button>
        <button mat-raised-button [unpatch] (click)="scheduleByPrio(prios.userVisible)">
          userVisible
        </button>
        <button mat-raised-button [unpatch] (click)="scheduleByPrio(prios.userBlocking)">
          userBlocking
        </button>
      </div>
    </rxa-visualizer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
      `
      button:active {
        background: red;
      }
    `
  ]
})
export class SchedulingComponent implements OnInit {
  prios = SchedulingPriority;

  o$ = of(0);

  strategies;
  nextValues = new Subject<any>();
  value$: Observable<string> = this.nextValues.pipe(
    scan(count => ++count),
    tap(v => console.log('count:', v))
  );
  value;

  constructor(private cdRef: ChangeDetectorRef, private strategyProvider: RxStrategyProvider) {
  }

  scheduleAllPrios() {
    const sync = () => {
      this.cdRef.detectChanges();
    };
    const micro = () => {
      this.cdRef.detectChanges();
    };
    const setInterval = () => {
      this.cdRef.detectChanges();
    };
    const setTimeout = () => {
      this.cdRef.detectChanges();
    };
    const animationFrame = () => {
      this.cdRef.detectChanges();
    };
    const idleCallback = () => {
      this.cdRef.detectChanges();
    };
    const userBlocking = () => {
      this.cdRef.detectChanges();
    };
    const userVisible = () => {
      this.cdRef.detectChanges();
    };
    const background = () => {
      this.cdRef.detectChanges();
    };

    sync();
    this.strategyProvider.scheduleCD(this.cdRef, {strategy: ''})
    priorityTickMap[SchedulingPriority.Promise].subscribe(micro);
    priorityTickMap[SchedulingPriority.setTimeout].subscribe(setTimeout);
    priorityTickMap[SchedulingPriority.setInterval].subscribe(setInterval);
    priorityTickMap[SchedulingPriority.animationFrame].subscribe(animationFrame);
    priorityTickMap[SchedulingPriority.idleCallback].subscribe(idleCallback);
    priorityTickMap[SchedulingPriority.background].subscribe(background);
    priorityTickMap[SchedulingPriority.userVisible].subscribe(userVisible);
    priorityTickMap[SchedulingPriority.userBlocking].subscribe(userBlocking);
  }

  scheduleByPrio(priority?: SchedulingPriority) {
    const XXXXXXXXXXXXXXXXXXXXX = () => {
      this.cdRef.detectChanges();
      console.log('scheduled over', priority);
    };

    priority
      ? priorityTickMap[priority].subscribe(XXXXXXXXXXXXXXXXXXXXX)
      : XXXXXXXXXXXXXXXXXXXXX();
  }

  ngOnInit() {
    this.strategies = this.strategyProvider.strategies;
  }
}
