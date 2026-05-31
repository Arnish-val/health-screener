import { Stethoscope, Brain, ArrowRight, ShieldCheck, Zap, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LandingScreen() {
  const navigate = useNavigate();

  return (
    <div className="space-y-16 py-8">
      
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6 }}
        className="text-center space-y-6 max-w-3xl mx-auto px-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100/50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-sm font-semibold mb-2">
          <Zap className="w-4 h-4" /> v2.0 Kaggle Architecture
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-slate-800 dark:text-white leading-tight tracking-tight">
          Next-Generation <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#106EBE] to-[#0FFCBE] dark:from-[#4A9BE4] dark:to-[#0FFCBE]">
            Predictive Healthcare
          </span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Leverage production-grade machine learning to evaluate personal disease vectors and mental health profiles instantly. Built natively on advanced Kaggle datasets perfectly tuned for precise probabilities.
        </p>
      </motion.section>

      {/* Primary Tool Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto px-4">
        
        {/* Tool 1: Disease Predictor */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          whileInView={{ opacity: 1, x: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-panel rounded-[2rem] p-8 group relative overflow-hidden flex flex-col h-full"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#106EBE]/10 dark:bg-[#106EBE]/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
          
          <div className="w-16 h-16 rounded-2xl bg-[#106EBE]/10 dark:bg-[#106EBE]/20 flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/50 dark:ring-white/10">
            <Stethoscope className="w-8 h-8 text-[#106EBE] dark:text-[#4A9BE4]" />
          </div>
          
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
            Disease Vector AI
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-8 flex-1 leading-relaxed">
            Search through a massive array of 132 structured symptoms. Our Random Forest pipeline computes complex intersections to forecast the Top 3 most probable conditions out of 42 possible diseases.
          </p>
          
          <button 
            onClick={() => navigate('/disease')}
            className="neu-button relative overflow-hidden flex items-center justify-between w-full px-6 py-4 text-[#106EBE] dark:text-white font-semibold dark:bg-gradient-to-br dark:from-[#0A4F8A] dark:to-[#02182B] dark:border-[#106EBE]/50 dark:shadow-[#106EBE]/20"
          >
            <span className="relative z-10">Launch Evaluator</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Tool 2: Mental Health Screener */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }} 
          whileInView={{ opacity: 1, x: 0 }} 
          viewport={{ once: true }} 
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-panel rounded-[2rem] p-8 group relative overflow-hidden flex flex-col h-full"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#0FFCBE]/10 dark:bg-[#0FFCBE]/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
          
          <div className="w-16 h-16 rounded-2xl bg-[#0FFCBE]/10 dark:bg-[#0FFCBE]/20 flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/50 dark:ring-white/10">
            <Brain className="w-8 h-8 text-[#0BBF90] dark:text-[#0FFCBE]" />
          </div>
          
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">
            Student Mental Health
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-8 flex-1 leading-relaxed">
            Determine emotional and academic risk thresholds. Input lifestyle patterns including study satisfaction, CGPA, and sleep cycles to generate a finely calibrated gradient-boosted probability risk profile.
          </p>
          
          <button 
            onClick={() => navigate('/depression')}
            className="neu-button relative overflow-hidden flex items-center justify-between w-full px-6 py-4 text-[#0BBF90] dark:text-white font-semibold dark:bg-gradient-to-br dark:from-[#0BBF90] dark:to-[#044D39] dark:border-[#0BBF90]/50 dark:shadow-[#0FFCBE]/20"
          >
            <span className="relative z-10">Run Assessment</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

      </section>

      {/* Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4 pt-10">
         <div className="glass-card p-6 flex flex-col items-center text-center rounded-2xl">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
               <ShieldCheck className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-2">Optional History Tracking</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Save your assessments securely with a personalized account, or continue anonymously.</p>
         </div>
         <div className="glass-card p-6 flex flex-col items-center text-center rounded-2xl">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
               <Zap className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-2">High Efficiency Models</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Powered directly by Random Forest and XGBoost logic, mapping 130+ dimensional rulesets instantly.</p>
         </div>
         <div className="glass-card p-6 flex flex-col items-center text-center rounded-2xl">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
               <Lock className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-2">Kaggle Verified</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Rigorously cross-validated against 32,000+ actual patient and student samples for accurate calibration.</p>
         </div>
      </section>

    </div>
  );
}
