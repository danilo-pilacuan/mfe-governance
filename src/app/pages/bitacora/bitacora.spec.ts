import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SESION_STORE, SesionStore, Usuario } from '@projecthub/shared';
import { Bitacora } from './bitacora';

/** Usuario autenticado de los tests (equivale a un login exitoso). */
function usuarioSesion(id: string, roles: Array<Usuario['roles'][number]>): Usuario {
  const nombres: Record<string, string> = {
    'u-admin': 'Diana Admin',
    'u-pm': 'Paula ProjectManager',
    'u-analista': 'Andres Analista',
  };
  return {
    id,
    nombre: nombres[id] ?? id,
    correo: id + '@projecthub.local',
    roles,
    activo: true,
  };
}

function fijarSesion(id: string, roles: Array<Usuario['roles'][number]>): void {
  TestBed.inject<SesionStore>(SESION_STORE).fijarUsuario(usuarioSesion(id, roles));
}


describe('Bitacora (mfe-governance)', () => {
  function configurar(): ReturnType<typeof TestBed.createComponent<Bitacora>> {
    TestBed.configureTestingModule({
      imports: [Bitacora],
      providers: [provideRouter([])],
    });
    return TestBed.createComponent(Bitacora);
  }

  it('lista la bitacora de la semilla ordenada de mas reciente a mas antigua', async () => {
    const fixture = configurar();

    fijarSesion('u-admin', ['Admin']);
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Portal de pagos');
    expect(texto).toContain('Modernizacion legado');
    expect(texto).toContain('Sergio Sponsor');
    const fechas = fixture.componentInstance.filas().map((f) => f.fecha);
    expect(fechas.length).toBeGreaterThan(0);
    // La fila mas reciente de la semilla es b5 (15 de oct de 2026, cambio de p6).
    // fechaHora formatea en es-CO 12 h: la semilla guarda 2026-10-15T09:00 -> '04:00 a. m.' (UTC-5).
    expect(fechas[0]).toBe('15 de oct de 2026, 04:00 a. m.');
  });

  it('muestra la transicion de etapa legible y oculta evento en otros tipos', async () => {
    const fixture = configurar();

    fijarSesion('u-admin', ['Admin']);
    await fixture.whenStable();

    const filas = fixture.componentInstance.filas();
    const transicion = filas.find((f) => f.tipoValor === 'transicion');
    expect(transicion?.evento).toContain('->');
    const cambio = filas.find((f) => f.tipoValor === 'cambio');
    expect(cambio?.evento).toBe('-');
  });

  it('filtra por proyecto', async () => {
    const fixture = configurar();

    fijarSesion('u-admin', ['Admin']);
    await fixture.whenStable();

    fixture.componentInstance.seleccionarProyecto('p1');
    await fixture.whenStable();

    const proyectos = fixture.componentInstance.filas().map((f) => f.proyecto);
    expect(proyectos.length).toBeGreaterThan(0);
    expect(proyectos.every((p) => p === 'Portal de pagos')).toBe(true);
  });

  it('filtra por tipo de registro', async () => {
    const fixture = configurar();

    fijarSesion('u-admin', ['Admin']);
    await fixture.whenStable();

    fixture.componentInstance.seleccionarTipo('cambio');
    await fixture.whenStable();

    const tipos = fixture.componentInstance.filas().map((f) => f.tipoValor);
    expect(tipos.length).toBeGreaterThan(0);
    expect(tipos.every((t) => t === 'cambio')).toBe(true);
  });

  it('muestra estado vacio cuando los filtros no arrojan resultados', async () => {
    const fixture = configurar();

    fijarSesion('u-admin', ['Admin']);
    await fixture.whenStable();

    // p5 no tiene registros de bitacora en la semilla.
    fixture.componentInstance.seleccionarProyecto('p5');
    await fixture.whenStable();

    expect(fixture.componentInstance.filas().length).toBe(0);
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Sin registros');
  });

  it('muestra el banner de sesion requerida sin usuario activo (1.7)', async () => {
    const fixture = configurar();

    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Sesion requerida');
    expect(el.querySelector('.pill')).toBeNull();
  });

  it('resuelve el nombre del autor de la bitacora', async () => {
    const fixture = configurar();

    fijarSesion('u-admin', ['Admin']);
    await fixture.whenStable();

    const autores = fixture.componentInstance.filas().map((f) => f.autor);
    expect(autores).toContain('Diana Admin');
    expect(autores).toContain('Sergio Sponsor');
  });

  it('exporta la bitacora como CSV descargable', async () => {
    const fixture = configurar();

    fijarSesion('u-admin', ['Admin']);
    await fixture.whenStable();

    const urls: string[] = [];
    const clickSpy = vi.fn();
    const crearUrlSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockImplementation((blob: Blob | MediaSource) => {
        expect(blob).toBeInstanceOf(Blob);
        urls.push(`blob:mock-${urls.length}`);
        return urls[urls.length - 1];
      });
    const revocarUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickSpy);

    try {
      fixture.componentInstance.exportarCsv();

      expect(crearUrlSpy).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revocarUrlSpy).toHaveBeenCalledWith(urls[0]);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('exporta un CSV sin filas cuando el filtro no arroja resultados', async () => {
    const fixture = configurar();

    fijarSesion('u-admin', ['Admin']);
    await fixture.whenStable();

    fixture.componentInstance.seleccionarProyecto('p5');
    await fixture.whenStable();

    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: Blob | MediaSource) => {
      expect(blob).toBeInstanceOf(Blob);
      return 'blob:mock-vacio';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    try {
      fixture.componentInstance.exportarCsv();
    } finally {
      vi.restoreAllMocks();
    }
  });
});
