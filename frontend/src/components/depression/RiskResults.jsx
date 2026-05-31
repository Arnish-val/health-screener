import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, LogIn } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import { AuthContext } from '../../contexts/AuthContext';

/**
 * Depression risk result display with progress bar and action advice.
 */
export default function RiskResults({ result }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!result) return null;

  const riskColorMap = {
    High: 'red',
    Moderate: 'amber',
    Low: 'emerald',
  };

  const riskBgMap = {
    High: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50',
    Moderate: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50',
    Low: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50',
  };

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        Assessment Results
      </p>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
            {result.condition}
          </h3>
        </div>

        <div
          className={`px-4 py-3 rounded-xl flex items-start gap-3 max-w-sm ${riskBgMap[result.risk_level] || riskBgMap.Low}`}
        >
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm leading-snug font-medium">{result.action}</p>
        </div>
      </div>

      {/* Risk progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Likelihood Vector (ROC-AUC model)
          </span>
        </div>
        <ProgressBar
          value={result.risk_percentage}
          color={riskColorMap[result.risk_level] || 'emerald'}
        />
      </div>

      {result.feedback && (
        <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
          <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Personalized Action Plan
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
            {result.feedback}
          </p>
        </div>
      )}

      {!user && (
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Want to save these results to track your mental health over time?
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors whitespace-nowrap"
          >
            <LogIn className="w-4 h-4" /> Sign up to save
          </button>
        </div>
      )}
    </div>
  );
}
