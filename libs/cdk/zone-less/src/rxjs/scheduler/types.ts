import { Subscription } from 'rxjs';

export interface SchedulerLike {
  now(): number;
  schedule<T>(
    work: (this: SchedulerAction<T>, state?: T) => void,
    delay?: number,
    state?: T
  ): Subscription;
}

export interface SchedulerAction<T> extends Subscription {
  schedule(state?: T, delay?: number): Subscription;
}
