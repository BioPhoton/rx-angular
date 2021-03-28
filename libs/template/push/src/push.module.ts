import { NgModule } from '@angular/core';
import { PushPipe } from './push.pipe';

const DECLARATIONS = [PushPipe];

/**
 * @description
 * This module exports the PushPipe
 *
 * @example
 *
 * ```typescript
 * @NgModule({
 *  imports: [PushModule],
 *  //...
 * })
 * export class AppModule {}
 * ```
 *
 */
@NgModule({
  declarations: DECLARATIONS,
  imports: [],
  exports: DECLARATIONS
})
export class PushModule {
}
