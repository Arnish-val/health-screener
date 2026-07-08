import { useState } from 'react';
import { Brain, GraduationCap, Briefcase, ArrowRight, ArrowLeft } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { predictDepressionStudent, predictDepressionProfessional } from '../../api/depressionApi';

void motion;
import useApi from '../../hooks/useApi';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import DemographicForm from './DemographicForm';
import PsychologicalForm from './PsychologicalForm';
import StressMetrics from './StressMetrics';
import LifestyleForm from './LifestyleForm';
import ProfessionalForm from './ProfessionalForm';
import RiskResults from './RiskResults';
import Disclaimer from '../shared/Disclaimer';

const STUDENT_INITIAL_STATE = {
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

const PROFESSIONAL_INITIAL_STATE = {
  Age: 30,
  Gender: 'Male',
  self_employed: 'No',
  family_history: 'No',
  work_interfere: 'Sometimes',
  no_employees: '26-100',
  remote_work: 'No',
  tech_company: 'Yes',
  benefits: 'Yes',
  care_options: 'Yes',
  wellness_program: 'No',
  seek_help: 'Yes',
  anonymity: 'Yes',
  leave: 'Somewhat easy',
  mental_health_consequence: 'No',
  phys_health_consequence: 'No',
  coworkers: 'Some of them',
  supervisor: 'Yes',
  mental_health_interview: 'No',
  phys_health_interview: 'Maybe',
  mental_vs_physical: 'Yes',
  obs_consequence: 'No',
};

export default function DepressionScreener() {
  const [step, setStep] = useState('setup'); // 'setup' | 'questions'
  const [persona, setPersona] = useState(null); // 'student' | 'professional'
  const [ageInput, setAgeInput] = useState('');
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [metrics, setMetrics] = useState({});

  const studentApi = useApi(predictDepressionStudent);
  const professionalApi = useApi(predictDepressionProfessional);

  const activeApi = persona === 'student' ? studentApi : professionalApi;
  const result = activeApi.data;
  const loading = activeApi.loading;
  const error = activeApi.error;
  const execute = activeApi.execute;

  const isAgeValid = (age, role) => {
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum)) return false;
    if (role === 'student') return ageNum >= 15 && ageNum <= 80;
    if (role === 'professional') return ageNum >= 15 && ageNum <= 90;
    return ageNum >= 15 && ageNum <= 90;
  };

  const handleBegin = () => {
    if (!isAgeValid(ageInput, selectedPersona)) return;
    setPersona(selectedPersona);
    setMetrics(
      selectedPersona === 'student'
        ? { ...STUDENT_INITIAL_STATE, Age: parseInt(ageInput, 10) }
        : { ...PROFESSIONAL_INITIAL_STATE, Age: parseInt(ageInput, 10) }
    );
    setStep('questions');
    activeApi.reset();
  };

  const updateMetric = (key, val) => {
    const parsedVal = typeof val === 'string' && !isNaN(val) && val.trim() !== '' ? parseFloat(val) : val;
    setMetrics((prev) => ({ ...prev, [key]: parsedVal }));
  };

  const handleSubmit = () => {
    if (!isAgeValid(metrics.Age, persona)) return;
    execute(metrics);
  };

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
            {persona === 'professional' ? 'Professional Mental Health Screener' : 'Student Mental Health Screener'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {step === 'setup' 
              ? 'Select your profile to start the screening.' 
              : `Adjust your demographic and lifestyle metrics based on official ${persona} survey parameters.`}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'setup' ? (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="glass-panel p-6 rounded-2xl max-w-lg mx-auto space-y-6 shadow-xl border border-slate-200/40 dark:border-slate-700/30"
          >
            <div className="space-y-2">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">Select Screener Profile</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Choose the profile that matches your current occupation.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedPersona('student')}
                className={`cursor-pointer flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-300 ${
                  selectedPersona === 'student'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-450 shadow-md shadow-emerald-500/5'
                    : 'glass-card border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className={`p-3 rounded-full mb-3 ${selectedPersona === 'student' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <GraduationCap className="w-8 h-8" />
                </div>
                <span className="font-bold text-sm">Student Profile</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Focuses on academic pressure, study habits, and GPAs.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPersona('professional')}
                className={`cursor-pointer flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all duration-300 ${
                  selectedPersona === 'professional'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-450 shadow-md shadow-emerald-500/5'
                    : 'glass-card border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className={`p-3 rounded-full mb-3 ${selectedPersona === 'professional' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <Briefcase className="w-8 h-8" />
                </div>
                <span className="font-bold text-sm">Working Professional</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Focuses on workplace culture, benefits, and burnout.
                </span>
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                Enter your Age
              </label>
              <input
                type="number"
                placeholder="e.g., 25"
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                className="glass-input w-full rounded-xl px-4 py-3.5 outline-none text-sm font-medium text-slate-800 dark:text-slate-200"
              />
              {ageInput !== '' && !isAgeValid(ageInput, selectedPersona) && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  ⚠️ Age must be between 15 and {selectedPersona === 'student' ? '80' : '90'}.
                </p>
              )}
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleBegin}
              disabled={!selectedPersona || !isAgeValid(ageInput, selectedPersona)}
              className="w-full cursor-pointer flex items-center justify-center gap-2"
            >
              Begin Screener
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="questions"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setStep('setup');
                  activeApi.reset();
                }}
                className="cursor-pointer flex items-center gap-1 text-sm font-semibold text-slate-650 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Change Profile
              </button>
              <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400">
                Persona: {persona === 'student' ? 'Student' : 'Professional'}
              </span>
            </div>

            {persona === 'student' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DemographicForm metrics={metrics} onUpdate={updateMetric} />
                <PsychologicalForm metrics={metrics} onUpdate={updateMetric} />
                <StressMetrics metrics={metrics} onUpdate={updateMetric} />
                <LifestyleForm metrics={metrics} onUpdate={updateMetric} />
              </div>
            ) : (
              <ProfessionalForm metrics={metrics} onUpdate={updateMetric} />
            )}

            <Button
              variant="primary"
              size="lg"
              loading={loading}
              disabled={!isAgeValid(metrics.Age, persona)}
              onClick={handleSubmit}
              className="w-full cursor-pointer"
            >
              {loading ? 'Analyzing...' : 'Screen Risk Level'}
            </Button>

            {error && <Alert variant="error">{error}</Alert>}

            <RiskResults result={resultData} />

            <Disclaimer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
