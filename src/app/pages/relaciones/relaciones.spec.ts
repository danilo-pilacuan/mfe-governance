import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProjectStore, SESION_STORE, SesionStore, Usuario } from '@projecthub/shared';
import { Relaciones } from './relaciones';

function usuarioSesion(id: string, roles: Array<Usuario['roles'][number]>): Usuario {
  const nombres: Record<string, string> = {
    'u-admin': 'Diana Admin',
    'u-pm': 'Paula ProjectManager',
  };
  return {
    id,
    nombre: nombres[id] ?? id,
    correo: id + '@projecthub.local',
    roles,
    activo: true,
  };
}

describe('Relaciones (mfe-governance, 16.1)', () => {
  function configurar(): ReturnType<typeof TestBed.createComponent<Relaciones>> {
    TestBed.configureTestingModule({
      imports: [Relaciones],
      providers: [provideRouter([])],
    });
    return TestBed.createComponent<Relaciones>(Relaciones);
  }

  it('muestra el proyecto de semilla y un grafo con sus entregables', async () => {
    const fixture = configurar();
    TestBed.inject<SesionStore>(SESION_STORE).fijarUsuario(usuarioSesion('u-admin', ['Admin']));
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Grafo de relaciones');
    // La semilla trae entregables de p1: el grafo debe tener nodos.
    expect(fixture.componentInstance.grafo().nodos.length).toBeGreaterThan(0);
  });

  it('guarda una relacion valida tras validar en el cliente', async () => {
    const fixture = configurar();
    TestBed.inject<SesionStore>(SESION_STORE).fijarUsuario(usuarioSesion('u-admin', ['Admin']));
    await fixture.whenStable();
    const pagina = fixture.componentInstance;
    pagina.seleccionarProyecto('p1');
    pagina.abrirForm();
    pagina.formOrigen.set('ent-7');
    pagina.formDestino.set('ent-6');
    pagina.formTipo.set('modifica');
    pagina.guardar();
    await fixture.whenStable();
    expect(pagina.error()).toBe('');
    expect(pagina.relaciones().length).toBe(1);
    expect(pagina.relaciones()[0].tipo).toBe('modifica');
    // El store global queda con la relacion (el re-sync la persiste).
    expect(TestBed.inject(ProjectStore).relaciones().length).toBe(1);
  });

  it('rechaza en cliente un autoenlace sin llamar al store', async () => {
    const fixture = configurar();
    TestBed.inject<SesionStore>(SESION_STORE).fijarUsuario(usuarioSesion('u-admin', ['Admin']));
    await fixture.whenStable();
    const pagina = fixture.componentInstance;
    pagina.seleccionarProyecto('p1');
    pagina.abrirForm();
    pagina.formOrigen.set('ent-6');
    pagina.formDestino.set('ent-6');
    pagina.formTipo.set('relacionado');
    pagina.guardar();
    expect(pagina.error()).toContain('consigo mismo');
    expect(pagina.relaciones().length).toBe(0);
  });

  it('rechaza en cliente un par duplicado (incluso en direccion inversa)', async () => {
    const fixture = configurar();
    const sesion = TestBed.inject<SesionStore>(SESION_STORE);
    sesion.fijarUsuario(usuarioSesion('u-admin', ['Admin']));
    await fixture.whenStable();
    const pagina = fixture.componentInstance;
    pagina.seleccionarProyecto('p1');
    pagina.abrirForm();
    pagina.formOrigen.set('ent-6');
    pagina.formDestino.set('ent-7');
    pagina.formTipo.set('derivaDe');
    pagina.guardar();
    expect(pagina.error()).toBe('');
    pagina.abrirForm();
    pagina.formOrigen.set('ent-7');
    pagina.formDestino.set('ent-6');
    pagina.formTipo.set('aclara');
    pagina.guardar();
    expect(pagina.error()).toContain('Ya existe');
    expect(pagina.relaciones().length).toBe(1);
  });

  it('retira una relacion del catalogo', async () => {
    const fixture = configurar();
    TestBed.inject<SesionStore>(SESION_STORE).fijarUsuario(usuarioSesion('u-admin', ['Admin']));
    await fixture.whenStable();
    const pagina = fixture.componentInstance;
    pagina.seleccionarProyecto('p1');
    pagina.abrirForm();
    pagina.formOrigen.set('ent-7');
    pagina.formDestino.set('ent-6');
    pagina.formTipo.set('aclara');
    pagina.guardar();
    const id = pagina.relaciones()[0].id;
    pagina.retirar(id);
    expect(pagina.relaciones().length).toBe(0);
  });

  it('posiciona los nodos del grafo en circulo sin librerias', async () => {
    const fixture = configurar();
    TestBed.inject<SesionStore>(SESION_STORE).fijarUsuario(usuarioSesion('u-admin', ['Admin']));
    await fixture.whenStable();
    const nodos = fixture.componentInstance.nodosGraficos();
    expect(nodos.length).toBeGreaterThan(0);
    // Todos los nodos dentro del lienzo 720x420.
    for (const n of nodos) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(720);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(420);
    }
  });
});
