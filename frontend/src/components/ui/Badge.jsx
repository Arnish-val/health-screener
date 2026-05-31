const variantClasses = {
  default: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  primary: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  info: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
};

/**
 * Pill-shaped badge for status indicators.
 */
export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variantClasses[variant] || variantClasses.default} ${className}`}
    >
      {children}
    </span>
  );
}
