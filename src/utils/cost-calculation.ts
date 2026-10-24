import type {
  CostedOrder,
  HourlyWorker,
  LineCostSettings,
  Machine,
  ManufacturingOrder,
  PieceRateWorker,
  Product,
  ProductionLine,
  ProductRecipe,
  RawMaterial,
  RecipeItem,
} from '../types/manufacturing';
import { largestRemainder, roundToCents } from './rounding';

// Conversiones que usa el Excel de costos (hojas CL PROD. y DEP. MAQ.).
const HOURS_PER_DAY = 8;
const WEEKS_PER_MONTH = 4;
const MONTHS_PER_YEAR = 12;
const DAYS_PER_MONTH = 30;
/**
 * Días con los que el Excel pasa del pago semanal al diario: 6 para jornaleros y 7 para sueldos
 * mensuales. PENDIENTE CONFIRMAR CON LA EMPRESA: ¿por qué se usan días distintos?
 */
const PAY_DAYS_PER_WEEK: Record<HourlyWorker['payType'], number> = { jornal: 6, mensual: 7 };

/** Datos base con los que se calcula el costo de un lote. */
export interface CostCatalog {
  rawMaterials: readonly RawMaterial[];
  lineSettings: Record<ProductionLine, LineCostSettings>;
}

/** Una línea del desglose: cantidad × tarifa. */
export interface CostLine {
  label: string;
  /** Área o proceso, cuando aplica (mano de obra). */
  group?: string;
  quantity: number;
  unit: string;
  rate: number;
  /** Monto sin redondear, como lo calcula el Excel. */
  exact: number;
  /** Monto al céntimo; las líneas de una sección suman exactamente su total. */
  amount: number;
}

export interface MaterialCostLine extends CostLine {
  /** Regla de la receta que dio la cantidad (peso y merma, dosificación, cantidad por unidad). */
  item: RecipeItem;
}

export interface CostSection<Line extends CostLine = CostLine> {
  total: number;
  lines: Line[];
}

export interface LotCost {
  quantity: number;
  unitsPerDay: number;
  days: number;
  directMaterials: CostSection<MaterialCostLine>;
  directLabor: CostSection;
  overhead: {
    indirectMaterials: CostSection;
    indirectLabor: CostSection;
    depreciation: CostSection;
    fixedCosts: CostSection;
    basicServices: number;
    total: number;
  };
  /** Costo del lote = MPD + MOD + CIF. */
  lotCost: number;
  /** Costo unitario = costo del lote ÷ unidades. */
  unitCost: number;
}

/** Días de producción del lote: cantidad ÷ rendimiento, redondeado hacia arriba. */
function productionDays(quantity: number, unitsPerDay: number): number {
  // Se redondea a 6 decimales antes de subir al entero para que 2,329 ÷ (2,329 / 7) dé 7 y no 8.
  return Math.ceil(Number((quantity / unitsPerDay).toFixed(6)));
}

/** Kilos de resina por unidad: peso de la pieza más la merma. */
export function resinKgPerUnit(item: Extract<RecipeItem, { kind: 'resin' }>): number {
  return item.pieceWeightKg * (1 + item.wastePercent / 100);
}

/** Costo por hora de un operario, con las mismas divisiones que la hoja CL PROD. */
function hourlyRate(worker: HourlyWorker): number {
  const weeklyPay = worker.payType === 'jornal' ? worker.pay : worker.pay / WEEKS_PER_MONTH;
  return weeklyPay / PAY_DAYS_PER_WEEK[worker.payType] / HOURS_PER_DAY;
}

/** Depreciación por hora de una máquina, como la hoja DEP. MAQ. (lineal, meses de 30 días). */
function depreciationPerHour(machine: Machine): number {
  const yearly = (machine.quantity * machine.unitPrice - machine.residualValue) / machine.usefulLifeYears;
  return yearly / MONTHS_PER_YEAR / DAYS_PER_MONTH / HOURS_PER_DAY;
}

/**
 * Arma una sección del desglose. El total es la suma exacta redondeada al céntimo (igual que el
 * Excel) y los céntimos de las líneas se reparten para que sumen exactamente ese total.
 */
function toSection<Line extends CostLine>(lines: Omit<Line, 'amount'>[]): CostSection<Line> {
  const total = roundToCents(lines.reduce((sum, line) => sum + line.exact, 0));
  const cents = largestRemainder(
    lines.map((line) => line.exact * 100),
    Math.round(total * 100),
  );
  return {
    total,
    lines: lines.map((line, index) => ({ ...line, amount: cents[index] / 100 }) as Line),
  };
}

