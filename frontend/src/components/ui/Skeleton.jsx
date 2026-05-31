/**
 * Skeleton loading placeholder with pulse animation.
 */
export default function Skeleton({ className = '', lines = 1 }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"
          style={{ width: `${Math.max(40, 100 - i * 15)}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Card-shaped skeleton for loading states.
 */
export function CardSkeleton({ className = '' }) {
  return (
    <div className={`glass-panel rounded-2xl p-6 space-y-4 ${className}`}>
      <div className="h-6 w-1/3 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      <Skeleton lines={3} />
      <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
    </div>
  );
}
