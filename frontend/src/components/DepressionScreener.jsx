import { useState } from 'react';
import axios from 'axios';
import { Brain, Loader2, AlertTriangle, Info } from 'lucide-react';
import Disclaimer from './Disclaimer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const INITIAL_STATE = {
  Gender: 0,
  Age: 21,
  Academic_Pressure: 3,
  Work_Pressure: 2,
  CGPA: 7.5,
  Study_Satisfaction: 3,
  Job_Satisfaction: 3,
  Sleep_Duration: 2,
  Dietary_Habits: 1,
  Suicidal_Thoughts: 0,
  Work_Study_Hours: 6,
  Financial_Stress: 3,
  Family_History: 0
};

export default function DepressionScreener() {
  const [metrics, setMetrics] = useState(INITIAL_STATE);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateMetric = (key, val) => {
    setMetrics((prev) => ({ ...prev, [key]: parseFloat(val) }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await axios.post(`${API_URL}/predict/depression`, metrics);
      setResult(res.data);
    } catch (err) {
      setError('Could not reach the prediction server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100/50 dark:bg-emerald-900/40 flex items-center justify-center">
          <Brain className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Student Mental Health Screener
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Adjust your demographic and lifestyle metrics based on official survey parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
         
         {/* Demographic */}
         <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">Demographic</h3>
            
            <div className="flex items-center justify-between">
               <label className="text-sm text-slate-700 dark:text-slate-300">Gender</label>
               <select value={metrics.Gender} onChange={e => updateMetric('Gender', e.target.value)} className="glass-input rounded-lg px-3 py-1 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                  <option value={0} className="dark:bg-slate-800">Female</option>
                  <option value={1} className="dark:bg-slate-800">Male</option>
               </select>
            </div>
            
            <div className="flex items-center justify-between">
               <label className="text-sm text-slate-700 dark:text-slate-300">Age</label>
               <input type="number" min="15" max="40" value={metrics.Age} onChange={e => updateMetric('Age', e.target.value)} className="glass-input w-20 rounded-lg px-3 py-1 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium text-right"/>
            </div>
         </div>

         {/* Psychological */}
         <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">Psychological Indicators</h3>
            
            <div className="flex items-center justify-between">
               <label className="text-sm text-slate-700 dark:text-slate-300">Family History of Mental Illness</label>
               <select value={metrics.Family_History} onChange={e => updateMetric('Family_History', e.target.value)} className="glass-input rounded-lg px-3 py-1 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                  <option value={0} className="dark:bg-slate-800">No</option>
                  <option value={1} className="dark:bg-slate-800">Yes</option>
               </select>
            </div>

            <div className="flex items-center justify-between">
               <label className="text-sm text-slate-700 dark:text-slate-300">Prior Suicidal Thoughts?</label>
               <select value={metrics.Suicidal_Thoughts} onChange={e => updateMetric('Suicidal_Thoughts', e.target.value)} className="glass-input border-red-200 dark:border-red-900/50 focus:border-red-500 rounded-lg px-3 py-1 outline-none text-sm text-red-600 dark:text-red-400 font-medium">
                  <option value={0} className="dark:bg-slate-800">No</option>
                  <option value={1} className="dark:bg-slate-800">Yes</option>
               </select>
            </div>
         </div>

         {/* Academic & Work */}
         <div className="md:col-span-2 glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">Academic & Stress Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
               {/* 1-5 sliders */}
               {[
                  { key: 'Academic_Pressure', label: 'Academic Pressure', min: 0, max: 5 },
                  { key: 'Work_Pressure', label: 'Work Pressure', min: 0, max: 5 },
                  { key: 'Study_Satisfaction', label: 'Study Satisfaction', min: 0, max: 5 },
                  { key: 'Job_Satisfaction', label: 'Job Satisfaction', min: 0, max: 5 },
                  { key: 'Financial_Stress', label: 'Financial Stress', min: 0, max: 5 },
               ].map((item) => (
                  <div key={item.key}>
                     <div className="flex items-center justify-between mb-1">
                        <label className="text-sm text-slate-700 dark:text-slate-300">{item.label}</label>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{metrics[item.key]} / 5</span>
                     </div>
                     <input type="range" min={item.min} max={item.max} value={metrics[item.key]} onChange={e => updateMetric(item.key, e.target.value)} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-emerald-600 dark:accent-emerald-500"/>
                  </div>
               ))}

               {/* Custom sliders */}
               <div>
                  <div className="flex items-center justify-between mb-1">
                     <label className="text-sm text-slate-700 dark:text-slate-300">CGPA</label>
                     <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{metrics.CGPA}</span>
                  </div>
                  <input type="range" min="0" max="10" step="0.1" value={metrics.CGPA} onChange={e => updateMetric('CGPA', e.target.value)} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-emerald-600 dark:accent-emerald-500"/>
               </div>
               
               <div>
                  <div className="flex items-center justify-between mb-1">
                     <label className="text-sm text-slate-700 dark:text-slate-300">Work/Study Hours (Daily)</label>
                     <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{metrics.Work_Study_Hours} hr</span>
                  </div>
                  <input type="range" min="0" max="16" step="0.5" value={metrics.Work_Study_Hours} onChange={e => updateMetric('Work_Study_Hours', e.target.value)} className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none accent-emerald-600 dark:accent-emerald-500"/>
               </div>
            </div>
         </div>

         {/* Lifestyle */}
         <div className="md:col-span-2 glass-panel p-5 rounded-2xl space-y-4">
             <h3 className="font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700/50 pb-2">Lifestyle Metrics</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="text-sm text-slate-700 dark:text-slate-300 block mb-2">Sleep Duration</label>
                  <select value={metrics.Sleep_Duration} onChange={e => updateMetric('Sleep_Duration', e.target.value)} className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                     <option value={0} className="dark:bg-slate-800">Less than 5 hours</option>
                     <option value={1} className="dark:bg-slate-800">5 - 6 hours</option>
                     <option value={2} className="dark:bg-slate-800">7 - 8 hours</option>
                     <option value={3} className="dark:bg-slate-800">More than 8 hours</option>
                  </select>
               </div>
               <div>
                  <label className="text-sm text-slate-700 dark:text-slate-300 block mb-2">Dietary Habits</label>
                  <select value={metrics.Dietary_Habits} onChange={e => updateMetric('Dietary_Habits', e.target.value)} className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                     <option value={0} className="dark:bg-slate-800">Unhealthy</option>
                     <option value={1} className="dark:bg-slate-800">Moderate</option>
                     <option value={2} className="dark:bg-slate-800">Healthy</option>
                  </select>
               </div>
             </div>
         </div>

      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-[#059669] text-white text-base font-semibold shadow-lg shadow-[#059669]/25 hover:bg-[#047857] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          'Screen Risk Level'
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-100 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="glass-panel p-6 rounded-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assessment Results</p>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
               <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{result.condition}</h3>
             </div>
             
             <div className={`px-4 py-3 rounded-xl flex items-start gap-3 max-w-sm ${result.risk_level === 'High' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50' : result.risk_level === 'Moderate' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'}`}>
               <Info className="w-5 h-5 shrink-0 mt-0.5" />
               <p className="text-sm leading-snug font-medium">
                 {result.action}
               </p>
             </div>
          </div>

          {/* Aggregate Risk bar */}
          <div className="space-y-2">
             <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Likelihood Vector (ROC-AUC model)</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{result.risk_percentage}%</span>
             </div>
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${result.risk_level === 'High' ? 'bg-red-500' : result.risk_level === 'Moderate' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${result.risk_percentage}%` }}
              />
            </div>
          </div>

        </div>
      )}

      {/* Disclaimer */}
      <Disclaimer />
    </div>
  );
}
