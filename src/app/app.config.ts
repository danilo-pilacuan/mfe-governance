import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ProjectStore, UsuarioStore, proporcionarSincronizacionBackend, REMOTE_MODULE_LOADER } from '@projecthub/shared';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { remoteRoutes as routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    ProjectStore,
    UsuarioStore,
    proporcionarSincronizacionBackend(),
    { provide: REMOTE_MODULE_LOADER, useValue: loadRemoteModule },
  ]
};