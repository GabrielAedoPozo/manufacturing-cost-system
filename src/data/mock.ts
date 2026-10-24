import type {
  IndirectMaterial,
  LineCostSettings,
  ManufacturingOrder,
  Product,
  ProductionLine,
  ProductRecipe,
  RawMaterial,
  WeeklyFixedCost,
} from '../types/manufacturing';
import { diwayProducts } from './diway-products';

/**
 * Datos de ejemplo del sistema, sacados de los Excel de la empresa (docs/excel/).
 * Es la única fuente de datos del front: los costos se calculan con src/utils/cost-calculation.ts.
 * Al conectar el back, estos datos vendrán de la API con la misma forma.
 */

/** Mes de corte de los datos de ejemplo (YYYY-MM). Con el back conectado será el mes en curso. */
export const REFERENCE_MONTH = '2026-10';

/**
 * El Excel de Plástico no dice qué producto costea y el listado Diway no trae pesos.
 * PENDIENTE CONFIRMAR CON LA EMPRESA: ¿qué SKU es la pieza de 203 g?
 */
const plasticExcelProduct: Product = {
  sku: 'POR-IDENTIFICAR',
  name: 'PIEZA DE POLIPROPILENO DE 203 G (PRODUCTO POR IDENTIFICAR)',
  category: 'POR IDENTIFICAR',
  subcategory: 'LOTE DEL EXCEL DE PLÁSTICO',
};

export const products: Product[] = [...diwayProducts, plasticExcelProduct];

/** Materias primas directas con su precio (hoja MPD de cada Excel). */
export const rawMaterials: RawMaterial[] = [
  { code: 'MP-PL-PP', name: 'Polipropileno', unit: 'kg', unitPrice: 9.5 },
  // PENDIENTE CONFIRMAR CON LA EMPRESA: colorante y titanio tienen el mismo precio en el Excel.
  { code: 'MP-PL-COLORANTE', name: 'Colorante', unit: 'kg', unitPrice: 114.4 },
  { code: 'MP-PL-TITANIO', name: 'Titanio', unit: 'kg', unitPrice: 114.4 },
  { code: 'MP-MT-PLANCHA', name: 'Plancha', unit: 'und', unitPrice: 47.11 },
  { code: 'MP-MT-TUERCA', name: 'Tuerca', unit: 'und', unitPrice: 0.0948 },
  { code: 'MP-MT-VARILLA', name: 'Varilla', unit: 'und', unitPrice: 0.24 },
  { code: 'MP-MT-BASE', name: 'Base', unit: 'gal', unitPrice: 54 },
  { code: 'MP-MT-PINTURA-AZUL', name: 'Pintura azul', unit: 'gal', unitPrice: 58 },
  { code: 'MP-MT-PINTURA-ROJO', name: 'Pintura roja', unit: 'gal', unitPrice: 63.1 },
  { code: 'MP-MT-PINTURA-NEGRO', name: 'Pintura negra', unit: 'gal', unitPrice: 56.1 },
  { code: 'MP-MT-THINNER-EXTRA', name: 'Thinner extra', unit: 'gal', unitPrice: 21.1 },
  { code: 'MP-MT-THINNER-ACRILICO', name: 'Thinner acrílico', unit: 'gal', unitPrice: 16.5 },
  { code: 'MP-MT-ALUMINIO', name: 'Aluminio', unit: 'gal', unitPrice: 58 },
  { code: 'MP-MT-GAS', name: 'Gas', unit: 'kg', unitPrice: 180 },
  { code: 'MP-MT-SOLDADURA', name: 'Soldadura', unit: 'kg', unitPrice: 16.8 },
];

