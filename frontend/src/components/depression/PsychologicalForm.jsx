/**
 * Psychological indicator inputs — Family History and Suicidal Thoughts.
 */
export default function PsychologicalForm({ metrics, onUpdate }) {
  return (
    <div className="glass-panel p-5 rounded-2xl space-y-4">
      <h3 className="font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">
        Psychological Indicators
      </h3>

      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Family History of Mental Illness
        </label>
        <select
          value={metrics.Family_History}
          onChange={(e) => onUpdate('Family_History', e.target.value)}
          className="glass-input rounded-lg px-3 py-1 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
        >
          <option value={0} className="dark:bg-slate-800">No</option>
          <option value={1} className="dark:bg-slate-800">Yes</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Prior Suicidal Thoughts?
        </label>
        <select
          value={metrics.Suicidal_Thoughts}
          onChange={(e) => onUpdate('Suicidal_Thoughts', e.target.value)}
          className="glass-input border-red-200 dark:border-red-900/50 focus:border-red-500 rounded-lg px-3 py-1 outline-none text-sm text-red-600 dark:text-red-400 font-medium"
        >
          <option value={0} className="dark:bg-slate-800">No</option>
          <option value={1} className="dark:bg-slate-800">Yes</option>
        </select>
      </div>
    </div>
  );
}
