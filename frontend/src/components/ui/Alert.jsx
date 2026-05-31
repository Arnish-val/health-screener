import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

const config = {
  error: {
    icon: XCircle,
    classes: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
  },
  info: {
    icon: Info,
    classes: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/50',
  },
  success: {
    icon: CheckCircle2,
    classes: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
  },
};

/**
 * Alert component with variant-based styling and icon.
 */
export default function Alert({
  variant = 'info',
  title,
  children,
  className = '',
}) {
  const { icon: Icon, classes } = config[variant] || config.info;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${classes} ${className}`}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
