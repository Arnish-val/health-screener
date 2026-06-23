import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, LogIn, Phone, AlertTriangle } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';
import { AuthContext } from '../../contexts/auth-context';

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

      {/* ── High Risk: Government Helpline Banner ──────────────────────────── */}
      {result.risk_level === 'High' && (
        <div className="mt-2 rounded-2xl border border-red-300 dark:border-red-700/60 bg-red-50 dark:bg-red-900/25 overflow-hidden">
          {/* Header strip */}
          <div className="flex items-center gap-2 px-4 py-3 bg-red-100 dark:bg-red-900/40 border-b border-red-200 dark:border-red-700/40">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm font-bold text-red-700 dark:text-red-300">
              Your score indicates a high risk — you are not alone.
            </p>
          </div>

          {/* Body */}
          <div className="px-4 py-4 space-y-3">
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
              Please reach out to a trained mental-health professional today.
              These free, confidential Indian government-supported helplines are
              available <strong>24 hours a day, 7 days a week</strong>.
            </p>

            {/* Helpline cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  name: 'iCall (TISS)',
                  number: '9152987821',
                  desc: 'Mon–Sat, 8 am – 10 pm',
                  color: 'bg-white dark:bg-slate-800/60',
                },
                {
                  name: 'Vandrevala Foundation',
                  number: '1860-2662-345',
                  desc: '24 × 7 helpline',
                  color: 'bg-white dark:bg-slate-800/60',
                },
                {
                  name: 'NIMHANS Helpline',
                  number: '080-46110007',
                  desc: 'National mental health line',
                  color: 'bg-white dark:bg-slate-800/60',
                },
                {
                  name: 'Snehi NGO',
                  number: '044-24640050',
                  desc: 'Emotional support & counselling',
                  color: 'bg-white dark:bg-slate-800/60',
                },
              ].map(({ name, number, desc, color }) => (
                <a
                  key={name}
                  href={`tel:${number.replace(/\D/g, '')}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border border-red-100 dark:border-red-800/40 ${color} hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors group`}
                >
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-200 dark:group-hover:bg-red-800/60 transition-colors">
                    <Phone className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{name}</p>
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums">{number}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                  </div>
                </a>
              ))}
            </div>

            <p className="text-xs text-red-500 dark:text-red-500 italic">
              This tool is not a clinical diagnosis. Please consult a qualified
              healthcare professional for an official evaluation.
            </p>
          </div>
        </div>
      )}

      {/* ── Low Risk: Positive reinforcement note ─────────────────────────── */}
      {result.risk_level === 'Low' && (
        <div className="mt-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-3">
          <span className="text-xl flex-shrink-0 mt-0.5" aria-hidden="true">🌿</span>
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Your score is reassuringly low — great news!
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 leading-relaxed">
              Keep up the healthy habits. If you ever feel overwhelmed, iCall (9152987821) 
              and the Vandrevala Foundation (1860-2662-345) are always available for a chat.
            </p>
          </div>
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
