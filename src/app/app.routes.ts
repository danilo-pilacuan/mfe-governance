import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-governance-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule],
  template: `
    <mat-card class="placeholder">
      <mat-card-header>
        <mat-card-title>Gobernanza</mat-card-title>
        <mat-card-subtitle>Entregables, gates, contratos y riesgos</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p>
          Modulo de gobernanza del sistema documental: aqui se gestionan los entregables de cada
          etapa del ciclo de vida, los gates de avance, los contratos y los riesgos.
        </p>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .placeholder {
      max-width: 640px;
      margin: 1rem auto;
    }
  `,
})
export class PlaceholderComponent {}

export const remoteRoutes: Routes = [
  { path: '', component: PlaceholderComponent },
];
