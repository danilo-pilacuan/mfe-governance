import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

/**
 * Nav interno del remote mfe-governance entre Documentos y Bitacora.
 * En modo federado el app.html del remote no se renderiza (el shell monta
 * las rutas del remote directamente), asi que el nav vive en las paginas.
 */
@Component({
  selector: 'app-nav-governance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-governance.html',
  styleUrl: './nav-governance.scss',
})
export class NavGovernance {
  private readonly router = inject(Router);

  readonly activo = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map((evento) => evento.urlAfterRedirects.startsWith('/governance/bitacora')),
    ),
    { initialValue: this.router.url.startsWith('/governance/bitacora') },
  );
}
