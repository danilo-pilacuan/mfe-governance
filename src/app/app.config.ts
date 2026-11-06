import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ApiEnlaceService, ProjectStore, UsuarioStore, sincronizarStores } from '@projecthub/shared';
import { remoteRoutes as routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    ApiEnlaceService,
    ProjectStore,
    UsuarioStore,
    provideAppInitializer(() => sincronizarStores()),
  ]
};