// Lote del Excel de Metal: 1,000 tapabarros (500 azules, 300 negros, 200 rojos) en 6 días.
// Cantidad por unidad = cantidad del lote ÷ 1,000; la pintura de cada color ÷ las unidades de ese color.
const METAL_FENDER_UNITS_PER_DAY = 1000 / 6;
const metalFenderItems: ProductRecipe['items'] = [
  { kind: 'perUnit', materialCode: 'MP-MT-PLANCHA', quantityPerUnit: 102 / 1000 },
  { kind: 'perUnit', materialCode: 'MP-MT-TUERCA', quantityPerUnit: 1000 / 1000 },
  { kind: 'perUnit', materialCode: 'MP-MT-VARILLA', quantityPerUnit: 1000 / 1000 },
  { kind: 'perUnit', materialCode: 'MP-MT-BASE', quantityPerUnit: 15 / 1000 },
  { kind: 'perUnit', materialCode: 'MP-MT-THINNER-EXTRA', quantityPerUnit: 28 / 1000 },
  { kind: 'perUnit', materialCode: 'MP-MT-THINNER-ACRILICO', quantityPerUnit: 23.2 / 1000 },
  { kind: 'perUnit', materialCode: 'MP-MT-ALUMINIO', quantityPerUnit: 6 / 1000 },
  { kind: 'perUnit', materialCode: 'MP-MT-GAS', quantityPerUnit: 0.5 / 1000 },
  { kind: 'perUnit', materialCode: 'MP-MT-SOLDADURA', quantityPerUnit: 4 / 1000 },
];

/** Recetas por producto. Solo los productos de los lotes del Excel tienen receta por ahora. */
export const recipes: ProductRecipe[] = [
  {
    sku: plasticExcelProduct.sku,
    line: 'plastico',
    // Lote del Excel de Plástico: 2,329 unidades en 7 días.
    unitsPerDay: 2329 / 7,
    items: [
      // PENDIENTE CONFIRMAR CON LA EMPRESA: 0.228 kg por unidad = pieza de 203 g + 25 g de merma (colada).
      { kind: 'resin', materialCode: 'MP-PL-PP', pieceWeightKg: 0.203, wastePercent: (25 / 203) * 100 },
      // PENDIENTE CONFIRMAR CON LA EMPRESA: dosificación sacada del lote del Excel, 1.48 kg de colorante y
      // 0.11 kg de titanio sobre 531.012 kg de resina (2,329 u × 0.228 kg).
      { kind: 'perKgResin', materialCode: 'MP-PL-COLORANTE', gramsPerKgResin: 1480 / 531.012 },
      { kind: 'perKgResin', materialCode: 'MP-PL-TITANIO', gramsPerKgResin: 110 / 531.012 },
    ],
  },
  // PENDIENTE CONFIRMAR CON LA EMPRESA: el lote del Excel de Metal parece ser el tapabarro metal posterior clásico.
  {
    sku: '206003163',
    line: 'metal',
    unitsPerDay: METAL_FENDER_UNITS_PER_DAY,
    items: [...metalFenderItems, { kind: 'perUnit', materialCode: 'MP-MT-PINTURA-AZUL', quantityPerUnit: 17 / 500 }],
  },
  {
    sku: '206003167',
    line: 'metal',
    unitsPerDay: METAL_FENDER_UNITS_PER_DAY,
    items: [...metalFenderItems, { kind: 'perUnit', materialCode: 'MP-MT-PINTURA-NEGRO', quantityPerUnit: 10 / 300 }],
  },
  {
    sku: '206003169',
    line: 'metal',
    unitsPerDay: METAL_FENDER_UNITS_PER_DAY,
    items: [...metalFenderItems, { kind: 'perUnit', materialCode: 'MP-MT-PINTURA-ROJO', quantityPerUnit: 7 / 200 }],
  },
];

/**
 * Gastos fijos semanales de la hoja EIC (según sus comentarios, monto mensual ÷ 4).
 * PENDIENTE CONFIRMAR CON LA EMPRESA: se usan los valores de las celdas; los comentarios dicen
 * alquiler 5,000 ÷ 4 × 50% = 625 y servicios generales 914 ÷ 4 = 228.50.
 */
function weeklyFixedCosts(generalServices: number): WeeklyFixedCost[] {
  return [
    { concept: 'Alquiler', weeklyAmount: 100 },
    { concept: 'Servicios generales de fábrica', weeklyAmount: generalServices },
    { concept: 'Mantenimiento y reparaciones de planta', weeklyAmount: 125 },
    { concept: 'Internet', weeklyAmount: 20 },
    { concept: 'Limpieza', weeklyAmount: 15 },
    { concept: 'Repuestos', weeklyAmount: 25 },
    { concept: 'Lubricantes', weeklyAmount: 50 },
    { concept: 'Extintores', weeklyAmount: 2.5 },
    { concept: 'Transporte interno', weeklyAmount: 50 },
  ];
}

