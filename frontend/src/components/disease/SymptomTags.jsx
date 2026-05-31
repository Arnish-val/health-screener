const formatLabel = (key) =>
  key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace('(Typhos)', '')
    .trim();

/**
 * Selected symptom tags — click to remove.
 */
export default function SymptomTags({ symptoms, onRemove }) {
  const selected = Object.keys(symptoms).filter((k) => symptoms[k]);

  if (selected.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-slate-700/50">
      {selected.map((k) => (
        <span
          key={k}
          onClick={() => onRemove(k)}
          className="px-3 py-1 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-semibold rounded-full cursor-pointer hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
        >
          {formatLabel(k)} &times;
        </span>
      ))}
    </div>
  );
}
