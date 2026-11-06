import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ProjectStore, UsuarioStore, proporcionarSincronizacionBackend } from '@projecthub/shared';
import { remoteRoutes as routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    ProjectStore,
    UsuarioStore,
    proporcionarSincronizacionBackend(),
  ]
};