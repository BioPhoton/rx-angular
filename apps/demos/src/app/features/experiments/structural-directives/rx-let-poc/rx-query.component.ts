import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RxStrategyProvider } from '@rx-angular/cdk/render-strategies';
import { RickAndMortyService } from './rick-and-morty.service';
import { query } from 'rx-query';
import { Observable, Subject } from 'rxjs';
import { delay, filter, map, mapTo, pluck, share } from 'rxjs/operators';

@Component({
  selector: 'rxa-rx-query',
  template: `
    <rxa-visualizer>
      <div visualizerHeader>
        <rxa-strategy-select (strategyChange)="strategyProvider.primaryStrategy = $event">
        </rxa-strategy-select>
        <br/>
        <mat-form-field>
          <label>Search</label>
          <input #i matInput type="text" (input)="search$.next(i.value)">
        </mat-form-field>
      </div>
      <div class="mt-5 row w-100 d-flex">
        <div class="col-4 dh-embedded-view p-2">
          <p *rxLet="suspenseTrg$; let n;">
            suspenseTrigger: {{n}}
          </p>
          <p *rxLet="errorTrg$; let n;">
            errorTrigger: {{n}}
          </p>
          <div *rxLet="charactersQueryResult$; let qr;">
            <p>qr.status: {{qr.status}}</p>
            <p>qr.data: {{qr?.data?.results?.length}}</p>
            <p>qr.error: {{qr?.error?.message}}</p>
            <p>qr.retries: {{qr?.retries}}</p>
          </div>
        </div>
        <div class="col-4 dh-embedded-view p-2">
          <div *rxContext="characters$;
           suspenseTpl: suspenseTpl;
            errorTpl: errorTpl;
            suspenseTrg: suspenseTrg$
            errorTrg: errorTrg$
            ">
            <div *rxLet="characters$; let characters;
            let suspenseVal = $suspenseVal;
            let errorVal = $errorVal;
            suspenseTrg: suspenseTrg$
            errorTrg: errorTrg$
            ">suspenseVal : {{suspenseVal}}            <mat-progress-bar *ngIf="suspenseVal" [mode]="suspenseVal"></mat-progress-bar>
              <mat-card *ngIf="errorVal">
                <mat-card-title>Error</mat-card-title>
              </mat-card>
              <ul>
                <li *ngFor="let character of characters">
                  <a [routerLink]="character.id">{{ character.name }}</a>
                </li>
              </ul>
            </div>
          </div>


        </div>
        <div class="col-4 dh-embedded-view p-2">
          <div *rxLet="characters$; let characters;
            suspenseTpl: suspenseTpl;
            errorTpl: errorTpl;
            suspenseTrg: suspenseTrg$
            errorTrg: errorTrg$
            ">
            <ul>
              <li *ngFor="let character of characters">
                <a [routerLink]="character.id">{{ character.name }}</a>
              </li>
            </ul>
          </div>
          <!-- Templates -->
          <ng-template #suspenseTpl>
            <rxa-list-item-ghost [count]="3"></rxa-list-item-ghost>
          </ng-template>
          <ng-template #errorTpl>
            <mat-card>
              <mat-card-title>Error</mat-card-title>
            </mat-card>
          </ng-template>
        </div>
      </div>
    </rxa-visualizer>
  `,
  changeDetection: ChangeDetectionStrategy.Default,
  host: {
    class: 'm-1 p-1',
    style: 'display: block;'
  },
  providers: []
})
export class RxQueryComponent {
  search$ = new Subject<string>();
  charactersQueryResult$: Observable<any> = query(
    'character',
    this.search$,
    (search: string) => this.service.getCharacter({ name: search }).pipe(delay(200))
  );

  loadingMap = {
    'loading': 'query',
    'refreshing': 'indeterminate'
  };
  status$ = this.charactersQueryResult$.pipe(pluck('status'), share());


  suspenseTrg$ = this.status$.pipe(map(s => this.loadingMap[s]), filter(v => !!v));
  characters$ = this.charactersQueryResult$.pipe(map(res => res?.data?.results));
  errorTrg$ = this.charactersQueryResult$.pipe(filter(res => res?.status === 'error'), mapTo(true));

  constructor(public strategyProvider: RxStrategyProvider,
              public service: RickAndMortyService) {
  }

}
