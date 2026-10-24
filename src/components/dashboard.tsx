import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Calculator, ClipboardList, Coins, Factory } from 'lucide-react';
import { ROUTES } from '../config/routes';
import {
  LINE_LABELS,
  PRODUCTION_LINES,
  STATUS_LABELS,
  type CostedOrder,
  type ProductionLine,
} from '../types/manufacturing';
import { buildDashboard, type DashboardData, type RecentOrderRow } from '../utils/dashboard';
import { capitalize, formatDate, formatMonth, formatNumber, formatSignedPercent, formatSoles } from '../utils/format';
import Card from './card';
import { CostDistributionChart, MonthlyCostChart } from './dashboard-charts';
import StatusBadge from './status-badge';

interface DashboardProps {
  orders: CostedOrder[];
  /** Mes que resume el dashboard (YYYY-MM). */
  month: string;
}

export default function Dashboard({ orders, month }: DashboardProps) {
  const [line, setLine] = useState<ProductionLine>('plastico');
  const data = useMemo(() => buildDashboard(orders, line, month), [orders, line, month]);
  const lineLabel = LINE_LABELS[line];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LineSelector value={line} onChange={setLine} />
        <p className="text-sm text-slate-500">
          Periodo: <span className="font-medium text-slate-700">{capitalize(formatMonth(month))}</span>
        </p>
        <p className="sr-only" aria-live="polite">
          Mostrando la línea {lineLabel}
        </p>
      </div>

      <KpiCards data={data} />

      <div className="grid gap-4 xl:grid-cols-3">
        <MonthlyCostChart data={data.monthlyCosts} lineLabel={lineLabel} className="xl:col-span-2" />
        <CostDistributionChart distribution={data.costDistribution} month={month} lineLabel={lineLabel} />
      </div>

      <RecentOrdersTable orders={data.recentOrders} lineLabel={lineLabel} />
    </div>
  );
}

interface LineSelectorProps {
  value: ProductionLine;
  onChange: (line: ProductionLine) => void;
}

function LineSelector({ value, onChange }: LineSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span id="line-selector-label" className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <Factory className="size-4 text-slate-400" aria-hidden="true" />
        Línea de producción
      </span>
      <div
        role="group"
        aria-labelledby="line-selector-label"
        className="inline-flex rounded-xl border border-slate-200 bg-white p-1"
      >
        {PRODUCTION_LINES.map((line) => {
          const selected = line === value;
          return (
            <button
              key={line}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(line)}
              className={`rounded-lg px-5 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {LINE_LABELS[line]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  icon: ReactNode;
  /** Clases de color del recuadro del ícono. */
  tone: string;
  value: string;
  footer: ReactNode;
}

function KpiCard({ label, icon, tone, value, footer }: KpiCardProps) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>{icon}</span>
        <h3 className="text-sm font-medium text-slate-600">{label}</h3>
      </div>
      <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      <div className="mt-2 text-xs text-slate-500">{footer}</div>
    </article>
  );
}

const iconClass = 'size-5';

function KpiCards({ data }: { data: DashboardData }) {
  const { monthCostChange, monthOrders, averageUnitCost } = data;
  const ChangeIcon =
    monthCostChange === null || monthCostChange === 0
      ? ArrowRight
      : monthCostChange > 0
        ? ArrowUpRight
        : ArrowDownRight;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <KpiCard
        label="Costo de producción estimado del mes"
        icon={<Coins className={iconClass} aria-hidden="true" />}
        tone="bg-blue-50 text-blue-600"
        value={formatSoles(data.monthCost)}
        footer={
          monthCostChange === null ? (
            'Sin costo de producción el mes anterior'
          ) : (
            <p className="flex items-center gap-1">
              <ChangeIcon className="size-4 text-slate-600" aria-hidden="true" />
              <span className="font-semibold text-slate-700">{formatSignedPercent(monthCostChange)}</span>
              vs. {formatMonth(data.previousMonth)}
            </p>
          )
        }
      />

      <KpiCard
        label="Órdenes del mes"
        icon={<ClipboardList className={iconClass} aria-hidden="true" />}
        tone="bg-violet-50 text-violet-600"
        value={formatNumber(monthOrders.count)}
        footer={monthOrders.byStatus
          .map(({ status, count }) => `${STATUS_LABELS[status]}: ${formatNumber(count)}`)
          .join(' · ')}
      />

      <KpiCard
        label="Costo unitario promedio"
        icon={<Calculator className={iconClass} aria-hidden="true" />}
        tone="bg-emerald-50 text-emerald-600"
        value={averageUnitCost === null ? '—' : formatSoles(averageUnitCost)}
        footer={
          averageUnitCost === null
            ? `Sin órdenes en ${formatMonth(data.month)}`
            : `${formatSoles(data.monthCost)} ÷ ${formatNumber(monthOrders.units)} unidades`
        }
      />
    </div>
  );
}

interface RecentOrdersTableProps {
  orders: RecentOrderRow[];
  lineLabel: string;
}

const th = 'px-5 py-2.5 font-medium whitespace-nowrap';
const td = 'px-5 py-3 whitespace-nowrap';

function RecentOrdersTable({ orders, lineLabel }: RecentOrdersTableProps) {
  return (
    <Card
      title="Órdenes de fabricación recientes"
      subtitle={`Últimas ${orders.length} · ${lineLabel}`}
      action={
        <a
          href={ROUTES.orders.path}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Ver todas
          <ArrowRight className="size-4" aria-hidden="true" />
        </a>
      }
    >
      <div className="-mx-5 -mb-5 overflow-x-auto">
        <table className="w-full min-w-160 text-sm">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
              <th scope="col" className={th}>N.° orden</th>
              <th scope="col" className={th}>Producto</th>
              <th scope="col" className={`${th} text-right`}>Cantidad</th>
              <th scope="col" className={th}>Estado</th>
              <th scope="col" className={`${th} text-right`}>Costo estimado</th>
              <th scope="col" className={`${th} text-right`}>Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/70">
                <td className={`${td} font-semibold text-slate-900`}>{order.id}</td>
                <td className={`${td} text-slate-600`}>{order.productName}</td>
                <td className={`${td} text-right text-slate-700 tabular-nums`}>{formatNumber(order.quantity)}</td>
                <td className={td}>
                  <StatusBadge status={order.status} />
                </td>
                <td className={`${td} text-right text-slate-700 tabular-nums`}>{formatSoles(order.estimatedCost)}</td>
                <td className={`${td} text-right text-slate-500 tabular-nums`}>{formatDate(order.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
