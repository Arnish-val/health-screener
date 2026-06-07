import { useState, useCallback, useEffect, useRef } from 'react';
import { Brain, Upload, FileText, ChevronRight, ChevronLeft, AlertTriangle, Activity, Eye, Zap, BookOpen, Clock, BarChart3, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { predictAlzheimers } from '../../api/alzheimersApi';
import useApi from '../../hooks/useApi';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Disclaimer from '../shared/Disclaimer';

// ─── Constants ──────────────────────────────────────────────────────────────

const STEPS = ['intro', 'cognitive', 'fmri', 'results'];

const COGNITIVE_DOMAINS = [
  {
    id: 'orientation',
    name: 'Orientation',
    icon: Clock,
    max: 6,
    color: 'cyan',
    description: 'Awareness of time, date, and place',
    questions: [
      { q: 'Can the patient correctly state today\'s date?', points: 1 },
      { q: 'Can the patient correctly state the current month?', points: 1 },
      { q: 'Can the patient correctly state the current year?', points: 1 },
      { q: 'Can the patient correctly state the day of the week?', points: 1 },
      { q: 'Can the patient correctly identify the current location?', points: 1 },
      { q: 'Can the patient correctly identify the city they are in?', points: 1 },
    ],
  },
  {
    id: 'memory',
    name: 'Delayed Recall',
    icon: BookOpen,
    max: 5,
    color: 'violet',
    description: 'Ability to recall previously presented words after a delay',
    questions: [
      { q: 'Can the patient recall word 1 (e.g., "FACE")?', points: 1 },
      { q: 'Can the patient recall word 2 (e.g., "VELVET")?', points: 1 },
      { q: 'Can the patient recall word 3 (e.g., "CHURCH")?', points: 1 },
      { q: 'Can the patient recall word 4 (e.g., "DAISY")?', points: 1 },
      { q: 'Can the patient recall word 5 (e.g., "RED")?', points: 1 },
    ],
  },
  {
    id: 'attention',
    name: 'Attention & Calculation',
    icon: Zap,
    max: 6,
    color: 'amber',
    description: 'Sustained attention, concentration, and working memory',
    questions: [
      { q: 'Can the patient repeat a sequence of 5 digits forward?', points: 1 },
      { q: 'Can the patient repeat a sequence of 3 digits backward?', points: 1 },
      { q: 'Serial 7 subtraction: first correct answer (100-7=93)?', points: 1 },
      { q: 'Serial 7 subtraction: second correct (93-7=86)?', points: 1 },
      { q: 'Serial 7 subtraction: third correct (86-7=79)?', points: 1 },
      { q: 'Can the patient tap on the letter "A" in a sequence of letters?', points: 1 },
    ],
  },
  {
    id: 'language',
    name: 'Language',
    icon: FileText,
    max: 3,
    color: 'emerald',
    description: 'Sentence repetition and verbal fluency',
    questions: [
      { q: 'Can the patient repeat: "I only know that John is the one to help today"?', points: 1 },
      { q: 'Can the patient repeat: "The cat always hid under the couch when dogs were in the room"?', points: 1 },
      { q: 'Can the patient name ≥11 words beginning with "F" in 60 seconds?', points: 1 },
    ],
  },
  {
    id: 'executive',
    name: 'Executive Function',
    icon: Activity,
    max: 5,
    color: 'rose',
    description: 'Trail making, abstraction, and planning ability',
    questions: [
      { q: 'Trail Making B (connect 1-A-2-B-3-C-4-D-5-E) completed correctly?', points: 1 },
      { q: 'Can the patient copy a cube drawing accurately?', points: 1 },
      { q: 'Clock Drawing: correct contour and numbers?', points: 1 },
      { q: 'Clock Drawing: correct hands showing 11:10?', points: 1 },
      { q: 'Abstraction: identifies similarity between train-bicycle and watch-ruler?', points: 1 },
    ],
  },
  {
    id: 'visuospatial',
    name: 'Visuospatial',
    icon: Eye,
    max: 5,
    color: 'sky',
    description: 'Visual perception, construction, and spatial reasoning',
    questions: [
      { q: 'Can the patient accurately draw a clock face (circle)?', points: 1 },
      { q: 'Are all clock numbers placed correctly?', points: 1 },
      { q: 'Can the patient copy intersecting pentagons?', points: 1 },
      { q: 'Can the patient identify a partially hidden object?', points: 1 },
      { q: 'Can the patient draw a 3D cube from memory?', points: 1 },
    ],
  },
];

const DOMAIN_COLORS = {
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', ring: 'ring-cyan-500/30', fill: 'bg-cyan-500' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', ring: 'ring-violet-500/30', fill: 'bg-violet-500' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', ring: 'ring-amber-500/30', fill: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', ring: 'ring-emerald-500/30', fill: 'bg-emerald-500' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', ring: 'ring-rose-500/30', fill: 'bg-rose-500' },
  sky: { bg: 'bg-sky-500/10', text: 'text-sky-400', ring: 'ring-sky-500/30', fill: 'bg-sky-500' },
};


// ─── Sub-components ─────────────────────────────────────────────────────────

function StepIndicator({ steps, current }) {
  const currentIdx = steps.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500
            ${i < currentIdx ? 'bg-emerald-500 text-white scale-90' :
              i === currentIdx ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30 scale-110' :
              'bg-slate-700/50 text-slate-500'}
          `}>
            {i < currentIdx ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-12 h-0.5 transition-all duration-500 ${i < currentIdx ? 'bg-emerald-500' : 'bg-slate-700/50'}`} />
          )}
        </div>
      ))}
    </div>
  );
}


