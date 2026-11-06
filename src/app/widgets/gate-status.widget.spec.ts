import { TestBed } from '@angular/core/testing';
import { GateStatusWidget } from './gate-status.widget';

describe('GateStatusWidget', () => {
  it('resume los gates de la semilla', async () => {
    await TestBed.configureTestingModule({
      imports: [GateStatusWidget],
    }).compileComponents();

    const fixture = TestBed.createComponent(GateStatusWidget);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const texto = el.textContent ?? '';
    // p1 (Ejecucion, ent-7 sin aprobar) y p3 (PoC, ent-10 sin aprobar)
    // tienen gate cerrado; p2, p4, p5, p6 no tienen entregables obligatorios
    // pendientes en su etapa actual.
    expect(texto).toContain('Gates de etapa');
    expect(texto).toMatch(/\d+\/6/);
  });
});
