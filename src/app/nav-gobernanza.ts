/**
 * Enlaces de navegacion de secciones de gobernanza (3.7/3.8): unica fuente
 * para las paginas de documentos y bitacora (evita duplicar la definicion).
 */
export interface EnlaceNavGobernanza {
  ruta: string;
  etiqueta: string;
}

export const ENLACES_NAV_GOBERNANZA: EnlaceNavGobernanza[] = [
  { ruta: '/governance', etiqueta: 'Documentos' },
  { ruta: '/governance/relaciones', etiqueta: 'Relaciones' },
  { ruta: '/governance/bitacora', etiqueta: 'Bitacora' },
];
