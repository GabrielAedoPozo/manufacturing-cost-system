import { useMemo, useState, type ReactNode } from 'react';
import { Check, ChevronRight, Search } from 'lucide-react';
import { LINE_LABELS, type Product, type ProductRecipe } from '../types/manufacturing';
import {
  calculateLotCost,
  resinKgPerUnit,
  type CostCatalog,
  type CostLine,
  type CostSection,
  type LotCost,
  type MaterialCostLine,
} from '../utils/cost-calculation';
import { formatDate, formatNumber, formatPercent, formatSoles, toIsoDate } from '../utils/format';
import Card from './card';
import StatusBadge from './status-badge';

interface NewOrderProps {
  products: Product[];
  recipes: ProductRecipe[];
  catalog: CostCatalog;
  /** Número con el que empieza la siguiente orden (sigue a las existentes). */
  nextOrderNumber: number;
}

interface ConfirmedOrder {
  id: string;
  productName: string;
  quantity: number;
  days: number;
  lotCost: number;
  unitCost: number;
  date: string;
}

const MAX_QUANTITY = 1_000_000;

/** Texto para buscar sin importar mayúsculas ni tildes. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export default function NewOrder({ products, recipes, catalog, nextOrderNumber }: NewOrderProps) {
  const [query, setQuery] = useState('');
  const [sku, setSku] = useState<string | null>(null);
  const [quantityText, setQuantityText] = useState('');
  const [confirmed, setConfirmed] = useState<ConfirmedOrder[]>([]);
  const [message, setMessage] = useState('');

  const recipeBySku = useMemo(() => new Map(recipes.map((recipe) => [recipe.sku, recipe])), [recipes]);
  // Primero los productos con receta (los únicos que se pueden elegir), luego el resto del listado.
  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => Number(recipeBySku.has(b.sku)) - Number(recipeBySku.has(a.sku))),
    [products, recipeBySku],
  );
  const visibleProducts = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    return sortedProducts.filter((product) => {
      const text = normalize(`${product.sku} ${product.name} ${product.category}`);
      return words.every((word) => text.includes(word));
    });
  }, [sortedProducts, query]);

  const product = sku ? products.find((candidate) => candidate.sku === sku) : undefined;
  const recipe = sku ? recipeBySku.get(sku) : undefined;
  const quantity = Number(quantityText);
  const quantityIsValid = Number.isInteger(quantity) && quantity > 0 && quantity <= MAX_QUANTITY;
  const cost = useMemo(
    () => (recipe && quantityIsValid ? calculateLotCost(recipe, quantity, catalog) : null),
    [recipe, quantity, quantityIsValid, catalog],
  );

  function confirmOrder() {
    if (!product || !cost) return;
    const id = `OF-${String(nextOrderNumber + confirmed.length).padStart(4, '0')}`;
    setConfirmed((orders) => [
      {
        id,
        productName: product.name,
        quantity: cost.quantity,
        days: cost.days,
        lotCost: cost.lotCost,
        unitCost: cost.unitCost,
        date: toIsoDate(new Date()),
      },
      ...orders,
    ]);
    setSku(null);
    setQuantityText('');
    setMessage(`Orden ${id} confirmada.`);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="1. Producto y cantidad" subtitle={`${recipes.length} de ${products.length} productos tienen receta`}>
          <label className="relative block">
            <span className="sr-only">Buscar producto</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, SKU o categoría…"
              className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
          </label>

          <fieldset className="mt-3">
            <legend className="sr-only">Producto</legend>
            <ul className="max-h-80 space-y-1 overflow-y-auto pr-1">
              {visibleProducts.map((candidate, index) => {
                const candidateRecipe = recipeBySku.get(candidate.sku);
                const selected = candidate.sku === sku;
                return (
                  <li key={`${candidate.sku}-${index}`}>
                    <label
                      className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${
                        !candidateRecipe
                          ? 'cursor-not-allowed border-transparent text-slate-400'
                          : selected
                            ? 'cursor-pointer border-blue-300 bg-blue-50'
                            : 'cursor-pointer border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="product"
                        value={candidate.sku}
                        checked={selected}
                        disabled={!candidateRecipe}
                        onChange={() => setSku(candidate.sku)}
                        className="mt-0.5 accent-blue-600"
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block font-medium ${candidateRecipe ? 'text-slate-900' : ''}`}>
                          {candidate.name}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {candidate.sku} · {candidate.category}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          candidateRecipe ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {candidateRecipe ? LINE_LABELS[candidateRecipe.line] : 'Sin receta'}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {visibleProducts.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">Ningún producto coincide con la búsqueda.</p>
            )}
          </fieldset>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">Cantidad a fabricar</span>
            <span className="mt-1 flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_QUANTITY}
                step={1}
                value={quantityText}
                onChange={(event) => setQuantityText(event.target.value)}
                placeholder="Ej. 2329"
                aria-invalid={quantityText !== '' && !quantityIsValid}
                aria-describedby="quantity-error"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
              />
              <span className="text-sm text-slate-500">und</span>
            </span>
            <span id="quantity-error" className="mt-1 block text-xs text-rose-700">
              {quantityText !== '' && !quantityIsValid
                ? `Ingresa una cantidad entera entre 1 y ${formatNumber(MAX_QUANTITY)}.`
                : ''}
            </span>
          </label>
        </Card>

        <Card title="2. Desglose de costos (estimado)" subtitle={product?.name ?? 'Elige un producto con receta'}>
          {cost ? (
            <CostBreakdown cost={cost} />
          ) : (
            <p className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              Elige un producto con receta y escribe la cantidad para ver su costo.
            </p>
          )}
          <button
            type="button"
            onClick={confirmOrder}
            disabled={!cost}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
          >
            <Check className="size-4" aria-hidden="true" />
            Confirmar orden
          </button>
          <p className="mt-2 text-center text-sm text-emerald-700" aria-live="polite">
            {message}
          </p>
        </Card>
      </div>

      <Card
        title="Órdenes confirmadas"
        subtitle="Se guardan solo en memoria: se pierden al recargar la página."
      >
        {confirmed.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no has confirmado órdenes.</p>
        ) : (
          <div className="-mx-5 -mb-5 overflow-x-auto">
            <table className="w-full min-w-180 text-sm">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                  <th scope="col" className="px-5 py-2.5 font-medium">N.° orden</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Producto</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Cantidad</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Días</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Estado</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Costo del lote</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Costo unitario</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {confirmed.map((order) => (
                  <tr key={order.id}>
                    <td className="px-5 py-3 font-semibold whitespace-nowrap text-slate-900">{order.id}</td>
                    <td className="px-5 py-3 text-slate-600">{order.productName}</td>
                    <td className="px-5 py-3 text-right text-slate-700 tabular-nums">{formatNumber(order.quantity)}</td>
                    <td className="px-5 py-3 text-right text-slate-700 tabular-nums">{order.days}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status="estimada" />
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap text-slate-700 tabular-nums">
                      {formatSoles(order.lotCost)}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap text-slate-700 tabular-nums">
                      {formatSoles(order.unitCost)}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500 tabular-nums">{formatDate(order.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// --- Desglose de costos ---

const quantityFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });

function formatQuantity(value: number): string {
  return quantityFormatter.format(value);
}

/** Tarifas menores a S/ 1 se muestran con 4 decimales (p. ej. una tuerca a S/ 0.0948). */
function formatRate(rate: number): string {
  return formatSoles(rate, { decimals: rate < 1 ? 4 : 2 });
}

