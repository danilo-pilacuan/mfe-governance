import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  Entregable,
  ETIQUETA_TIPO_RELACION,
  GrafoRelaciones,
  ProjectStore,
  RelacionDocumento,
  SESION_STORE,
  SesionStore,
  TIPOS_RELACION,
  TipoRelacion,
  validarRelacion,
} from '@projecthub/shared';
import { DataTable, DataTableColumn, PermissionBanner, Pill, SectionNav } from '@projecthub/ui';
import { ENLACES_NAV_GOBERNANZA } from '../../nav-gobernanza';

interface FilaRelacion {
  [clave: string]: unknown;
  id: string;
  origen: string;
  destino: string;
  tipo: string;
  tipoValor: TipoRelacion;
  nota: string;
}

/** Layout del grafo: nodos en circulo, aristas como curvas con etiqueta. */
interface NodoGrafico {
  id: string;
  nombre: string;
  aprobado: boolean;
  grado: number;
  x: number;
  y: number;
}

const ANCHO_GRAFO = 720;
const ALTO_GRAFO = 420;

/**
 * Relaciones entre documentos (16.1, ideas del dueno): enlaces tipados tipo
 * obsidian entre entregables del proyecto (acuerdos, adendas, aclaraciones)
 * con grafo de busqueda propio en SVG (sin librerias). El store revalida
 * con las mismas reglas del backend al ejecutar la accion; la UI no envia
 * enlaces invalidos.
 */
@Component({
  selector: 'app-relaciones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DataTable,
    DataTableColumn,
    PermissionBanner,
    Pill,
    SectionNav,
    FormsModule,
    MatButton,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './relaciones.html',
  styleUrl: './relaciones.scss',
})
export class Relaciones {
  private readonly store = inject(ProjectStore);
  private readonly sesion: SesionStore = inject(SESION_STORE);

  protected readonly navLinks = ENLACES_NAV_GOBERNANZA;

  readonly tipos = TIPOS_RELACION;
  readonly etiquetaTipo = ETIQUETA_TIPO_RELACION;

  readonly proyectos = this.store.proyectos;
  readonly proyectoSel = signal<string>(this.store.proyectos()[0]?.id ?? '');

  readonly formVisible = signal(false);
  readonly formOrigen = signal('');
  readonly formDestino = signal('');
  readonly formTipo = signal<TipoRelacion>('relacionado');
  readonly formNota = signal('');
  readonly error = signal('');

  readonly haySesion = computed(() => this.sesion.usuarioActivo() !== null);

  readonly proyectoActual = computed(() => this.proyectos().find((p) => p.id === this.proyectoSel()) ?? null);

  readonly entregables = computed<readonly Entregable[]>(() =>
    this.store.entregablesDeProyecto(this.proyectoSel()),
  );

  readonly relaciones = computed<readonly RelacionDocumento[]>(() =>
    this.store.relacionesDeProyecto(this.proyectoSel()),
  );

  readonly grafo = computed<GrafoRelaciones>(() => {
    const entregables = this.entregables();
    const relaciones = this.relaciones();
    const ids = new Set(entregables.map((e) => e.id));
    const aristas = relaciones.filter((r) => ids.has(r.origenId) && ids.has(r.destinoId));
    const grado = new Map<string, number>();
    for (const a of aristas) {
      grado.set(a.origenId, (grado.get(a.origenId) ?? 0) + 1);
      grado.set(a.destinoId, (grado.get(a.destinoId) ?? 0) + 1);
    }
    return {
      nodos: entregables.map((e) => ({
        id: e.id,
        nombre: e.nombre,
        etapa: e.etapa,
        aprobado: e.aprobadoPorId !== null,
        grado: grado.get(e.id) ?? 0,
      })),
      aristas: aristas.map((a) => ({ id: a.id, origenId: a.origenId, destinoId: a.destinoId, tipo: a.tipo })),
    };
  });

