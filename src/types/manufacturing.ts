/** Líneas de producción de la fábrica. */
export type ProductionLine = 'plastico' | 'metal';

export const PRODUCTION_LINES: readonly ProductionLine[] = ['plastico', 'metal'];

export const LINE_LABELS: Record<ProductionLine, string> = {
  plastico: 'Plástico',
  metal: 'Metal',
};

/**
 * Ciclo de vida de una orden de fabricación:
 * Estimada (costo calculado, aún sin producir) → En proceso → Terminada.
 */
export type OrderStatus = 'estimada' | 'en_proceso' | 'terminada';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  estimada: 'Estimada',
  en_proceso: 'En proceso',
  terminada: 'Terminada',
};

/** Costo de un lote desglosado en sus tres elementos, en soles. */
export interface CostBreakdown {
  /** Materia prima directa */
  mpd: number;
  /** Mano de obra directa */
  mod: number;
  /** Costos indirectos de fabricación */
  cif: number;
}

export type CostElement = keyof CostBreakdown;

export const COST_ELEMENTS: readonly CostElement[] = ['mpd', 'mod', 'cif'];

export const COST_ELEMENT_LABELS: Record<CostElement, string> = {
  mpd: 'Materia prima directa',
  mod: 'Mano de obra directa',
  cif: 'Costos indirectos de fabricación',
};

/** Producto del catálogo (listado Diway). */
export interface Product {
  sku: string;
  name: string;
  category: string;
  subcategory: string;
}

/** Materia prima directa con su precio actual. */
export interface RawMaterial {
  code: string;
  name: string;
  /** Unidad en la que se compra y se mide: kg, und, gal. */
  unit: string;
  unitPrice: number;
}

/** Cómo se calcula cuánto material lleva cada unidad producida. */
export type RecipeItem =
  /** Cantidad fija por unidad (p. ej. 1 tuerca por tapabarro). */
  | { kind: 'perUnit'; materialCode: string; quantityPerUnit: number }
  /** Resina: peso de la pieza más la merma (colada) que se pierde al inyectar. */
  | { kind: 'resin'; materialCode: string; pieceWeightKg: number; wastePercent: number }
  /** Aditivo dosificado sobre la resina total del lote (colorante, titanio). */
  | { kind: 'perKgResin'; materialCode: string; gramsPerKgResin: number };

/** Receta de un producto: con qué línea se fabrica, a qué ritmo y qué materiales usa por unidad. */
export interface ProductRecipe {
  sku: string;
  line: ProductionLine;
  /** Rendimiento: unidades que se producen por día. */
  unitsPerDay: number;
  items: RecipeItem[];
}

/** Operario pagado por tiempo. El costo por hora se obtiene de su pago como en el Excel. */
export interface HourlyWorker {
  kind: 'hourly';
  name: string;
  area: string;
  /** jornal: `pay` es el pago semanal; mensual: `pay` es el sueldo del mes. */
  payType: 'jornal' | 'mensual';
  pay: number;
  /** Horas que trabaja en el lote por cada día de producción. */
  hoursPerDay: number;
}

/** Operario pagado a destajo, por unidad producida. */
export interface PieceRateWorker {
  kind: 'pieceRate';
  name: string;
  area: string;
  ratePerUnit: number;
}

export interface Machine {
  name: string;
  quantity: number;
  unitPrice: number;
  usefulLifeYears: number;
  residualValue: number;
  /** Horas que trabaja la máquina por cada día de producción. */
  hoursPerDay: number;
}

export interface IndirectMaterial {
  name: string;
  unitPrice: number;
  usagePerLot: number;
}

export interface WeeklyFixedCost {
  concept: string;
  weeklyAmount: number;
}

/** Datos base de costo de una línea de producción (una hoja de cálculo del Excel por línea). */
export interface LineCostSettings {
  /** Días laborables por semana, para prorratear los gastos fijos semanales. */
  workDaysPerWeek: number;
  directLabor: (HourlyWorker | PieceRateWorker)[];
  indirectLabor: HourlyWorker[];
  machines: Machine[];
  indirectMaterials: IndirectMaterial[];
  weeklyFixedCosts: WeeklyFixedCost[];
  /** Servicios básicos (energía, agua) por lote, en soles. */
  basicServicesPerLot: number;
}

export interface ManufacturingOrder {
  /** N.° de orden, p. ej. "OF-0041" */
  id: string;
  sku: string;
  quantity: number;
  status: OrderStatus;
  /** Fecha de emisión (YYYY-MM-DD). El mes de la orden se deriva de esta fecha. */
  date: string;
}

/** Orden con su producto y su costo estimado ya calculados a partir de la receta. */
export interface CostedOrder extends ManufacturingOrder {
  line: ProductionLine;
  productName: string;
  estimatedCost: CostBreakdown;
}
