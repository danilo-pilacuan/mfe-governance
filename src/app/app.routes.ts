import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-governance-root',
  standalone: true,
  template: `<h1>Gobernanza</h1><p>Entregables, gates, contratos y riesgos (fase 4 de gobernanza).</p>`,
})
export class PlaceholderComponent {}

export const remoteRoutes: Routes = [
  { path: '', component: PlaceholderComponent },
];
