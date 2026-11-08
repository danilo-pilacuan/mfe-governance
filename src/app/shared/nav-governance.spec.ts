import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NavGovernance } from './nav-governance';

@Component({ template: '', standalone: true })
class ComponenteVacio {}

describe('NavGovernance (mfe-governance)', () => {
  function configurar(): ReturnType<typeof TestBed.createComponent<NavGovernance>> {
    TestBed.configureTestingModule({
      imports: [NavGovernance],
      providers: [provideRouter([])],
    });
    return TestBed.createComponent(NavGovernance);
  }

  it('renderiza los enlaces Documentos y Bitacora hacia rutas del remote', async () => {
    const fixture = configurar();
    await fixture.whenStable();

    const enlaces = fixture.nativeElement.querySelectorAll('a');
    expect(enlaces.length).toBe(2);
    expect(enlaces[0].getAttribute('routerlink')).toBe('/governance');
    expect(enlaces[1].getAttribute('routerlink')).toBe('/governance/bitacora');
  });

  it('marca Bitacora como activa cuando la ruta actual es /governance/bitacora', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NavGovernance],
      providers: [
        provideRouter([
          { path: 'governance', component: ComponenteVacio },
          { path: 'governance/bitacora', component: ComponenteVacio },
        ]),
      ],
    });
    const fixture = TestBed.createComponent(NavGovernance);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/governance/bitacora');
    await fixture.whenStable();

    const activos = fixture.nativeElement.querySelectorAll('a.activo');
    expect(activos.length).toBe(1);
    expect(activos[0].textContent?.trim()).toBe('Bitacora');
  });
});
