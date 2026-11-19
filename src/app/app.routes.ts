import { Routes } from '@angular/router';
import { Documentos } from './pages/documentos/documentos';
import { Bitacora } from './pages/bitacora/bitacora';
import { Relaciones } from './pages/relaciones/relaciones';

export const remoteRoutes: Routes = [
  { path: '', component: Documentos },
  { path: 'bitacora', component: Bitacora },
  { path: 'relaciones', component: Relaciones },
];
