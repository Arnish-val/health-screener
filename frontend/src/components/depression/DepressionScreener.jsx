import { useState } from 'react';
import { Brain } from 'lucide-react';
import { predictDepression } from '../../api/depressionApi';
import useApi from '../../hooks/useApi';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import DemographicForm from './DemographicForm';
import PsychologicalForm from './PsychologicalForm';
import StressMetrics from './StressMetrics';
import LifestyleForm from './LifestyleForm';
import RiskResults from './RiskResults';
import Disclaimer from '../shared/Disclaimer';

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
  Family_History: 0,
};

export default function DepressionScreener() {
  const [metrics, setMetrics] = useState(INITIAL_STATE);
  const { data: result, loading, error, execute } = useApi(predictDepression);

  const updateMetric = (key, val) => {
    setMetrics((prev) => ({ ...prev, [key]: parseFloat(val) }));
  };

  const handleSubmit = () => execute(metrics);

  // Unwrap APIResponse envelope
  const resultData = result?.data || result;

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
            Adjust your demographic and lifestyle metrics based on official survey
            parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <DemographicForm metrics={metrics} onUpdate={updateMetric} />
        <PsychologicalForm metrics={metrics} onUpdate={updateMetric} />
        <StressMetrics metrics={metrics} onUpdate={updateMetric} />
        <LifestyleForm metrics={metrics} onUpdate={updateMetric} />
      </div>

      <Button
        variant="primary"
        size="lg"
        loading={loading}
        onClick={handleSubmit}
        className="w-full"
      >
        {loading ? 'Analyzing...' : 'Screen Risk Level'}
      </Button>

      {error && <Alert variant="error">{error}</Alert>}

      <RiskResults result={resultData} />

      <Disclaimer />
    </div>
  );
}