function directMaterialLines(
  recipe: ProductRecipe,
  quantity: number,
  rawMaterials: readonly RawMaterial[],
): Omit<MaterialCostLine, 'amount'>[] {
  const resinKg = recipe.items.reduce(
    (sum, item) => (item.kind === 'resin' ? sum + quantity * resinKgPerUnit(item) : sum),
    0,
  );

  return recipe.items.map((item) => {
    const material = rawMaterials.find((candidate) => candidate.code === item.materialCode);
    if (!material) throw new Error(`La receta ${recipe.sku} usa el material ${item.materialCode}, que no existe.`);

    const lotQuantity =
      item.kind === 'perUnit'
        ? quantity * item.quantityPerUnit
        : item.kind === 'resin'
          ? quantity * resinKgPerUnit(item)
          : (resinKg * item.gramsPerKgResin) / 1000;
    return {
      label: material.name,
      quantity: lotQuantity,
      unit: material.unit,
      rate: material.unitPrice,
      exact: lotQuantity * material.unitPrice,
      item,
    };
  });
}

function laborLines(
  workers: readonly (HourlyWorker | PieceRateWorker)[],
  quantity: number,
  days: number,
): Omit<CostLine, 'amount'>[] {
  return workers.map((worker) => {
    if (worker.kind === 'pieceRate') {
      const rate = worker.ratePerUnit;
      return { label: worker.name, group: worker.area, quantity, unit: 'und', rate, exact: quantity * rate };
    }
    const hours = worker.hoursPerDay * days;
    const rate = hourlyRate(worker);
    return { label: worker.name, group: worker.area, quantity: hours, unit: 'h', rate, exact: hours * rate };
  });
}

/** Calcula el costo estimado de un lote de `quantity` unidades del producto de la receta. */
export function calculateLotCost(recipe: ProductRecipe, quantity: number, catalog: CostCatalog): LotCost {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new RangeError(`La cantidad debe ser un entero mayor que 0 (se recibió ${quantity}).`);
  }
  const settings = catalog.lineSettings[recipe.line];
  const days = productionDays(quantity, recipe.unitsPerDay);

  const directMaterials = toSection(directMaterialLines(recipe, quantity, catalog.rawMaterials));
  const directLabor = toSection(laborLines(settings.directLabor, quantity, days));

  const indirectMaterials = toSection(
    settings.indirectMaterials.map((material) => ({
      label: material.name,
      quantity: material.usagePerLot,
      unit: 'und',
      rate: material.unitPrice,
      exact: material.usagePerLot * material.unitPrice,
    })),
  );
  const indirectLabor = toSection(laborLines(settings.indirectLabor, quantity, days));
  const depreciation = toSection(
    settings.machines.map((machine) => {
      const hours = machine.hoursPerDay * days;
      const rate = depreciationPerHour(machine);
      const label = machine.quantity > 1 ? `${machine.name} (×${machine.quantity})` : machine.name;
      return { label, quantity: hours, unit: 'h', rate, exact: hours * rate };
    }),
  );
  // Los gastos fijos del Excel son semanales: se prorratean por los días que dura el lote.
  const fixedCosts = toSection(
    settings.weeklyFixedCosts.map((cost) => {
      const rate = cost.weeklyAmount / settings.workDaysPerWeek;
      return { label: cost.concept, quantity: days, unit: 'días', rate, exact: rate * days };
    }),
  );
  const basicServices = roundToCents(settings.basicServicesPerLot);

  const overheadTotal = roundToCents(
    indirectMaterials.total + indirectLabor.total + depreciation.total + fixedCosts.total + basicServices,
  );
  const lotCost = roundToCents(directMaterials.total + directLabor.total + overheadTotal);

  return {
    quantity,
    unitsPerDay: recipe.unitsPerDay,
    days,
    directMaterials,
    directLabor,
    overhead: {
      indirectMaterials,
      indirectLabor,
      depreciation,
      fixedCosts,
      basicServices,
      total: overheadTotal,
    },
    lotCost,
    unitCost: lotCost / quantity,
  };
}

/** Agrega a cada orden su producto, su línea y su costo estimado, calculado con la receta. */
export function costOrders(
  orders: readonly ManufacturingOrder[],
  products: readonly Product[],
  recipes: readonly ProductRecipe[],
  catalog: CostCatalog,
): CostedOrder[] {
  return orders.map((order) => {
    const recipe = recipes.find((candidate) => candidate.sku === order.sku);
    const product = products.find((candidate) => candidate.sku === order.sku);
    if (!recipe || !product) throw new Error(`La orden ${order.id} usa el SKU ${order.sku}, que no tiene receta.`);

    const cost = calculateLotCost(recipe, order.quantity, catalog);
    return {
      ...order,
      line: recipe.line,
      productName: product.name,
      estimatedCost: {
        mpd: cost.directMaterials.total,
        mod: cost.directLabor.total,
        cif: cost.overhead.total,
      },
    };
  });
}