/** Explica de dónde sale la cantidad de cada material según su regla de receta. */
function recipeNote(line: MaterialCostLine): string {
  const { item } = line;
  if (item.kind === 'resin') {
    const grams = (kg: number) => `${formatQuantity(kg * 1000)} g`;
    return `${grams(item.pieceWeightKg)} de pieza + ${formatPercent(item.wastePercent)} de merma = ${grams(resinKgPerUnit(item))} por unidad`;
  }
  if (item.kind === 'perKgResin') return `${formatQuantity(item.gramsPerKgResin)} g por kg de resina`;
  return `${formatQuantity(item.quantityPerUnit)} ${line.unit} por unidad`;
}

interface SectionProps<Line extends CostLine> {
  title: string;
  section: CostSection<Line>;
  /** Texto extra bajo cada línea (p. ej. de dónde sale la cantidad de un material). */
  note?: (line: Line) => string;
}

function SectionLines<Line extends CostLine>({ section, note }: Omit<SectionProps<Line>, 'title'>) {
  return (
    <ul className="mt-2 space-y-1.5 border-l border-slate-200 pl-3">
      {section.lines.map((line, index) => {
        const extra = note?.(line);
        return (
          <li key={`${line.label}-${index}`} className="flex items-start justify-between gap-3 text-xs">
            <span className="min-w-0 text-slate-600">
              <span className="font-medium text-slate-700">{line.label}</span>
              {line.group && <span> · {line.group}</span>}
              <span className="block text-slate-500">
                {formatQuantity(line.quantity)} {line.unit} × {formatRate(line.rate)}
                {extra && <> · {extra}</>}
              </span>
            </span>
            <span className="shrink-0 font-medium text-slate-700 tabular-nums">{formatSoles(line.amount)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Row({ title, amount, children }: { title: string; amount: number; children?: ReactNode }) {
  const label = (
    <span className="flex flex-1 items-center justify-between gap-3">
      <span>{title}</span>
      <span className="font-medium text-slate-900 tabular-nums">{formatSoles(amount)}</span>
    </span>
  );
  if (!children) return <div className="flex py-2 pl-6 text-sm text-slate-700">{label}</div>;
  return (
    <details className="group py-2 text-sm text-slate-700">
      <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
        <ChevronRight
          className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90"
          aria-hidden="true"
        />
        {label}
      </summary>
      <div className="pl-6">{children}</div>
    </details>
  );
}

function SectionRow<Line extends CostLine>({ title, section, note }: SectionProps<Line>) {
  return (
    <Row title={title} amount={section.total}>
      <SectionLines section={section} note={note} />
    </Row>
  );
}

function CostBreakdown({ cost }: { cost: LotCost }) {
  const { overhead } = cost;
  return (
    <div>
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span className="font-semibold text-slate-900">
          {cost.days} {cost.days === 1 ? 'día' : 'días'} de producción
        </span>{' '}
        · {formatNumber(cost.quantity)} und ÷ {formatQuantity(cost.unitsPerDay)} und por día, redondeado hacia arriba
      </p>

      <div className="mt-3 divide-y divide-slate-100">
        <SectionRow title="Materia prima directa" section={cost.directMaterials} note={recipeNote} />
        <SectionRow title="Mano de obra directa" section={cost.directLabor} />
        <Row title="Costos indirectos de fabricación" amount={overhead.total}>
          <div className="divide-y divide-slate-100">
            <SectionRow title="Materiales indirectos" section={overhead.indirectMaterials} />
            <SectionRow title="Mano de obra indirecta" section={overhead.indirectLabor} />
            <SectionRow title="Depreciación de maquinaria" section={overhead.depreciation} />
            <SectionRow title="Gastos fijos de planta (prorrateados por días)" section={overhead.fixedCosts} />
            <Row title="Servicios básicos" amount={overhead.basicServices} />
          </div>
        </Row>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
        <span className="text-sm font-semibold text-blue-900">Costo total del lote</span>
        <span className="text-lg font-semibold text-blue-900 tabular-nums">{formatSoles(cost.lotCost)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between px-4 py-2">
        <span className="text-sm font-medium text-slate-700">Costo unitario</span>
        <span className="text-base font-semibold text-slate-900 tabular-nums">{formatSoles(cost.unitCost)}</span>
      </div>
    </div>
  );
}