  /** Nodos posicionados en circulo (determinista, sin librerias). */
  readonly nodosGraficos = computed<NodoGrafico[]>(() => {
    const nodos = this.grafo().nodos;
    const centro = { x: ANCHO_GRAFO / 2, y: ALTO_GRAFO / 2 };
    const radio = Math.min(ANCHO_GRAFO, ALTO_GRAFO) / 2 - 60;
    return nodos.map((n, i) => {
      const angulo = (2 * Math.PI * i) / Math.max(nodos.length, 1) - Math.PI / 2;
      return {
        ...n,
        x: Math.round(centro.x + radio * Math.cos(angulo)),
        y: Math.round(centro.y + radio * Math.sin(angulo)),
      };
    });
  });

  readonly filas = computed<readonly FilaRelacion[]>(() => {
    const nombreDe = (id: string): string => this.entregables().find((e) => e.id === id)?.nombre ?? id;
    return this.relaciones().map((r) => ({
      id: r.id,
      origen: nombreDe(r.origenId),
      destino: nombreDe(r.destinoId),
      tipo: this.etiquetaTipo[r.tipo],
      tipoValor: r.tipo,
      nota: r.nota ?? '-',
    }));
  });

  readonly puedeEditar = computed(() => this.haySesion() && this.proyectoActual()?.estado === 'Activo');

  seleccionarProyecto(id: string): void {
    this.proyectoSel.set(id);
    this.cerrarForm();
  }

  abrirForm(): void {
    this.formVisible.set(true);
    this.error.set('');
  }

  cerrarForm(): void {
    this.formVisible.set(false);
    this.formOrigen.set('');
    this.formDestino.set('');
    this.formTipo.set('relacionado');
    this.formNota.set('');
    this.error.set('');
  }

  guardar(): void {
    this.error.set('');
    const origen = this.formOrigen();
    const destino = this.formDestino();
    const tipo = this.formTipo();
    const nota = this.formNota();
    // El frontend valida con las mismas reglas del backend (16.1).
    const errorLocal = validarRelacion(
      { origenId: origen, destinoId: destino, tipo, nota },
      this.relaciones(),
      this.entregables(),
    );
    if (errorLocal) {
      this.error.set(errorLocal);
      return;
    }
    const creadoPorId = this.sesion.usuarioActivo()?.id ?? '';
    const ahora = new Date().toISOString();
    // Optimista: se agrega al store; el re-sync 13.4 lo persiste y el eco
    // del servidor confirma. El id temporal del cliente (rel-tmp-*) queda
    // en el catalogo: el push lo conserva (coleccion corregible).
    const relacion: RelacionDocumento = {
      id: `rel-tmp-${Date.now()}`,
      proyectoId: this.proyectoSel(),
      origenId: origen,
      destinoId: destino,
      tipo,
      creadoPorId,
      creadoEn: ahora,
      nota: nota.trim() === '' ? null : nota.trim(),
    };
    this.store.agregarRelacion(relacion);
    this.cerrarForm();
  }

  retirar(id: string): void {
    this.store.retirarRelacion(id);
  }

  nombreDe(id: string): string {
    return this.entregables().find((e) => e.id === id)?.nombre ?? id;
  }

  posicionNodo(id: string): NodoGrafico | undefined {
    return this.nodosGraficos().find((n) => n.id === id);
  }

  /** Punto medio desplazado para la etiqueta de la arista. */
  etiquetaArista(origenId: string, destinoId: string): { x: number; y: number } {
    const o = this.posicionNodo(origenId);
    const d = this.posicionNodo(destinoId);
    if (!o || !d) return { x: 0, y: 0 };
    return { x: Math.round((o.x + d.x) / 2), y: Math.round((o.y + d.y) / 2) - 6 };
  }

  /** Curva bezier con desvio perpendicular para distinguir ida/vuelta. */
  pathArista(origenId: string, destinoId: string): string {
    const o = this.posicionNodo(origenId);
    const d = this.posicionNodo(destinoId);
    if (!o || !d) return '';
    const mx = (o.x + d.x) / 2;
    const my = (o.y + d.y) / 2;
    const dx = d.x - o.x;
    const dy = d.y - o.y;
    const largo = Math.sqrt(dx * dx + dy * dy) || 1;
    const desvio = Math.min(40, largo / 4);
    const cx = mx - (dy / largo) * desvio;
    const cy = my + (dx / largo) * desvio;
    return `M ${o.x} ${o.y} Q ${cx} ${cy} ${d.x} ${d.y}`;
  }
}
