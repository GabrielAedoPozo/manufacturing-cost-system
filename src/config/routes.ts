export interface Route {
  path: string;
  /** Nombre de la pestaña: texto del menú y título de la página. */
  label: string;
  /** Nombre corto para botones, cuando el nombre de la pestaña es largo. */
  shortLabel?: string;
}

/** Única fuente de rutas de la aplicación: no escribas URLs a mano. */
export const ROUTES = {
  home: { path: '/', label: 'Inicio' },
  orders: { path: '/ordenes', label: 'Órdenes de fabricación' },
  newOrder: { path: '/ordenes/nueva', label: 'Nueva orden de fabricación', shortLabel: 'Nueva orden' },
  products: { path: '/productos', label: 'Productos' },
  newProduct: { path: '/productos/nuevo', label: 'Registrar producto' },
  rawMaterials: { path: '/materias-primas', label: 'Materias primas' },
  labor: { path: '/mano-de-obra', label: 'Mano de obra' },
  overhead: { path: '/costos-indirectos', label: 'Costos indirectos' },
} as const satisfies Record<string, Route>;
