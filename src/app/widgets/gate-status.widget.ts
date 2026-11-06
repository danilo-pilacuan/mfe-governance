import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ProjectStore } from '@projecthub/shared';
import { IntlFormat, SummaryWidget } from '@projecthub/ui';

/**
 * GateStatusWidget: widget federado que expone mfe-governance para el
 * dashboard del shell (8.6). Resume el estado de los gates del portafolio:
 * cuantos proyectos tienen su gate abierto y cuantos entregables faltan o
 * estan pendientes de aprobacion.
 */
@Component({
  selector: 'ph-gate-status-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SummaryWidget],
  template: `
    <ph-summary-widget
      titulo="Gates de etapa"
      [valor]="valor()"
      [detalle]="detalle()"
      [tendencia]="tendencia()"
    />
  `,
})
export class GateStatusWidget {
  private readonly store = inject(ProjectStore);
  private readonly intl = inject(IntlFormat);

  private readonly gates = computed(() =>
    this.store.proyectos().map((p) => ({
      proyecto: p,
      gate: this.store.gateActual(p.id),
    })),
  );

  protected readonly total = computed(() => this.gates().length);

  protected readonly abiertos = computed(
    () => this.gates().filter((g) => g.gate.abierto).length,
  );

  protected readonly pendientes = computed(() =>
    this.gates().reduce(
      (acc, g) => acc + g.gate.faltantes.length + g.gate.pendientesAprobacion.length,
      0,
    ),
  );

  protected readonly valor = computed(() => `${this.abiertos()}/${this.total()}`);

  protected readonly detalle = computed(() =>
    this.pendientes() === 0
      ? 'Todos los entregables obligatorios aprobados'
      : `${this.intl.numero(this.pendientes())} entregables por aprobar`,
  );

  protected readonly tendencia = computed(() =>
    this.pendientes() === 0 ? 'positiva' : 'negativa',
  );
}
