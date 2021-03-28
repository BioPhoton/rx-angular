import { NgModule } from '@angular/core';
import { LetDirective } from './let.directive';

const EXPORTED_DECLARATIONS = [LetDirective];

@NgModule({
  declarations: EXPORTED_DECLARATIONS,
  exports: [EXPORTED_DECLARATIONS]
})
export class LetModule {
}
