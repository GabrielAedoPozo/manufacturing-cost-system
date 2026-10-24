import {
  COST_ELEMENTS,
  STATUS_LABELS,
  type CostBreakdown,
  type CostElement,
  type CostedOrder,
  type OrderStatus,
  type ProductionLine,
} from '../types/manufacturing';
import { largestRemainder } from './rounding';

const MONTHS_IN_CHART = 6;
const RECENT_ORDERS_LIMIT = 5;

// --- Reglas de costo ---

/**
 * Suma montos en soles trabajando en céntimos, para que los totales no arrastren
 * errores de punto flotante (0.1 + 0.2 ≠ 0.3) y siempre cuadren al céntimo.
 */
function sumMoney(amounts: readonly number[]): number {
  return amounts.reduce((total, amount) => total + Math.round(amount * 100), 0) / 100;
}

/** Costo del lote = MPD + MOD + CIF. */
function lotCost(cost: CostBreakdown): number {
  return sumMoney([cost.mpd, cost.mod, cost.cif]);
}

/** Suma varios desgloses elemento por elemento. */
function sumBreakdowns(costs: readonly CostBreakdown[]): CostBreakdown {
  return {
    mpd: sumMoney(costs.map((cost) => cost.mpd)),
    mod: sumMoney(costs.map((cost) => cost.mod)),
    cif: sumMoney(costs.map((cost) => cost.cif)),
  };
}

/** Desplaza un mes YYYY-MM: shiftMonth("2026-01", -1) → "2025-12". */
function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const index = year * 12 + (monthNumber - 1) + delta;
  const newYear = Math.floor(index / 12);
  const newMonth = (index % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, '0')}`;
}

/** Órdenes emitidas en un mes (YYYY-MM), según su fecha de emisión. */
function ordersInMonth(orders: readonly CostedOrder[], month: string): CostedOrder[] {
  return orders.filter((order) => order.date.slice(0, 7) === month);
}

/** Costo de producción estimado de un mes, desglosado: suma del costo estimado de sus órdenes. */
function monthlyProductionCost(
  orders: readonly CostedOrder[],
  month: string,
): CostBreakdown {
  return sumBreakdowns(ordersInMonth(orders, month).map((order) => order.estimatedCost));
}

/**
 * Reparte 100% entre varios montos con `decimals` decimales usando el método del
 * mayor residuo, para que los porcentajes mostrados sumen exactamente 100.
 */
function toPercentages(amounts: readonly number[], decimals = 1): number[] {
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  if (total <= 0) return amounts.map(() => 0);

  const scale = 10 ** decimals;
  const exact = amounts.map((amount) => (amount / total) * 100 * scale);
  return largestRemainder(exact, 100 * scale).map((unit) => unit / scale);
}

/** Variación porcentual de `current` respecto de `base`; null si no hay base. */
function percentChange(current: number, base: number): number | null {
  if (base === 0) return null;
  return ((current - base) / base) * 100;
}

// --- Dashboard ---

export interface MonthlyCostPoint {
  /** YYYY-MM */
  month: string;
  cost: number;
}

interface CostSlice {
  element: CostElement;
  amount: number;
  /** Porcentaje del total con 1 decimal; los tres suman 100. */
  percent: number;
}

export interface RecentOrderRow {
  id: string;
  productName: string;
  quantity: number;
  status: OrderStatus;
  date: string;
  estimatedCost: number;
}

export interface DashboardData {
  /** Mes del dashboard (YYYY-MM). */
  month: string;
  previousMonth: string;
  /** Costo de producción estimado del mes. */
  monthCost: number;
  /** Variación % del costo del mes vs. el mes anterior; null si el mes anterior no tuvo costo. */
  monthCostChange: number | null;
  monthOrders: {
    count: number;
    /** Unidades a fabricar entre todas las órdenes del mes. */
    units: number;
    byStatus: { status: OrderStatus; count: number }[];
  };
  /** Costo unitario promedio del mes = costo del mes ÷ unidades; null si no hay unidades. */
  averageUnitCost: number | null;
  /** Últimos 6 meses; el último punto es el mes del dashboard. */
  monthlyCosts: MonthlyCostPoint[];
  costDistribution: {
    total: number;
    slices: CostSlice[];
  };
  recentOrders: RecentOrderRow[];
}

/** Calcula todos los indicadores del dashboard de una línea a partir de sus órdenes. */
export function buildDashboard(
  allOrders: readonly CostedOrder[],
  line: ProductionLine,
  month: string,
): DashboardData {
  const orders = allOrders.filter((order) => order.line === line);

  // Costo de producción mensual: la misma función alimenta el gráfico, las tarjetas y el donut.
  const monthlyCosts = Array.from({ length: MONTHS_IN_CHART }, (_, index) => {
    const pointMonth = shiftMonth(month, index - (MONTHS_IN_CHART - 1));
    return { month: pointMonth, cost: lotCost(monthlyProductionCost(orders, pointMonth)) };
  });
  const monthBreakdown = monthlyProductionCost(orders, month);
  const monthCost = lotCost(monthBreakdown);
  const previousMonth = shiftMonth(month, -1);
  const previousMonthCost = lotCost(monthlyProductionCost(orders, previousMonth));

  const amounts = COST_ELEMENTS.map((element) => monthBreakdown[element]);
  const percents = toPercentages(amounts);
  const slices = COST_ELEMENTS.map((element, index) => ({
    element,
    amount: amounts[index],
    percent: percents[index],
  }));

  const monthOrders = ordersInMonth(orders, month);
  const units = monthOrders.reduce((total, order) => total + order.quantity, 0);
  const byStatus = (Object.keys(STATUS_LABELS) as OrderStatus[]).map((status) => ({
    status,
    count: monthOrders.filter((order) => order.status === status).length,
  }));

  const recentOrders = [...orders]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, RECENT_ORDERS_LIMIT)
    .map((order) => ({
      id: order.id,
      productName: order.productName,
      quantity: order.quantity,
      status: order.status,
      date: order.date,
      estimatedCost: lotCost(order.estimatedCost),
    }));

  return {
    month,
    previousMonth,
    monthCost,
    monthCostChange: percentChange(monthCost, previousMonthCost),
    monthOrders: { count: monthOrders.length, units, byStatus },
    averageUnitCost: units > 0 ? monthCost / units : null,
    monthlyCosts,
    costDistribution: { total: monthCost, slices },
    recentOrders,
  };
}
