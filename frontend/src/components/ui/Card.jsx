/**
 * Glass-morphism card component with optional header.
 */
export default function Card({ title, children, className = '', ...props }) {
  return (
    <div
      className={`glass-panel rounded-2xl overflow-hidden ${className}`}
      {...props}
    >
      {title && (
        <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <h3 className="font-semibold text-slate-800 dark:text-white">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
