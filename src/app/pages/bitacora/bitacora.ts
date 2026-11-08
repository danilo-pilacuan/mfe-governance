import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  BitacoraEntrada,
  ETIQUETA_ETAPA,
  ETIQUETA_TIPO_BITACORA,
  ProjectStore,
  descargarArchivo,
  nombreConFecha,
  serializarCsv,
  SESION_STORE,
  SesionStore,
  TIPOS_BITACORA,
  TipoBitacora,
  UsuarioStore,
} from '@projecthub/shared';
import { DataTable, DataTableColumn, IntlFormat, PermissionBanner, SectionNav } from '@projecthub/ui';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface FilaBitacora {
  [clave: string]: unknown;
  id: string;
  fecha: string;
  proyecto: string;
  tipo: string;
  tipoValor: TipoBitacora;
  evento: string;
  autor: string;
  comentario: string;
}

/**
 * Bitacora cross-proyecto (docs/funcionalidades.md 3.5): registro inmutable y
 * con autor de transiciones, aprobaciones y cambios relevantes. Solo lectura:
 * las entradas se registran al ejecutar acciones gobernadas, nunca desde la UI.
 */
@Component({
  selector: 'app-bitacora',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DataTable,
    DataTableColumn,
    PermissionBanner,
    SectionNav,
    MatButton,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './bitacora.html',
  styleUrl: './bitacora.scss',
})
export class Bitacora {
  private readonly store = inject(ProjectStore);
  private readonly usuariosStore = inject(UsuarioStore);
  private readonly sesion: SesionStore = inject(SESION_STORE);
  private readonly intl = inject(IntlFormat);

  /** Navegacion de secciones de gobernanza. */
  protected readonly navLinks = [
    { ruta: '/governance', etiqueta: 'Documentos' },
    { ruta: '/governance/bitacora', etiqueta: 'Bitacora' },
  ];

  readonly tipos = TIPOS_BITACORA;
  readonly etiquetaTipo = ETIQUETA_TIPO_BITACORA;

  readonly proyectos = this.store.proyectos;
  readonly proyectoSel = signal<string>('');
  readonly tipoSel = signal<string>('');

  readonly haySesion = computed(() => this.sesion.usuarioActivo() !== null);

  readonly filas = computed<readonly FilaBitacora[]>(() => {
    const proyectoId = this.proyectoSel();
    const tipo = this.tipoSel();
    const usuarios = this.usuariosStore.usuarios();
    const nombreDe = (usuarioId: string): string =>
      usuarios.find((u) => u.id === usuarioId)?.nombre ?? usuarioId;
    return this.store
      .bitacora()
      .filter(
        (b) => (!proyectoId || b.proyectoId === proyectoId) && (!tipo || b.tipo === tipo),
      )
      .slice()
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map((b) => ({
        id: b.id,
        fecha: this.intl.fecha(b.fecha),
        proyecto: this.store.proyectoPorId(b.proyectoId)?.nombre ?? b.proyectoId,
        tipo: this.etiquetaTipo[b.tipo],
        tipoValor: b.tipo,
        evento: this.eventoDe(b),
        autor: nombreDe(b.autorId),
        comentario: b.comentario ?? '-',
      }));
  });

  /** Transicion de etapa legible; '-' en registros que no son transicion. */
  private eventoDe(entrada: BitacoraEntrada): string {
    if (entrada.tipo === 'transicion' && entrada.etapaOrigen && entrada.etapaDestino) {
      return `${ETIQUETA_ETAPA[entrada.etapaOrigen]} -> ${ETIQUETA_ETAPA[entrada.etapaDestino]}`;
    }
    return '-';
  }

  seleccionarProyecto(id: string): void {
    this.proyectoSel.set(id);
  }

  seleccionarTipo(tipo: string): void {
    this.tipoSel.set(tipo);
  }

  /** Exporta la bitacora filtrada a CSV (docs/funcionalidades.md 7.5). */
  exportarCsv(): void {
    const filas = this.filas().map((f) => ({
      Fecha: f.fecha,
      Proyecto: f.proyecto,
      Tipo: f.tipo,
      Evento: f.evento,
      Autor: f.autor,
      Comentario: f.comentario,
    }));
    descargarArchivo(
      serializarCsv(filas, ['Fecha', 'Proyecto', 'Tipo', 'Evento', 'Autor', 'Comentario']),
      nombreConFecha('bitacora'),
      'text/csv;charset=utf-8',
    );
  }
}
