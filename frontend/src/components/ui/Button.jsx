import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-[#106EBE] text-white shadow-lg shadow-[#106EBE]/25 hover:bg-[#0A4F8A] hover:-translate-y-0.5',
  secondary:
    'bg-transparent text-slate-700 dark:text-slate-200 border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800',
  danger:
    'bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600 hover:-translate-y-0.5',
  ghost:
    'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-3 text-base rounded-xl',
  lg: 'px-6 py-4 text-lg rounded-2xl',
};

/**
 * Reusable Button component with variant/size system.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        cursor-pointer transition-all duration-200 active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `.trim()}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
