import { STATUS_LABELS, type OrderStatus } from '../types/manufacturing';

const STATUS_STYLES: Record<OrderStatus, { badge: string; dot: string }> = {
  estimada: { badge: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  en_proceso: { badge: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
  terminada: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const styles = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${styles.badge}`}
    >
      <span className={`size-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
