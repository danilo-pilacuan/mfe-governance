import { Routes } from '@angular/router';
import { Documentos } from './pages/documentos/documentos';
import { Bitacora } from './pages/bitacora/bitacora';

export const remoteRoutes: Routes = [
  { path: '', component: Documentos },
  { path: 'bitacora', component: Bitacora },
];
