/**
 * Lifestyle inputs — Sleep Duration and Dietary Habits selects.
 */
export default function LifestyleForm({ metrics, onUpdate }) {
  return (
    <div className="md:col-span-2 glass-panel p-5 rounded-2xl space-y-4">
      <h3 className="font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">
        Lifestyle Metrics
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-700 dark:text-slate-300 block mb-2">
            Sleep Duration
          </label>
          <select
            value={metrics.Sleep_Duration}
            onChange={(e) => onUpdate('Sleep_Duration', e.target.value)}
            className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
          >
            <option value={0} className="dark:bg-slate-800">Less than 5 hours</option>
            <option value={1} className="dark:bg-slate-800">5 - 6 hours</option>
            <option value={2} className="dark:bg-slate-800">7 - 8 hours</option>
            <option value={3} className="dark:bg-slate-800">More than 8 hours</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-700 dark:text-slate-300 block mb-2">
            Dietary Habits
          </label>
          <select
            value={metrics.Dietary_Habits}
            onChange={(e) => onUpdate('Dietary_Habits', e.target.value)}
            className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
          >
            <option value={0} className="dark:bg-slate-800">Unhealthy</option>
            <option value={1} className="dark:bg-slate-800">Moderate</option>
            <option value={2} className="dark:bg-slate-800">Healthy</option>
          </select>
        </div>
      </div>
    </div>
  );
}
