import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SESION_STORE, SesionStore } from '@projecthub/shared';
import { Bitacora } from './bitacora';

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

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Portal de pagos');
    expect(texto).toContain('Modernizacion legado');
    expect(texto).toContain('Sergio Sponsor');
    const fechas = fixture.componentInstance.filas().map((f) => f.fecha);
    expect(fechas.length).toBeGreaterThan(0);
    // La fila mas reciente de la semilla es b5 (15 de oct de 2026, cambio de p6).
    expect(fechas[0]).toBe('15 de oct de 2026');
  });

  it('muestra la transicion de etapa legible y oculta evento en otros tipos', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();

    const filas = fixture.componentInstance.filas();
    const transicion = filas.find((f) => f.tipoValor === 'transicion');
    expect(transicion?.evento).toContain('->');
    const cambio = filas.find((f) => f.tipoValor === 'cambio');
    expect(cambio?.evento).toBe('-');
  });

  it('filtra por proyecto', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();

    fixture.componentInstance.seleccionarProyecto('p1');
    await fixture.whenStable();

    const proyectos = fixture.componentInstance.filas().map((f) => f.proyecto);
    expect(proyectos.length).toBeGreaterThan(0);
    expect(proyectos.every((p) => p === 'Portal de pagos')).toBe(true);
  });

  it('filtra por tipo de registro', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();

    fixture.componentInstance.seleccionarTipo('cambio');
    await fixture.whenStable();

    const tipos = fixture.componentInstance.filas().map((f) => f.tipoValor);
    expect(tipos.length).toBeGreaterThan(0);
    expect(tipos.every((t) => t === 'cambio')).toBe(true);
  });

  it('muestra estado vacio cuando los filtros no arrojan resultados', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
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

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();

    const autores = fixture.componentInstance.filas().map((f) => f.autor);
    expect(autores).toContain('Diana Admin');
    expect(autores).toContain('Sergio Sponsor');
  });
});
