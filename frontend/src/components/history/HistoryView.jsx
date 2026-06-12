import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth-context';
import { historyApi } from '../../api/historyApi';
import { Activity, Brain, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

void motion;
import TrendChart from './TrendChart';
import { CardSkeleton } from '../ui/Skeleton';

export default function HistoryView() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { from: { pathname: '/history' } } });
      return;
    }

    const fetchHistory = async () => {
      try {
        const response = await historyApi.getHistory();
        setHistory(response.data);
      } catch {
        setError('Failed to load history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-4">
        <div className="mb-8">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-96 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight mb-2">
          Your Assessment History
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Review your past disease and mental health predictions securely stored in your profile.
        </p>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      {history.length === 0 ? (
        <div className="glass-panel p-10 rounded-[2rem] text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">No History Yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">You haven't run any assessments yet. Run a screener to save your results here.</p>
          <div className="flex justify-center gap-4">
            <button onClick={() => navigate('/disease')} className="btn-secondary px-6 py-2">
              Disease Screener
            </button>
            <button onClick={() => navigate('/depression')} className="btn-secondary px-6 py-2">
              Mental Health Screener
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <TrendChart history={history} />
          <div className="space-y-4">
          {history.map((record) => {
            const date = new Date(record.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const isDisease = record.assessment_type === 'disease';
            const Icon = isDisease ? Activity : Brain;
            const data = record.result_data;

            return (
              <motion.div 
                key={record.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row gap-6 items-start md:items-center"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isDisease ? 'bg-[#106EBE]/10 dark:bg-[#106EBE]/20 text-[#106EBE] dark:text-[#4A9BE4]' : 'bg-[#0FFCBE]/10 dark:bg-[#0FFCBE]/20 text-[#0BBF90] dark:text-[#0FFCBE]'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800 dark:text-white text-lg">
                      {isDisease ? 'Disease Prediction' : 'Depression Screener'}
                    </h3>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {date}
                    </span>
                  </div>
                  
                  {isDisease ? (
                     <div className="text-slate-600 dark:text-slate-300 text-sm">
                       Top match: <span className="font-semibold text-[#106EBE] dark:text-[#4A9BE4]">{data.prediction}</span> ({Math.round(data.top3[0].probability * 100)}%)
                     </div>
                  ) : (
                     <div className="text-slate-600 dark:text-slate-300 text-sm">
                       Risk Level: <span className="font-semibold text-[#0BBF90] dark:text-[#0FFCBE]">{data.risk_level}</span> ({data.risk_percentage}%)
                     </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
