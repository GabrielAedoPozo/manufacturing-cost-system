import type { ReactNode } from 'react';

interface CardProps {
  title: string;
  subtitle?: string;
  /** Contenido a la derecha del título, p. ej. un enlace. */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export default function Card({ title, subtitle, action, className = '', children }: CardProps) {
  return (
    <section className={`flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 ${className}`}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </section>
  );
}
