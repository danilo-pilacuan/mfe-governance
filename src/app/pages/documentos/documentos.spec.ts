import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SESION_STORE, SesionStore } from '@projecthub/shared';
import { Documentos } from './documentos';

describe('Documentos (mfe-governance)', () => {
  function configurar(): ReturnType<typeof TestBed.createComponent<Documentos>> {
    TestBed.configureTestingModule({
      imports: [Documentos],
      providers: [provideRouter([])],
    });
    return TestBed.createComponent(Documentos);
  }

  it('muestra los entregables de la semilla del primer proyecto y el gate', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('Portal de pagos');
    expect(texto).toContain('Gate de etapa');
    expect(texto).toContain('Acta de planteamiento');
    expect(texto).toContain('Acta de avance de ejecucion');
    expect(texto).toContain('Diana Admin');
  });

  it('muestra el banner de sesion requerida sin usuario activo (1.7)', async () => {
    const fixture = configurar();

    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Sesion requerida');
    expect(el.querySelector('.boton.primario')).toBeNull();
  });

  it('oculta la accion de aprobar para un rol sin permiso (1.5, 1.7)', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-analista');
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    const botones = Array.from(el.querySelectorAll('button')).map((b) => b.textContent ?? '');
    expect(botones.some((t) => t.includes('Aprobar'))).toBe(false);
  });

  it('crea un entregable para la etapa y lo lista como pendiente (3.4)', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-pm');
    await fixture.whenStable();

    fixture.componentInstance.abrirFormulario();
    fixture.componentInstance.formNombre.set('Cronograma maestro');
    fixture.componentInstance.guardar();
    await fixture.whenStable();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Cronograma maestro');
    expect(fixture.componentInstance.formVisible()).toBe(false);
    const pendientes = fixture.componentInstance
      .filas()
      .filter((f) => f.estado === 'Pendiente');
    expect(pendientes.some((f) => f.nombre === 'Cronograma maestro')).toBe(true);
  });

  it('rechaza un entregable sin nombre con el error de la UI', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-pm');
    await fixture.whenStable();

    fixture.componentInstance.abrirFormulario();
    fixture.componentInstance.formNombre.set('   ');
    fixture.componentInstance.guardar();
    await fixture.whenStable();

    expect(fixture.componentInstance.error()).toContain('obligatorio');
    expect(fixture.componentInstance.formVisible()).toBe(true);
  });

  it('aprueba un entregable pendiente con un rol de gobernanza (3.5)', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();

    const pendiente = fixture.componentInstance
      .filas()
      .find((f) => f.nombre === 'Acta de avance de ejecucion');
    expect(pendiente).toBeDefined();
    fixture.componentInstance.aprobar(pendiente!);
    await fixture.whenStable();

    const aprobada = fixture.componentInstance
      .filas()
      .find((f) => f.nombre === 'Acta de avance de ejecucion');
    expect(aprobada?.estado).toBe('Aprobado');
    expect(aprobada?.aprobador).toBe('Diana Admin');
  });

  it('propaga el mensaje del dominio cuando el autor intenta aprobar su propio documento', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();

    fixture.componentInstance.abrirFormulario();
    fixture.componentInstance.formNombre.set('Informe de avance propio');
    fixture.componentInstance.guardar();
    await fixture.whenStable();

    const pendiente = fixture.componentInstance
      .filas()
      .find((f) => f.nombre === 'Informe de avance propio');
    expect(pendiente).toBeDefined();
    fixture.componentInstance.aprobar(pendiente!);
    await fixture.whenStable();

    expect(fixture.componentInstance.error()).toContain('no puede aprobar su propio documento');
    const fila = fixture.componentInstance
      .filas()
      .find((f) => f.nombre === 'Informe de avance propio');
    expect(fila?.estado).toBe('Pendiente');
  });

  it('impide aprobar en un proyecto cancelado por regla de estado (2.4)', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();

    fixture.componentInstance.seleccionarProyecto('p6');
    await fixture.whenStable();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('solo lectura');
    expect(fixture.componentInstance.estadoEditable()).toBe(false);
  });

  it('muestra la lista vacia para un proyecto sin entregables', async () => {
    const fixture = configurar();

    TestBed.inject<SesionStore>(SESION_STORE).seleccionar('u-admin');
    await fixture.whenStable();

    fixture.componentInstance.seleccionarProyecto('p5');
    await fixture.whenStable();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Sin entregables registrados');
  });
});
