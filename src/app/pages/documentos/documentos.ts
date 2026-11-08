import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  Entregable,
  ETAPAS_CICLO_VIDA,
  ETIQUETA_ETAPA,
  ETIQUETA_ESTADO,
  EtapaCicloVida,
  ProjectStore,
  Proyecto,
  SESION_STORE,
  SesionStore,
  tienePermiso,
  UsuarioStore,
} from '@projecthub/shared';
import {
  DataTable,
  DataTableColumn,
  FormField,
  IntlFormat,
  PermissionBanner,
  SectionNav,
  StageBadge,
} from '@projecthub/ui';
import { MatButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface FilaEntregable {
  [clave: string]: unknown;
  id: string;
  nombre: string;
  etapaValor: EtapaCicloVida;
  version: number;
  autor: string;
  estado: string;
  aprobador: string;
  aprobadoEn: string;
  puedeAprobar: boolean;
  ref: Entregable;
}

/**
 * Gestion documental del ciclo de vida (principio rector del rulebook,
 * docs/funcionalidades.md 3.4 y 3.5): carga de entregables, aprobacion segun
 * la matriz de responsabilidades (1.5) y estado del gate de la etapa actual.
 * El store vuelve a validar toda accion al ejecutarla (exigirPermiso y
 * validarAprobacion); la UI solo oculta lo no permitido (1.7).
 */
@Component({
  selector: 'app-documentos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DataTable,
    DataTableColumn,
    FormField,
    PermissionBanner,
    StageBadge,
    SectionNav,
    MatButton,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './documentos.html',
  styleUrl: './documentos.scss',
})
export class Documentos {
  /** Navegacion de secciones de gobernanza. */
  protected readonly navLinks = [
    { ruta: '/governance', etiqueta: 'Documentos' },
    { ruta: '/governance/bitacora', etiqueta: 'Bitacora' },
  ];
  private readonly store = inject(ProjectStore);
  private readonly usuariosStore = inject(UsuarioStore);
  private readonly sesion: SesionStore = inject(SESION_STORE);
  private readonly intl = inject(IntlFormat);

  readonly etapas = ETAPAS_CICLO_VIDA;
  readonly etiquetaEtapa = ETIQUETA_ETAPA;
  readonly etiquetaEstado = ETIQUETA_ESTADO;

  readonly proyectos = this.store.proyectos;
  readonly proyectoSel = signal<string>(this.store.proyectos()[0]?.id ?? '');

  readonly formVisible = signal(false);
  readonly formEtapa = signal<EtapaCicloVida>('Planteamiento');
  readonly formNombre = signal('');
  readonly error = signal('');

  readonly haySesion = computed(() => this.sesion.usuarioActivo() !== null);

  readonly proyectoActual = computed<Proyecto | null>(
    () => this.proyectos().find((p) => p.id === this.proyectoSel()) ?? null,
  );

  /** El store exige proyecto Activo para cargar o aprobar entregables. */
  readonly estadoEditable = computed(() => this.proyectoActual()?.estado === 'Activo');

  readonly avisoEstado = computed(() => {
    const proyecto = this.proyectoActual();
    if (!proyecto || proyecto.estado === 'Activo') {
      return '';
    }
    return `El proyecto esta en estado ${ETIQUETA_ESTADO[proyecto.estado]}: los entregables son de solo lectura.`;
  });

  readonly gate = computed(() => {
    const id = this.proyectoSel();
    return this.proyectoActual() ? this.store.gateActual(id) : null;
  });

  readonly filas = computed<readonly FilaEntregable[]>(() => {
    const id = this.proyectoSel();
    if (!id) {
      return [];
    }
    const usuarios = this.usuariosStore.usuarios();
    const nombreDe = (usuarioId: string): string =>
      usuarios.find((u) => u.id === usuarioId)?.nombre ?? usuarioId;
    return this.store.entregablesDeProyecto(id).map((e) => {
      const aprobado = e.aprobadoPorId !== null;
      return {
        id: e.id,
        nombre: e.nombre,
        etapaValor: e.etapa,
        version: e.version,
        autor: nombreDe(e.creadoPorId),
        estado: aprobado ? 'Aprobado' : 'Pendiente',
        aprobador: e.aprobadoPorId !== null ? nombreDe(e.aprobadoPorId) : '-',
        aprobadoEn: e.aprobadoEn !== null ? this.intl.fecha(e.aprobadoEn) : '-',
        puedeAprobar: !aprobado && this.estadoEditable() && this.puedeAprobar(e.etapa),
        ref: e,
      };
    });
  });

  /** Consulta de matriz (1.5): quien puede aprobar en cada etapa. */
  puedeAprobar(etapa: EtapaCicloVida): boolean {
    const actor = this.sesion.usuarioActivo();
    return actor !== null && tienePermiso(etapa, 'aprobarEntregable', actor.roles);
  }

  seleccionarProyecto(id: string): void {
    this.proyectoSel.set(id);
    this.formVisible.set(false);
    this.error.set('');
  }

  abrirFormulario(): void {
    const etapa = this.proyectoActual()?.etapa;
    if (etapa) {
      this.formEtapa.set(etapa);
    }
    this.formNombre.set('');
    this.error.set('');
    this.formVisible.set(true);
  }

  cancelar(): void {
    this.formVisible.set(false);
    this.error.set('');
  }

  guardar(): void {
    const actor = this.sesion.usuarioActivo();
    if (!actor) {
      this.error.set('Se requiere una sesion activa para cargar entregables.');
      return;
    }
    const nombre = this.formNombre().trim();
    if (!nombre) {
      this.error.set('El nombre del documento es obligatorio.');
      return;
    }
    try {
      this.store.crearEntregable(
        {
          proyectoId: this.proyectoSel(),
          etapa: this.formEtapa(),
          nombre,
          version: 1,
          creadoPorId: actor.id,
        },
        actor,
      );
      this.cancelar();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Error inesperado.');
    }
  }

  aprobar(fila: FilaEntregable): void {
    const actor = this.sesion.usuarioActivo();
    if (!actor) {
      this.error.set('Se requiere una sesion activa para aprobar entregables.');
      return;
    }
    try {
      this.store.aprobarEntregable(fila.ref.id, actor);
      this.error.set('');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Error inesperado.');
    }
  }
}