function IntroStep({ onNext }) {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-purple-500/30">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Alzheimer's Disease <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Screener</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
          This assessment combines a <strong className="text-slate-300">cognitive evaluation</strong> (MOCA-based)
          with <strong className="text-slate-300">fMRI brain connectivity analysis</strong> to produce a
          comprehensive risk profile for Alzheimer's disease.
        </p>
      </div>

      {/* Method cards */}
      <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <div className="glass-panel rounded-2xl p-5 border border-violet-500/20 hover:border-violet-500/40 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Brain className="w-5 h-5 text-violet-400" />
          </div>
          <h3 className="font-semibold text-white mb-1">Cognitive Assessment</h3>
          <p className="text-sm text-slate-400">6 domains • 30 points • MOCA-style evaluation of memory, attention, executive function, and more.</p>
          <div className="mt-3 text-xs font-medium text-violet-400">Weight: 40%</div>
        </div>
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 hover:border-cyan-500/40 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="font-semibold text-white mb-1">fMRI Analysis</h3>
          <p className="text-sm text-slate-400">Raw DICOM/NIfTI input • ADNI v4.5 processing • Default Mode Network analysis from resting-state fMRI.</p>
          <div className="mt-3 text-xs font-medium text-cyan-400">Weight: 60%</div>
        </div>
      </div>

      <div className="text-center">
        <Button variant="primary" size="lg" onClick={onNext} className="px-10">
          Begin Assessment <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}


