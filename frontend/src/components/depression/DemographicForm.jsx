/**
 * Demographic inputs — Gender and Age fields.
 */
export default function DemographicForm({ metrics, onUpdate }) {
  return (
    <div className="glass-panel p-5 rounded-2xl space-y-4">
      <h3 className="font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">
        Demographic
      </h3>

      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-700 dark:text-slate-300">Gender</label>
        <select
          value={metrics.Gender}
          onChange={(e) => onUpdate('Gender', e.target.value)}
          className="glass-input rounded-lg px-3 py-1 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
        >
          <option value={0} className="dark:bg-slate-800">Female</option>
          <option value={1} className="dark:bg-slate-800">Male</option>
        </select>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm text-slate-700 dark:text-slate-300">Age</label>
        <input
          type="number"
          min="15"
          max="40"
          value={metrics.Age}
          onChange={(e) => onUpdate('Age', e.target.value)}
          className="glass-input w-20 rounded-lg px-3 py-1 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium text-right"
        />
      </div>
    </div>
  );
}
