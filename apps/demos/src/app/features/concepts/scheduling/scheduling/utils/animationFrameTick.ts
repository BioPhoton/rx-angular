import { Observable } from 'rxjs';
import { getZoneUnPatchedApi } from '@rx-angular/cdk/zone-less';

export const animationFrameTick = () =>
  new Observable<number>((subscriber) => {
    const id = getZoneUnPatchedApi('requestAnimationFrame')(() => {
      subscriber.next(0);
      subscriber.complete();
    });

    return () => {
      getZoneUnPatchedApi('cancelAnimationFrame')(id);
    };
  });