function CognitiveStep({ scores, answers, onAnswerChange, onNext, onBack }) {
  const [expandedDomain, setExpandedDomain] = useState(COGNITIVE_DOMAINS[0].id);
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

  const totalQuestions = 30;
  const answeredCount = Object.values(answers).filter((v) => v === true || v === false).length;
  const allAnswered = answeredCount === totalQuestions;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
          <Brain className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Cognitive Assessment</h2>
          <p className="text-sm text-slate-400">Rate each item based on the patient's performance</p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-bold text-white">{totalScore}<span className="text-slate-500 text-lg">/30</span></div>
          <div className="text-xs text-slate-500">Total Score</div>
        </div>
      </div>

      {/* Domain accordion */}
      <div className="space-y-3">
        {COGNITIVE_DOMAINS.map((domain) => {
          const DomainIcon = domain.icon;
          const colors = DOMAIN_COLORS[domain.color];
          const isExpanded = expandedDomain === domain.id;
          const domainScore = scores[domain.id] || 0;

          return (
            <div key={domain.id} className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ' + colors.ring : ''}`}>
              {/* Domain header */}
              <button
                onClick={() => setExpandedDomain(isExpanded ? null : domain.id)}
                className="w-full flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors"
              >
                <div className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <DomainIcon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-white text-sm">{domain.name}</div>
                  <div className="text-xs text-slate-500">{domain.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-mono text-slate-300">{domainScore}/{domain.max}</div>
                  {/* Mini progress bar */}
                  <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors.fill} rounded-full transition-all duration-500`}
                      style={{ width: `${(domainScore / domain.max) * 100}%` }}
                    />
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {/* Questions */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2 border-t border-slate-700/50 pt-3">
                  {domain.questions.map((question, qi) => {
                    const questionKey = `${domain.id}_q${qi}`;
                    return (
                      <QuestionRow
                        key={qi}
                        question={question}
                        colors={colors}
                        answered={answers[questionKey]}
                        onAnswer={(answeredVal) => onAnswerChange(questionKey, answeredVal)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress & Warning */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-2 border-t border-slate-800/40">
        <span className="text-sm font-medium text-slate-400">
          Progress: <strong className="text-white">{answeredCount}</strong> / {totalQuestions} questions answered
        </span>
        {!allAnswered && (
          <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            ⚠️ Please answer all questions to proceed
          </span>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button variant="primary" onClick={onNext} disabled={!allAnswered}>
          Continue to fMRI Upload <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}


function QuestionRow({ question, colors, answered, onAnswer }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/60 transition-colors">
      <p className="flex-1 text-sm text-slate-300">{question.q}</p>
      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={() => onAnswer(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            answered === true
              ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
              : 'bg-slate-700/50 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400'
          }`}
        >
          ✓ Yes
        </button>
        <button
          onClick={() => onAnswer(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            answered === false
              ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40'
              : 'bg-slate-700/50 text-slate-400 hover:bg-red-500/10 hover:text-red-400'
          }`}
        >
          ✗ No
        </button>
      </div>
    </div>
  );
}


function FmriStep({ fmriFile, onFileChange, onNext, onBack, loading }) {
  const dropRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) onFileChange(file);
  }, [onFileChange]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">fMRI Data Upload</h2>
          <p className="text-sm text-slate-400">Upload a resting-state fMRI DICOM series zip or NIfTI file (optional)</p>
        </div>
      </div>

      {/* Upload zone */}
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 cursor-pointer
          ${dragOver
            ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
            : fmriFile
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-slate-600 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
          }
        `}
        onClick={() => document.getElementById('fmri-file-input').click()}
      >
        <input
          id="fmri-file-input"
          type="file"
          accept=".zip,.dcm,.nii,.nii.gz"
          className="hidden"
          onChange={(e) => onFileChange(e.target.files?.[0])}
        />
        {fmriFile ? (
          <div className="space-y-2">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400" />
            <p className="text-emerald-400 font-semibold">{fmriFile.name}</p>
            <p className="text-xs text-slate-500">{(fmriFile.size / 1024).toFixed(1)} KB • Click to replace</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-12 h-12 mx-auto text-slate-500" />
            <div>
              <p className="text-slate-300 font-medium">Drop the patient's scan file here</p>
              <p className="text-xs text-slate-500 mt-1">Use a .zip containing the full DICOM series, or upload .nii / .nii.gz</p>
            </div>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="glass-panel rounded-xl p-4 border border-slate-700/50">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-400">
            <p className="font-medium text-slate-300 mb-1">About Scan Uploads</p>
            <p>
              The backend converts DICOM to NIfTI, extracts Default Mode Network signals from
              <strong className="text-white"> 11 ROIs</strong>, and predicts AD/CN from 110 connectivity features.
              If you don't have fMRI data, skip this step — the assessment will use only the cognitive scores.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => onNext(false)}>
            Skip fMRI
          </Button>
          <Button variant="primary" onClick={() => onNext(true)} disabled={!fmriFile} loading={loading}>
            {loading ? 'Analyzing...' : 'Analyze & Get Results'} <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}


function ProcessingOverlay() {
  const [step, setStep] = useState(0);
  const steps = [
    { label: 'Validating scan upload', icon: FileText },
    { label: 'Converting DICOM to NIfTI when needed', icon: Activity },
    { label: 'Extracting Default Mode Network signals', icon: Zap },
    { label: 'Running SVM classifier', icon: Brain },
    { label: 'Computing AD/CN probability', icon: BarChart3 },
    { label: 'Fusing with cognitive assessment', icon: Shield },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center">
      <div className="max-w-md w-full mx-4 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">Analyzing Brain Connectivity</h3>
          <p className="text-sm text-slate-400 mt-1">Processing the uploaded scan through the ADNI pipeline...</p>
        </div>

        <div className="space-y-2">
          {steps.map((s, i) => {
            const StepIcon = s.icon;
            const isDone = i < step;
            const isCurrent = i === step;
            return (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                isCurrent ? 'bg-cyan-500/10 ring-1 ring-cyan-500/30' :
                isDone ? 'opacity-60' : 'opacity-30'
              }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isDone ? 'bg-emerald-500/20' : isCurrent ? 'bg-cyan-500/20 animate-pulse' : 'bg-slate-700/50'
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                   <StepIcon className={`w-4 h-4 ${isCurrent ? 'text-cyan-400' : 'text-slate-500'}`} />}
                </div>
                <span className={`text-sm ${isCurrent ? 'text-white font-medium' : isDone ? 'text-slate-400' : 'text-slate-600'}`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-700"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}


function ResultsStep({ result, onReset }) {
  if (!result) return null;

  const riskPct = Math.round(result.combined_risk * 100);
  const cogPct = Math.round(result.cognitive.probability_ad * 100);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-3">
        <div
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-black"
          style={{
            background: `conic-gradient(${result.risk_color} ${riskPct}%, transparent ${riskPct}%)`,
            boxShadow: `0 0 40px ${result.risk_color}30`,
          }}
        >
          <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center">
            <span style={{ color: result.risk_color }}>{riskPct}%</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white">
          {result.risk_level} Risk
        </h2>
        <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
          {result.recommendation}
        </p>
      </div>

      {/* Score cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Cognitive score card */}
        <Card className="border border-violet-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="font-semibold text-white">Cognitive Score</div>
              <div className="text-xs text-slate-500">Weight: {Math.round(result.weights.cognitive * 100)}%</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xl font-bold text-white">{result.cognitive.total_score}<span className="text-slate-500">/{result.cognitive.max_score}</span></div>
              <div className="text-xs text-slate-500">Risk: {cogPct}%</div>
            </div>
          </div>
          {/* Domain bars */}
          <div className="space-y-2">
            {Object.entries(result.cognitive.domains).map(([domain, info]) => {
              const domainDef = COGNITIVE_DOMAINS.find(d => d.id === domain);
              const colors = DOMAIN_COLORS[domainDef?.color || 'cyan'];
              return (
                <div key={domain} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-24 capitalize truncate">{domain}</span>
                  <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                    <div className={`h-full ${colors?.fill || 'bg-cyan-500'} rounded-full transition-all duration-700`} style={{ width: `${info.pct}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 w-10 text-right">{info.score}/{info.max}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* fMRI score card */}
        <Card className="border border-cyan-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="font-semibold text-white">fMRI Analysis</div>
              <div className="text-xs text-slate-500">Weight: {Math.round(result.weights.fmri * 100)}%</div>
            </div>
          </div>
          {result.fmri ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-xl">
                <span className="text-sm text-slate-400">Prediction</span>
                <span className={`text-sm font-bold ${result.fmri.prediction === 'AD' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {result.fmri.prediction === 'AD' ? 'Alzheimer\'s Detected' : 'Cognitively Normal'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-xl">
                <span className="text-sm text-slate-400">AD Probability</span>
                <span className="text-sm font-bold text-white">{Math.round(result.fmri.probability_ad * 100)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-xl">
                <span className="text-sm text-slate-400">Decision Score</span>
                <span className="text-sm font-mono text-slate-300">{result.fmri.decision_score}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-xl">
                <span className="text-sm text-slate-400">Features Used</span>
                <span className="text-sm text-slate-300">{result.fmri.n_features_used}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-slate-500">
              <XCircle className="w-8 h-8" />
              <p className="text-sm">No fMRI data provided</p>
              <p className="text-xs">Assessment based on cognitive scores only</p>
            </div>
          )}
        </Card>
      </div>

      {/* Weights diagram */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="font-semibold text-white mb-3 text-sm">Combined Score Breakdown</h3>
        <div className="flex gap-2 h-4 rounded-full overflow-hidden">
          {result.weights.fmri > 0 && (
            <div
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full transition-all duration-700"
              style={{ width: `${result.weights.fmri * 100}%` }}
              title={`fMRI: ${result.weights.fmri * 100}%`}
            />
          )}
          <div
            className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-700"
            style={{ width: `${result.weights.cognitive * 100}%` }}
            title={`Cognitive: ${result.weights.cognitive * 100}%`}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          {result.weights.fmri > 0 && <span className="text-cyan-400">fMRI {result.weights.fmri * 100}%</span>}
          <span className="text-violet-400 ml-auto">Cognitive {result.weights.cognitive * 100}%</span>
        </div>
      </div>

      <Disclaimer />

      <div className="text-center">
        <Button variant="secondary" onClick={onReset}>
          Start New Assessment
        </Button>
      </div>
    </div>
  );
}


// ─── Main Component ─────────────────────────────────────────────────────────

export default function AlzheimersScreener() {
  const [step, setStep] = useState('intro');
  const [answers, setAnswers] = useState({});
  const [fmriFile, setFmriFile] = useState(null);
  const [showProcessing, setShowProcessing] = useState(false);
  const { data: result, loading, error, execute, reset } = useApi(predictAlzheimers);

  const getDomainScore = (domainId) => {
    const domain = COGNITIVE_DOMAINS.find(d => d.id === domainId);
    return domain.questions.reduce((sum, q, idx) => {
      return sum + (answers[`${domainId}_q${idx}`] === true ? q.points : 0);
    }, 0);
  };

  const cognitiveScores = {
    orientation: getDomainScore('orientation'),
    memory: getDomainScore('memory'),
    attention: getDomainScore('attention'),
    language: getDomainScore('language'),
    executive: getDomainScore('executive'),
    visuospatial: getDomainScore('visuospatial'),
  };

  const handleAnswerChange = (questionKey, answeredValue) => {
    setAnswers((prev) => {
      const nextAnswers = { ...prev };
      if (prev[questionKey] === answeredValue) {
        delete nextAnswers[questionKey];
      } else {
        nextAnswers[questionKey] = answeredValue;
      }
      return nextAnswers;
    });
  };

  const handleSubmit = async (includeFmri) => {
    const formData = new FormData();
    formData.append('cognitive_scores', JSON.stringify(cognitiveScores));

    if (includeFmri && fmriFile) {
      setShowProcessing(true);
      formData.append('scan_file', fmriFile);
    }

    try {
      await execute(formData);
      setStep('results');
    } finally {
      setShowProcessing(false);
    }
  };

  const handleReset = () => {
    setStep('intro');
    setAnswers({});
    setFmriFile(null);
    reset();
  };

  // Unwrap APIResponse envelope
  const resultData = result?.data || result;

  return (
    <div className="max-w-4xl mx-auto pb-10 pt-2">
      {showProcessing && <ProcessingOverlay />}

      <StepIndicator steps={STEPS} current={step} />

      {step === 'intro' && (
        <IntroStep onNext={() => setStep('cognitive')} />
      )}

      {step === 'cognitive' && (
        <CognitiveStep
          scores={cognitiveScores}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          onNext={() => setStep('fmri')}
          onBack={() => setStep('intro')}
        />
      )}

      {step === 'fmri' && (
        <FmriStep
          fmriFile={fmriFile}
          onFileChange={setFmriFile}
          onNext={handleSubmit}
          onBack={() => setStep('cognitive')}
          loading={loading}
        />
      )}

      {step === 'results' && (
        <ResultsStep result={resultData} onReset={handleReset} />
      )}

      {error && <Alert variant="error" className="mt-4">{error}</Alert>}
    </div>
  );
}


// ─── Helpers ────────────────────────────────────────────────────────────────

