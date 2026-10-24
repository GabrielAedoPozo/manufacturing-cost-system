import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
  type LabelProps,
  type TooltipContentProps,
} from 'recharts';
import { COST_ELEMENT_LABELS, type CostElement } from '../types/manufacturing';
import type { DashboardData, MonthlyCostPoint } from '../utils/dashboard';
import { capitalize, formatMonth, formatPercent, formatSoles } from '../utils/format';
import Card from './card';

/** Colores de los gráficos (paleta categórica validada para daltonismo). */
const CHART_COLORS = {
  series: '#2a78d6',
  grid: '#e2e8f0',
  axis: '#cbd5e1',
  tick: '#64748b',
  surface: '#ffffff',
} as const;

const COST_ELEMENT_COLORS: Record<CostElement, string> = {
  mpd: '#2a78d6',
  mod: '#eb6834',
  cif: '#1baf7a',
};

// --- Gráfico mensual ---

interface MonthlyCostChartProps {
  data: MonthlyCostPoint[];
  lineLabel: string;
  className?: string;
}

interface ChartPoint extends MonthlyCostPoint {
  label: string;
}

const AXIS_TICK = { fill: CHART_COLORS.tick, fontSize: 12 };

export function MonthlyCostChart({ data, lineLabel, className }: MonthlyCostChartProps) {
  const points: ChartPoint[] = data.map((point) => ({ ...point, label: formatMonth(point.month, 'short') }));
  const lastIndex = points.length - 1;

  // Solo se rotula el último punto (el mes actual): es el mismo valor de la tarjeta de costo del mes.
  const renderEndLabel = ({ x, y, index, value }: LabelProps) =>
    index === lastIndex ? (
      <text
        x={Number(x)}
        y={Number(y) - 14}
        textAnchor="end"
        fill="#0f172a"
        fontSize={12}
        fontWeight={600}
      >
        {formatSoles(Number(value))}
      </text>
    ) : null;

  return (
    <Card
      title="Costo de producción mensual"
      subtitle={`Últimos ${points.length} meses · ${lineLabel}`}
      className={className}
    >
      <div className="relative min-h-72 flex-1">
        <AreaChart
          responsive
          data={points}
          margin={{ top: 28, right: 12, bottom: 0, left: 4 }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="monthly-cost-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.series} stopOpacity={0.18} />
              <stop offset="100%" stopColor={CHART_COLORS.series} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.axis }}
            tick={AXIS_TICK}
            tickMargin={10}
          />
          <YAxis
            domain={[0, 'auto']}
            tickFormatter={(value: number) => formatSoles(value, { decimals: 0 })}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            width={80}
          />
          <Tooltip cursor={{ stroke: CHART_COLORS.axis, strokeWidth: 1 }} content={MonthlyTooltip} />
          <Area
            type="monotone"
            dataKey="cost"
            name="Costo de producción"
            stroke={CHART_COLORS.series}
            strokeWidth={2}
            fill="url(#monthly-cost-fill)"
            dot={{ r: 4, fill: CHART_COLORS.series, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: CHART_COLORS.series, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
          >
            <LabelList dataKey="cost" content={renderEndLabel} />
          </Area>
        </AreaChart>
      </div>

      <table className="sr-only">
        <caption>Costo de producción mensual, línea {lineLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col">Costo de producción</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.month}>
              <th scope="row">{capitalize(formatMonth(point.month))}</th>
              <td>{formatSoles(point.cost)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function MonthlyTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as ChartPoint | undefined;
  if (!active || !point) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="text-sm font-semibold text-slate-900">{formatSoles(point.cost)}</p>
      <p className="text-xs text-slate-500">Costo de producción · {capitalize(formatMonth(point.month))}</p>
    </div>
  );
}

// --- Donut MPD + MOD + CIF ---

interface CostDistributionChartProps {
  distribution: DashboardData['costDistribution'];
  month: string;
  lineLabel: string;
}

interface SliceDatum {
  element: CostElement;
  name: string;
  amount: number;
  percent: number;
  fill: string;
}

const SIZE = 192;

export function CostDistributionChart({ distribution, month, lineLabel }: CostDistributionChartProps) {
  const slices: SliceDatum[] = distribution.slices.map((slice) => ({
    ...slice,
    name: COST_ELEMENT_LABELS[slice.element],
    fill: COST_ELEMENT_COLORS[slice.element],
  }));
  const percentTotal = slices.reduce((sum, slice) => sum + slice.percent, 0);
  const hasData = distribution.total > 0;

  return (
    <Card
      title="Distribución de costos"
      subtitle={`${capitalize(formatMonth(month))} · ${lineLabel}`}
    >
      <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
        {hasData ? (
          <PieChart width={SIZE} height={SIZE}>
            <Pie
              data={slices}
              dataKey="amount"
              nameKey="name"
              innerRadius={68}
              outerRadius={94}
              startAngle={90}
              endAngle={-270}
              stroke={CHART_COLORS.surface}
              strokeWidth={2}
            />
            <Tooltip content={SliceTooltip} />
          </PieChart>
        ) : (
          <div className="size-full rounded-full border-26 border-slate-100" />
        )}
        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <p className="text-base font-semibold text-slate-900">{formatSoles(distribution.total)}</p>
          <p className="text-xs text-slate-500">Total del mes</p>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {slices.map((slice) => (
          <li key={slice.element} className="flex items-start gap-3 text-sm">
            <span
              className="mt-1.5 size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.fill }}
              aria-hidden="true"
            />
            <span className="flex-1 text-slate-600">{slice.name}</span>
            <span className="text-right">
              <span className="block font-medium text-slate-900 tabular-nums">{formatSoles(slice.amount)}</span>
              <span className="block text-xs text-slate-500 tabular-nums">{formatPercent(slice.percent)}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-start justify-between gap-3 border-t border-slate-200 pt-3 text-sm">
        <span className="font-medium text-slate-700">Total</span>
        <span className="text-right">
          <span className="block font-semibold text-slate-900 tabular-nums">{formatSoles(distribution.total)}</span>
          <span className="block text-xs text-slate-500 tabular-nums">{formatPercent(percentTotal)}</span>
        </span>
      </div>
    </Card>
  );
}

function SliceTooltip({ active, payload }: TooltipContentProps) {
  const slice = payload?.[0]?.payload as SliceDatum | undefined;
  if (!active || !slice) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md">
      <p className="text-sm font-semibold text-slate-900">
        {formatSoles(slice.amount)} <span className="font-normal text-slate-500">· {formatPercent(slice.percent)}</span>
      </p>
      <p className="text-xs text-slate-500">{slice.name}</p>
    </div>
  );
}
