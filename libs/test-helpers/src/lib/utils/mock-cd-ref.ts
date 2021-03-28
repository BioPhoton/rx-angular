import createSpy = jasmine.createSpy;
import { ChangeDetectorRef } from '@angular/core';

export class MockChangeDetectorRef extends ChangeDetectorRef {
  markForCheck = createSpy('markForCheck');
  detectChanges = createSpy('detectChanges');
  detach = createSpy('detach');
  reattach = createSpy('reattach');
  checkNoChanges = createSpy('checkNoChanges');
  context = { a: 'context' };
}
