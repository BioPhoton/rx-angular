import {  ElementRef } from '@angular/core';

export class MockElementRef<T> extends ElementRef<T> {
  nativeElement = {} as any;
}