// PENDIENTE CONFIRMAR CON LA EMPRESA: la hoja MPI no calcula un total; se lee como uso por lote × precio
// unitario (el EIC usa S/ 1,500 escritos a mano). Se ignoran las dos filas sin nombre.
const indirectMaterials: IndirectMaterial[] = [{ name: 'Trapo', unitPrice: 10, usagePerLot: 5 }];

/** Datos base de costo por línea (hojas CL PROD., DEP. MAQ., MPI, SSBB y EIC de cada Excel). */
export const lineSettings: Record<ProductionLine, LineCostSettings> = {
  plastico: {
    // PENDIENTE CONFIRMAR CON LA EMPRESA: 6 días laborables por semana para prorratear los gastos fijos.
    workDaysPerWeek: 6,
    directLabor: [
      // PENDIENTE CONFIRMAR CON LA EMPRESA: en el Excel Godofredo tiene 4 filas (8 + 9 + 8 + 6 = 31 h) y
      // Jefferson 3 (8 + 8 + 0.67 = 16.67 h) en el lote de 7 días; se usan como horas promedio por día.
      { kind: 'hourly', name: 'Godofredo', area: 'Inyección', payType: 'jornal', pay: 620, hoursPerDay: 31 / 7 },
      {
        kind: 'hourly',
        name: 'Jefferson',
        area: 'Inyección',
        payType: 'jornal',
        pay: 300,
        hoursPerDay: (8 + 8 + 40 / 60) / 7,
      },
      // PENDIENTE CONFIRMAR CON LA EMPRESA: 2.5 h en el lote de 7 días; se escalan con los días del lote.
      {
        kind: 'hourly',
        name: 'Eneida',
        area: 'Sellado y etiquetado',
        payType: 'mensual',
        pay: 1400,
        hoursPerDay: 2.5 / 7,
      },
    ],
    indirectLabor: [
      // PENDIENTE CONFIRMAR CON LA EMPRESA: 12 h en el lote de 7 días; se escalan con los días del lote.
      { kind: 'hourly', name: 'Shirley', area: 'Supervisión', payType: 'mensual', pay: 1300, hoursPerDay: 12 / 7 },
    ],
    machines: [
      // PENDIENTE CONFIRMAR CON LA EMPRESA: horas por día de la inyectora.
      { name: 'M5', quantity: 1, unitPrice: 25000, usefulLifeYears: 5, residualValue: 0, hoursPerDay: 7.4 },
    ],
    indirectMaterials,
    weeklyFixedCosts: weeklyFixedCosts(200),
    // PENDIENTE CONFIRMAR CON LA EMPRESA: la hoja SSBB da S/ 0 (suma columnas vacías); monto editable por lote.
    basicServicesPerLot: 0,
  },
  metal: {
    // PENDIENTE CONFIRMAR CON LA EMPRESA: 6 días laborables por semana para prorratear los gastos fijos.
    workDaysPerWeek: 6,
    directLabor: [
      { kind: 'hourly', name: 'Cabrera', area: 'Metales', payType: 'jornal', pay: 550, hoursPerDay: 8 },
      { kind: 'hourly', name: 'Casavilca', area: 'Metales', payType: 'jornal', pay: 480, hoursPerDay: 8 },
      { kind: 'hourly', name: 'Ccente', area: 'Metales', payType: 'jornal', pay: 380, hoursPerDay: 8 },
      { kind: 'hourly', name: 'Curichimba', area: 'Metales', payType: 'jornal', pay: 340, hoursPerDay: 8 },
      { kind: 'hourly', name: 'Espejo', area: 'Metales', payType: 'jornal', pay: 300, hoursPerDay: 8 },
      { kind: 'hourly', name: 'Jhared', area: 'Metales', payType: 'jornal', pay: 380, hoursPerDay: 8 },
      { kind: 'hourly', name: 'Raul', area: 'Metales', payType: 'jornal', pay: 350, hoursPerDay: 8 },
      { kind: 'hourly', name: 'Ruben', area: 'Metales', payType: 'jornal', pay: 550, hoursPerDay: 8 },
      // PENDIENTE CONFIRMAR CON LA EMPRESA: los dos operarios de empernado no tienen nombre en el Excel y
      // trabajan 1 día (8 h) en el lote de 6 días; se escalan con los días del lote.
      { kind: 'hourly', name: 'Empernado 1', area: 'Metales', payType: 'mensual', pay: 1300, hoursPerDay: 8 / 6 },
      { kind: 'hourly', name: 'Empernado 2', area: 'Metales', payType: 'mensual', pay: 1300, hoursPerDay: 8 / 6 },
      // PENDIENTE CONFIRMAR CON LA EMPRESA: pago a destajo por unidad (en el Excel, pago × cantidad ÷ 6 × días,
      // que solo coincide con el destajo cuando el lote dura 6 días).
      { kind: 'pieceRate', name: 'Cesar', area: 'Pintura y embolsado', ratePerUnit: 1.5 },
      // PENDIENTE CONFIRMAR CON LA EMPRESA: 2.5 h en el lote de 6 días; se escalan con los días del lote.
      {
        kind: 'hourly',
        name: 'Eneida',
        area: 'Sellado y etiquetado',
        payType: 'mensual',
        pay: 1400,
        hoursPerDay: 2.5 / 6,
      },
    ],
    indirectLabor: [
      // PENDIENTE CONFIRMAR CON LA EMPRESA: 12 h en el lote de 6 días; se escalan con los días del lote.
      { kind: 'hourly', name: 'Shirley', area: 'Supervisión', payType: 'mensual', pay: 1300, hoursPerDay: 12 / 6 },
    ],
    machines: [
      { name: 'Soldadora de arco', quantity: 1, unitPrice: 2500, usefulLifeYears: 5, residualValue: 0, hoursPerDay: 8 },
      { name: 'Prensa hidráulica', quantity: 1, unitPrice: 20000, usefulLifeYears: 5, residualValue: 0, hoursPerDay: 8 },
      { name: 'Prensa eléctrica', quantity: 10, unitPrice: 10000, usefulLifeYears: 5, residualValue: 0, hoursPerDay: 8 },
      { name: 'Esmeril', quantity: 1, unitPrice: 150, usefulLifeYears: 5, residualValue: 0, hoursPerDay: 8 },
      { name: 'Cizalla de mesa', quantity: 1, unitPrice: 100, usefulLifeYears: 5, residualValue: 0, hoursPerDay: 8 },
      { name: 'Cortadora de plancha', quantity: 1, unitPrice: 3500, usefulLifeYears: 5, residualValue: 0, hoursPerDay: 8 },
      { name: 'Cortadora dobladora', quantity: 3, unitPrice: 2167, usefulLifeYears: 5, residualValue: 0, hoursPerDay: 8 },
      { name: 'Máquina martillo', quantity: 1, unitPrice: 3000, usefulLifeYears: 5, residualValue: 0, hoursPerDay: 8 },
      { name: 'Soldadora de punto', quantity: 3, unitPrice: 2500, usefulLifeYears: 5, residualValue: 0, hoursPerDay: 8 },
    ],
    indirectMaterials,
    weeklyFixedCosts: weeklyFixedCosts(370),
    // PENDIENTE CONFIRMAR CON LA EMPRESA: la hoja SSBB da S/ 0 (suma columnas vacías); monto editable por lote.
    basicServicesPerLot: 0,
  },
};

