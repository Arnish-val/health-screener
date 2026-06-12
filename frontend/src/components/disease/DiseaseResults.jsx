import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge';
import { AuthContext } from '../../contexts/auth-context';
import { LogIn } from 'lucide-react';

/**
 * Disease prediction results — shows top-3 conditions.
 */
export default function DiseaseResults({ result }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!result) return null;

  return (
    <div className="glass-panel p-6 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <h3 className="text-xl font-bold text-slate-800 dark:text-white">
        Analysis Results
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Based on Random Forest classification of 132 features.
      </p>

      <div className="space-y-3 mt-4">
        {result.top3.map((cond, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 glass-card rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  i === 0
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                #{i + 1}
              </div>
              <span
                className={`font-semibold ${
                  i === 0
                    ? 'text-cyan-700 dark:text-cyan-400 text-lg'
                    : 'text-slate-800 dark:text-slate-200'
                }`}
              >
                {cond.condition}
              </span>
            </div>
            <Badge variant={i === 0 ? 'primary' : 'default'}>
              {(cond.probability * 100).toFixed(1)}%
            </Badge>
          </div>
        ))}
      </div>

      {result.feedback && (
        <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
          <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            AI Insight
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
            {result.feedback}
          </p>
        </div>
      )}

      {!user && (
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Want to save these results to track your health history?
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
