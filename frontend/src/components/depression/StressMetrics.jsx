/**
 * Academic & work stress sliders.
 */

const SLIDER_FIELDS = [
  { key: 'Academic_Pressure', label: 'Academic Pressure', min: 0, max: 5 },
  { key: 'Work_Pressure', label: 'Work Pressure (if employed / part-time)', min: 0, max: 5 },
  { key: 'Study_Satisfaction', label: 'Study Satisfaction', min: 0, max: 5 },
  { key: 'Job_Satisfaction', label: 'Job Satisfaction (if employed / part-time)', min: 0, max: 5 },
  { key: 'Financial_Stress', label: 'Financial Stress', min: 0, max: 5 },
];

export default function StressMetrics({ metrics, onUpdate }) {
  return (
    <div className="md:col-span-2 glass-panel p-5 rounded-2xl space-y-4">
      <h3 className="font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">
        Academic & Stress Metrics
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {/* 0-5 sliders */}
        {SLIDER_FIELDS.map((item) => (
          <div key={item.key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-slate-700 dark:text-slate-300">
                {item.label}
              </label>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {metrics[item.key]} / 5
              </span>
            </div>
            <input
              type="range"
              min={item.min}
              max={item.max}
              value={metrics[item.key]}
              onChange={(e) => onUpdate(item.key, e.target.value)}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-emerald-600 dark:accent-emerald-500"
            />
          </div>
        ))}

        {/* CGPA */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-slate-700 dark:text-slate-300">CGPA</label>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.CGPA}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={metrics.CGPA}
            onChange={(e) => onUpdate('CGPA', e.target.value)}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-emerald-600 dark:accent-emerald-500"
          />
        </div>

        {/* Work/Study Hours */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-slate-700 dark:text-slate-300">
              Work/Study Hours (Daily)
            </label>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.Work_Study_Hours} hr
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="16"
            step="0.5"
            value={metrics.Work_Study_Hours}
            onChange={(e) => onUpdate('Work_Study_Hours', e.target.value)}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-emerald-600 dark:accent-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
