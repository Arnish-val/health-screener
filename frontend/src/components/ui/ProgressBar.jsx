const colorMap = {
  emerald: 'bg-emerald-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  cyan: 'bg-cyan-500',
  slate: 'bg-slate-500',
};

/**
 * Animated progress bar with color variants.
 */
export default function ProgressBar({
  value = 0,
  color = 'emerald',
  className = '',
  showLabel = true,
}) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={`space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex justify-end">
          <span className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-300">
            {clampedValue}%
          </span>
        </div>
      )}
      <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${colorMap[color] || colorMap.emerald}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