/** Órdenes de fabricación de mayo a octubre de 2026. Su costo se calcula con la receta del producto. */
export const orders: ManufacturingOrder[] = [
  { id: 'OF-0001', sku: plasticExcelProduct.sku, quantity: 1800, status: 'terminada', date: '2026-05-04' },
  { id: 'OF-0002', sku: '206003163', quantity: 500, status: 'terminada', date: '2026-05-06' },
  { id: 'OF-0003', sku: '206003167', quantity: 300, status: 'terminada', date: '2026-05-12' },
  { id: 'OF-0004', sku: plasticExcelProduct.sku, quantity: 2000, status: 'terminada', date: '2026-05-13' },
  { id: 'OF-0005', sku: '206003169', quantity: 200, status: 'terminada', date: '2026-05-18' },
  { id: 'OF-0006', sku: plasticExcelProduct.sku, quantity: 2100, status: 'terminada', date: '2026-05-22' },
  { id: 'OF-0007', sku: '206003163', quantity: 600, status: 'terminada', date: '2026-05-25' },
  { id: 'OF-0008', sku: plasticExcelProduct.sku, quantity: 2100, status: 'terminada', date: '2026-06-02' },
  { id: 'OF-0009', sku: '206003167', quantity: 400, status: 'terminada', date: '2026-06-03' },
  { id: 'OF-0010', sku: '206003163', quantity: 700, status: 'terminada', date: '2026-06-09' },
  { id: 'OF-0011', sku: plasticExcelProduct.sku, quantity: 2329, status: 'terminada', date: '2026-06-11' },
  { id: 'OF-0012', sku: '206003169', quantity: 300, status: 'terminada', date: '2026-06-17' },
  { id: 'OF-0013', sku: plasticExcelProduct.sku, quantity: 2000, status: 'terminada', date: '2026-06-22' },
  { id: 'OF-0014', sku: '206003163', quantity: 500, status: 'terminada', date: '2026-06-24' },
  { id: 'OF-0015', sku: plasticExcelProduct.sku, quantity: 2329, status: 'terminada', date: '2026-07-01' },
  { id: 'OF-0016', sku: '206003163', quantity: 800, status: 'terminada', date: '2026-07-02' },
  { id: 'OF-0017', sku: plasticExcelProduct.sku, quantity: 2200, status: 'terminada', date: '2026-07-10' },
  { id: 'OF-0018', sku: '206003167', quantity: 500, status: 'terminada', date: '2026-07-10' },
  { id: 'OF-0019', sku: plasticExcelProduct.sku, quantity: 2400, status: 'terminada', date: '2026-07-20' },
  { id: 'OF-0020', sku: '206003169', quantity: 300, status: 'terminada', date: '2026-07-20' },
  { id: 'OF-0021', sku: plasticExcelProduct.sku, quantity: 2400, status: 'terminada', date: '2026-08-03' },
  { id: 'OF-0022', sku: '206003163', quantity: 900, status: 'terminada', date: '2026-08-04' },
  { id: 'OF-0023', sku: plasticExcelProduct.sku, quantity: 2329, status: 'terminada', date: '2026-08-12' },
  { id: 'OF-0024', sku: '206003167', quantity: 600, status: 'terminada', date: '2026-08-13' },
  { id: 'OF-0025', sku: '206003169', quantity: 400, status: 'terminada', date: '2026-08-21' },
  { id: 'OF-0026', sku: plasticExcelProduct.sku, quantity: 2500, status: 'terminada', date: '2026-08-24' },
  { id: 'OF-0027', sku: plasticExcelProduct.sku, quantity: 2500, status: 'terminada', date: '2026-09-01' },
  { id: 'OF-0028', sku: '206003163', quantity: 1000, status: 'terminada', date: '2026-09-02' },
  { id: 'OF-0029', sku: plasticExcelProduct.sku, quantity: 2600, status: 'terminada', date: '2026-09-10' },
  { id: 'OF-0030', sku: '206003167', quantity: 500, status: 'terminada', date: '2026-09-11' },
  { id: 'OF-0031', sku: '206003169', quantity: 400, status: 'terminada', date: '2026-09-18' },
  { id: 'OF-0032', sku: plasticExcelProduct.sku, quantity: 2329, status: 'terminada', date: '2026-09-21' },
  { id: 'OF-0033', sku: '206003163', quantity: 300, status: 'en_proceso', date: '2026-09-24' },
  { id: 'OF-0034', sku: plasticExcelProduct.sku, quantity: 2700, status: 'terminada', date: '2026-10-01' },
  { id: 'OF-0035', sku: '206003163', quantity: 700, status: 'terminada', date: '2026-10-02' },
  { id: 'OF-0036', sku: '206003167', quantity: 400, status: 'terminada', date: '2026-10-08' },
  { id: 'OF-0037', sku: plasticExcelProduct.sku, quantity: 2329, status: 'en_proceso', date: '2026-10-12' },
  { id: 'OF-0038', sku: '206003169', quantity: 300, status: 'en_proceso', date: '2026-10-14' },
  { id: 'OF-0039', sku: '206003163', quantity: 400, status: 'en_proceso', date: '2026-10-19' },
  { id: 'OF-0040', sku: plasticExcelProduct.sku, quantity: 2800, status: 'estimada', date: '2026-10-21' },
  { id: 'OF-0041', sku: '206003167', quantity: 300, status: 'estimada', date: '2026-10-23' },
];
