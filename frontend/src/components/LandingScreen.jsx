import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope, Brain, ArrowRight, ChevronDown, Star,
  Activity, Shield, Zap, Heart, BarChart3,
  CheckCircle2, Lock, Users, Award,
} from 'lucide-react';
import heroImage from '../assets/hero.png';
import BorderGlow from './BorderGlow';

void motion;

/* ─── Animation Variants ─────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const fadeLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const fadeRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

/* ─── Count-Up Hook ──────────────────────────────────────────────── */
function useCountUp(target, inView, duration = 1600) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let current = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return count;
}

/* ─── Animated Section Wrapper ───────────────────────────────────── */
function AnimSection({ children, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });
  return (
    <motion.section
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ─── Stat Counter ───────────────────────────────────────────────── */
function StatCounter({ value, suffix, label }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const count = useCountUp(value, inView);
  return (
    <div ref={ref} className="text-center px-4">
      <div className="text-4xl md:text-5xl font-bold text-white tabular-nums">
        {count}{suffix}
      </div>
      <div className="text-blue-200 text-sm mt-2 font-medium">{label}</div>
    </div>
  );
}

/* ─── FAQ Accordion Item ─────────────────────────────────────────── */
function FaqItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      transition={{ delay: index * 0.07 }}
      className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow"
    >
      <button
        id={`faq-btn-${index}`}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
        aria-expanded={open}
      >
        <span className="font-semibold text-slate-800 dark:text-slate-100 pr-4">{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.28 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-[#106EBE]" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-6 py-4 text-slate-600 dark:text-slate-300 bg-[#F8FAFC] dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800/60 leading-relaxed text-[0.95rem]">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function LandingScreen() {
  const navigate = useNavigate();

  const stats = [
    { value: 41, suffix: '+', label: 'Diseases Detected' },
    { value: 132, suffix: '', label: 'Symptoms Analyzed' },
    { value: 32, suffix: 'K+', label: 'Validated Samples' },
    { value: 97, suffix: '%', label: 'Model Accuracy' },
  ];

  const services = [
    {
      icon: Stethoscope,
      color: '#106EBE',
      bgColor: '#EFF6FF',
      badgeColor: '#DBEAFE',
      badge: 'Random Forest',
      title: 'Disease Vector AI',
      desc: 'Search through 132 structured symptoms. Our Random Forest pipeline computes complex intersections to forecast the Top 3 most probable conditions out of 42 possible diseases — with confidence scores.',
      features: ['42 conditions detected', '132 symptom inputs', '97%+ accuracy'],
      cta: 'Launch Evaluator',
      path: '/disease',
    },
    {
      icon: Brain,
      color: '#0BBF90',
      bgColor: '#ECFDF5',
      badgeColor: '#D1FAE5',
      badge: 'XGBoost',
      title: 'Mental Health Screener',
      desc: 'Determine emotional and academic risk thresholds. Input lifestyle patterns including study satisfaction, CGPA, and sleep cycles to generate a gradient-boosted probability risk profile.',
      features: ['Depression risk scoring', 'Lifestyle analysis', 'Anonymous screening'],
      cta: 'Run Assessment',
      path: '/depression',
    },
  ];

  const steps = [
    {
      num: '01',
      icon: Activity,
      title: 'Enter Your Data',
      desc: 'Select symptoms from 132 options, or answer a short lifestyle questionnaire.',
    },
    {
      num: '02',
      icon: BarChart3,
      title: 'AI Analysis',
      desc: 'Our ML models process your 130+ dimensional inputs in under a second.',
    },
    {
      num: '03',
      icon: CheckCircle2,
      title: 'Receive Results',
      desc: 'Get ranked predictions with confidence percentages and next-step guidance.',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah K.',
      role: 'Medical Student',
      avatar: 'S',
      avatarGrad: 'from-[#106EBE] to-[#4A9BE4]',
      text: 'Incredibly accurate. The disease AI flagged a condition I later confirmed with a doctor. The UI is clean, fast, and professional.',
      stars: 5,
    },
    {
      name: 'James T.',
      role: 'University Counselor',
      avatar: 'J',
      avatarGrad: 'from-[#0BBF90] to-[#0FFCBE]',
      text: 'We use the mental health screener to proactively help students. The risk scoring is thoughtful and well-calibrated — not alarmist.',
      stars: 5,
    },
    {
      name: 'Priya M.',
      role: 'Healthcare Researcher',
      avatar: 'P',
      avatarGrad: 'from-[#4A9BE4] to-[#0FFCBE]',
      text: 'Impressed by the Kaggle-validated datasets. The model accuracy holds up in real-world test scenarios. Transparent methodology.',
      stars: 4,
    },
  ];

  const faqs = [
    {
      q: 'Is this a substitute for medical diagnosis?',
      a: 'No. HealthLens is a screening and educational tool powered by machine learning. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional.',
    },
    {
      q: 'How accurate is the disease prediction model?',
      a: 'Our Random Forest model achieves 97%+ accuracy on cross-validated Kaggle datasets comprising 32,000+ patient records. That said, individual results can vary — treat outputs as probabilistic indicators, not certainties.',
    },
    {
      q: 'Is my health data private and secure?',
      a: 'Yes. You can run all assessments anonymously — no account required. If you choose to save history, your data is encrypted in transit and at rest, and is never shared with or sold to third parties.',
    },
    {
      q: 'How many conditions can the system detect?',
      a: 'The Disease AI covers 42 distinct conditions using 132 structured symptom inputs. The Mental Health Screener evaluates depression risk using a validated set of academic and lifestyle indicators.',
    },
    {
      q: 'How do I get started?',
      a: 'Click "Launch Evaluator" for disease prediction or "Run Assessment" for the mental health screener. No account needed — results are instant and completely free.',
    },
  ];

  const trustBadges = [
    { icon: Shield, label: 'HIPAA Aware Design' },
    { icon: Lock, label: 'Data Encrypted' },
    { icon: Award, label: 'Kaggle Verified' },
    { icon: Users, label: '2,400+ Users' },
  ];

  return (
    /* Support both light and dark mode styles on the landing page */
    <div className="bg-[#F5F5F5] dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden transition-colors duration-300">

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section id="hero" className="relative pt-6 pb-12 md:pt-8 md:pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: 'easeOut' }}
            className="relative min-h-[620px] rounded-[2rem] md:rounded-[2.5rem] bg-[#16204F] overflow-hidden shadow-2xl shadow-[#106EBE]/20"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(74,155,228,0.26),transparent_42%),linear-gradient(135deg,rgba(15,252,190,0.11),transparent_45%)]" />
            <div className="absolute inset-x-0 top-[18%] flex justify-center pointer-events-none select-none">
              <span className="text-[4.7rem] sm:text-[7rem] md:text-[10rem] xl:text-[12.5rem] font-extrabold leading-none text-white/[0.08]">
                HealthLens
              </span>
            </div>

            <div className="relative z-10 grid min-h-[620px] grid-cols-1 lg:grid-cols-[1fr_1.15fr_1fr] gap-8 items-center px-5 py-10 sm:px-8 md:px-12 lg:px-14">
              <motion.div
                initial={{ opacity: 0, x: -38 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
                className="text-white space-y-7"
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm font-semibold text-cyan-100">
                  <Zap className="w-4 h-4 text-[#F8E37E]" />
                  AI-Powered Health Screening
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.03] text-white">
                    Your health, intelligently screened.
                  </h1>
                  <p className="max-w-md text-sm sm:text-base leading-7 text-blue-100">
                    Disease prediction and mental health screening powered by validated ML models, built for instant private checks.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 max-w-md">
                  <button
                    onClick={() => navigate('/disease')}
                    className="group flex items-center justify-between rounded-[1.4rem] bg-[#F8E37E] px-5 py-4 text-left text-slate-950 shadow-lg shadow-black/10 transition-all hover:-translate-y-1"
                  >
                    <span>
                      <span className="block text-sm font-bold">Disease Vector AI</span>
                      <span className="block text-xs text-slate-700">42 conditions detected</span>
                    </span>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-white transition-transform group-hover:translate-x-1">
                      <Stethoscope className="w-5 h-5" />
                    </span>
                  </button>

                  <button
                    onClick={() => navigate('/depression')}
                    className="group flex items-center justify-between rounded-[1.4rem] bg-[#9AE5C9] px-5 py-4 text-left text-slate-950 shadow-lg shadow-black/10 transition-all hover:-translate-y-1"
                  >
                    <span>
                      <span className="block text-sm font-bold">Mental Health Screener</span>
                      <span className="block text-xs text-slate-700">Lifestyle risk profile</span>
                    </span>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-white transition-transform group-hover:translate-x-1">
                      <Brain className="w-5 h-5" />
                    </span>
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.85, delay: 0.28, ease: 'easeOut' }}
                className="relative min-h-[380px] lg:min-h-[540px] flex items-center justify-center"
              >
                <motion.img
                  src={heroImage}
                  alt=""
                  aria-hidden="true"
                  animate={{ y: [0, -14, 0] }}
                  transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute top-8 w-[300px] sm:w-[360px] opacity-35"
                />

                <motion.div
                  animate={{ y: [0, -16, 0] }}
                  transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative w-full max-w-[380px] rounded-[1.8rem] border border-white/20 bg-white/95 dark:bg-slate-900/95 p-5 shadow-2xl shadow-black/25"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">AI Health Report</p>
                      <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Live Screening</p>
                    </div>
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#106EBE] text-white">
                      <Activity className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#EFF6FF] dark:bg-slate-800/60 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-[#106EBE]">Top Prediction</span>
                      <span className="rounded-full bg-[#106EBE] px-3 py-1 text-xs font-bold text-white">94.2%</span>
                    </div>
                    <p className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Common Cold</p>
                    <div className="h-2 overflow-hidden rounded-full bg-[#106EBE]/15">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '94%' }}
                        transition={{ delay: 0.9, duration: 1.25, ease: 'easeOut' }}
                        className="h-full rounded-full bg-[#106EBE]"
                      />
                    </div>
                  </div>

                  {[
                    { name: 'Symptoms checked', value: '132', color: '#0BBF90' },
                    { name: 'Analysis time', value: '0.8s', color: '#4A9BE4' },
                  ].map(({ name, value, color }) => (
                    <div key={name} className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-800/40 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{name}</span>
                      </div>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">{value}</span>
                    </div>
                  ))}
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.55 }}
                  className="absolute left-0 top-10 hidden rounded-2xl border border-white/20 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-xl lg:block"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#ECFDF5] dark:bg-[#062c1a]">
                      <Heart className="w-5 h-5 text-[#0BBF90]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Mental Risk</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Low</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -9, 0] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1.05 }}
                  className="absolute bottom-8 right-0 hidden rounded-2xl border border-white/20 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-xl lg:block"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#EFF6FF] dark:bg-[#072440]">
                      <Shield className="w-5 h-5 text-[#106EBE]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Data Privacy</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">Secured</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 38 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
                className="space-y-7 text-white lg:text-right"
              >
                <div className="flex items-center gap-2 lg:justify-end">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10">
                    <Lock className="w-5 h-5 text-[#9AE5C9]" />
                  </span>
                  <span className="text-lg font-semibold">Private by design</span>
                </div>

                <p className="max-w-sm text-sm uppercase leading-7 text-blue-100 lg:ml-auto">
                  No account required. Run instant checks, review confidence scores, and choose the next step from your own results.
                </p>

                <div className="flex flex-col gap-4 sm:flex-row lg:flex-col lg:items-end">
                  <motion.button
                    id="hero-cta-disease"
                    whileHover={{ scale: 1.04, boxShadow: '0 22px 44px rgba(248,227,126,0.28)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/disease')}
                    className="flex items-center justify-center gap-3 rounded-full bg-[#F2CBD4] px-7 py-4 text-base font-bold text-slate-950 shadow-lg transition-all"
                  >
                    Start Screening
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    id="hero-cta-mental"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/depression')}
                    className="flex items-center justify-center gap-3 rounded-full border border-white/25 bg-white/10 px-7 py-4 text-base font-bold text-white transition-all hover:bg-white/15"
                  >
                    Mental Health Check
                    <Brain className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Disease AI',
                desc: 'Top 3 condition ranking',
                icon: Stethoscope,
                bg: '#F8E37E',
                path: '/disease',
                glowColor: '45 85 50',
                colors: ['#eab308', '#facc15', '#fef08a']
              },
              {
                title: 'Mental Health',
                desc: 'Anonymous risk scoring',
                icon: Brain,
                bg: '#9AE5C9',
                path: '/depression',
                glowColor: '150 70 40',
                colors: ['#10b981', '#34d399', '#6ee7b7']
              },
              {
                title: 'Alzheimer\'s AI',
                desc: 'fMRI & cognitive screener',
                icon: Activity,
                bg: '#F2CBD4',
                path: '/alzheimers',
                glowColor: '340 70 50',
                colors: ['#ec4899', '#f472b6', '#fbcfe8']
              },
              {
                title: 'Saved History',
                desc: 'Track your screenings',
                icon: BarChart3,
                bg: '#9BBEF8',
                path: '/history',
                glowColor: '210 80 50',
                colors: ['#3b82f6', '#60a5fa', '#93c5fd']
              },
            ].map(({ title, desc, icon: Icon, bg, path, glowColor, colors }) => {
              void Icon;
              return (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="w-full flex"
                >
                  <BorderGlow
                    edgeSensitivity={30}
                    glowColor={glowColor}
                    backgroundColor={bg}
                    borderRadius={28}
                    glowRadius={30}
                    glowIntensity={0.8}
                    coneSpread={25}
                    animated={false}
                    colors={colors}
                    className="min-h-[180px] w-full transition-all duration-300 hover:-translate-y-1 cursor-pointer select-none"
                  >
                    <div 
                      onClick={() => navigate(path)}
                      className="flex h-full flex-col justify-between p-6"
                    >
                      <div>
                        <h3 className="text-xl font-bold leading-tight text-slate-950">{title}</h3>
                        <p className="mt-2 text-sm text-slate-700">{desc}</p>
                      </div>
                      <div className="mt-8 flex items-end justify-between">
                        <Icon className="h-12 w-12 text-slate-950/35" />
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-white">
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </BorderGlow>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2 — STATS BAR
          ═══════════════════════════════════════════════════════════════ */}
      <AnimSection className="bg-gradient-to-r from-[#0A4F8A] via-[#106EBE] to-[#0BBF90]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-white/20">
            {stats.map((s) => (
              <motion.div key={s.label} variants={fadeUp}>
                <StatCounter {...s} />
              </motion.div>
            ))}
          </div>
        </div>
      </AnimSection>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3 — SERVICES
          ═══════════════════════════════════════════════════════════════ */}
      <AnimSection id="services" className="bg-[#F8FAFC] dark:bg-slate-900/50 py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">

          {/* Section header */}
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="inline-block text-[#106EBE] font-bold text-xs tracking-[0.2em] uppercase mb-3">Our Tools</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Screening That{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#106EBE] to-[#0FFCBE]">
                Actually Works
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              Two specialized AI models, each validated on real-world clinical and academic datasets.
            </p>
          </motion.div>

          {/* Service cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  id={`service-card-${i}`}
                  variants={i === 0 ? fadeLeft : fadeRight}
                  className="w-full"
                >
                  <BorderGlow
                    edgeSensitivity={30}
                    glowColor={s.color === '#106EBE' ? '210 80 50' : '150 70 40'}
                    backgroundColor="var(--card-bg-theme)"
                    borderRadius={32}
                    glowRadius={40}
                    glowIntensity={0.8}
                    coneSpread={25}
                    animated={false}
                    colors={s.color === '#106EBE' ? ['#3b82f6', '#60a5fa', '#93c5fd'] : ['#10b981', '#34d399', '#6ee7b7']}
                    className="h-full w-full transition-all duration-300 hover:-translate-y-2 cursor-pointer select-none"
                  >
                    <div
                      onClick={() => navigate(s.path)}
                      className="p-8 relative overflow-hidden group h-full flex flex-col justify-between"
                    >
                      <div>
                        {/* Glow orb */}
                        <div
                          className="absolute top-0 right-0 -mr-24 -mt-24 w-72 h-72 rounded-full opacity-50 blur-3xl transition-transform duration-700 group-hover:scale-125"
                          style={{ backgroundColor: s.color + '18' }}
                        />

                        {/* Badge */}
                        <span
                          className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-5"
                          style={{ backgroundColor: s.badgeColor, color: s.color }}
                        >
                          {s.badge}
                        </span>

                        {/* Icon */}
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-sm"
                          style={{ backgroundColor: s.bgColor }}
                        >
                          <Icon className="w-7 h-7" style={{ color: s.color }} />
                        </div>

                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{s.title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6 text-[0.95rem]">{s.desc}</p>

                        {/* Feature list */}
                        <ul className="space-y-2 mb-7">
                          {s.features.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-350">
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: s.color }} />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* CTA link */}
                      <div
                        className="flex items-center gap-2 font-bold text-sm"
                        style={{ color: s.color }}
                      >
                        {s.cta}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-200" />
                      </div>
                    </div>
                  </BorderGlow>
                </motion.div>
              );
            })}
          </div>
          
          {/* Trust pills */}
          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3 mt-12">
            {['Kaggle Verified', 'No Account Needed', 'Instant Results', 'Private & Secure', 'Random Forest', 'XGBoost'].map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-sm text-slate-600 dark:text-slate-350 font-medium shadow-sm"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </AnimSection>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4 — HOW IT WORKS
          ═══════════════════════════════════════════════════════════════ */}
      <AnimSection id="how-it-works" className="bg-white dark:bg-slate-950 py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">

          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="inline-block text-[#106EBE] font-bold text-xs tracking-[0.2em] uppercase mb-3">Process</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              From first symptom to full insight in under 3 seconds.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-[54px] left-[calc(16.7%+50px)] right-[calc(16.7%+50px)] h-px bg-gradient-to-r from-[#106EBE] via-[#4A9BE4] to-[#0BBF90] opacity-40" />

            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  variants={fadeUp}
                  transition={{ delay: i * 0.16 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Circle icon */}
                  <div className="relative z-10 w-[108px] h-[108px] rounded-full bg-gradient-to-br from-[#106EBE] to-[#4A9BE4] flex flex-col items-center justify-center mb-7 shadow-2xl shadow-[#106EBE]/25">
                    <Icon className="w-7 h-7 text-white mb-1" />
                    <span className="text-white/60 text-[11px] font-bold">{step.num}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[0.95rem]">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </AnimSection>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5 — TESTIMONIALS
          ═══════════════════════════════════════════════════════════════ */}
      <AnimSection id="testimonials" className="bg-[#F8FAFC] dark:bg-slate-900/50 py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">

          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="inline-block text-[#106EBE] font-bold text-xs tracking-[0.2em] uppercase mb-3">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Trusted by Health Professionals
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
              Real feedback from medical students, researchers, and university counselors.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => {
              const glowColor = t.name === 'Sarah K.' ? '210 80 50' : t.name === 'James T.' ? '150 70 40' : '180 80 50';
              const colors = t.name === 'Sarah K.' ? ['#3b82f6', '#60a5fa', '#93c5fd'] : t.name === 'James T.' ? ['#10b981', '#34d399', '#6ee7b7'] : ['#06b6d4', '#22d3ee', '#67e8f9'];
              return (
                <motion.div
                  key={t.name}
                  variants={fadeUp}
                  transition={{ delay: i * 0.1 }}
                  className="w-full"
                >
                  <BorderGlow
                    edgeSensitivity={30}
                    glowColor={glowColor}
                    backgroundColor="var(--card-bg-theme)"
                    borderRadius={28}
                    glowRadius={40}
                    glowIntensity={0.8}
                    coneSpread={25}
                    animated={false}
                    colors={colors}
                    className="h-full w-full transition-all duration-300 hover:-translate-y-2 select-none"
                  >
                    <div className="p-7 h-full flex flex-col justify-between">
                      <div>
                        {/* Stars */}
                        <div className="flex gap-1 mb-4">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star
                              key={j}
                              className={`w-4 h-4 ${j < t.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>

                        <p className="text-slate-600 dark:text-slate-350 leading-relaxed mb-6 text-[0.95rem] italic">
                          "{t.text}"
                        </p>
                      </div>

                      {/* Author */}
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.avatarGrad} flex items-center justify-center text-white font-bold shadow-md`}>
                          {t.avatar}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white text-sm">{t.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-450">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  </BorderGlow>
                </motion.div>
              );
            })}
          </div>

          {/* Trust badge row */}
          <motion.div variants={fadeUp} className="mt-14 flex flex-wrap justify-center gap-6">
            {trustBadges.map(({ icon: Icon, label }) => {
              void Icon;
              return (
                <div key={label} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                  <Icon className="w-4 h-4 text-[#106EBE]" />
                  {label}
                </div>
              );
            })}
          </motion.div>
        </div>
      </AnimSection>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6 — FAQ
          ═══════════════════════════════════════════════════════════════ */}
      <AnimSection id="faq" className="bg-white dark:bg-slate-950 py-24">
        <div className="max-w-3xl mx-auto px-4 md:px-8">

          <motion.div variants={fadeUp} className="text-center mb-12">
            <span className="inline-block text-[#106EBE] font-bold text-xs tracking-[0.2em] uppercase mb-3">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">Common Questions</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg">Everything you need to know before getting started.</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <FaqItem key={i} q={f.q} a={f.a} index={i} />
            ))}
          </div>
        </div>
      </AnimSection>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 7 — CTA BANNER
          ═══════════════════════════════════════════════════════════════ */}
      <AnimSection id="cta" className="py-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp}
            className="relative bg-gradient-to-br from-[#0A4F8A] via-[#106EBE] to-[#0BBF90] rounded-[2.5rem] p-12 md:p-20 text-center overflow-hidden"
          >
            {/* Background orbs */}
            <div className="absolute top-[-80px] left-[-80px] w-[320px] h-[320px] bg-white/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-60px] right-[-60px] w-[260px] h-[260px] bg-white/8 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMCAwdjZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 space-y-6">
              <motion.h2
                variants={fadeUp}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
              >
                Ready to Check<br />Your Health?
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="text-blue-100 text-lg max-w-md mx-auto leading-relaxed"
              >
                Free, instant, and completely private. No account required — results in seconds.
              </motion.p>
              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row gap-4 justify-center pt-2"
              >
                <motion.button
                  id="cta-disease-btn"
                  whileHover={{ scale: 1.05, boxShadow: '0 28px 56px rgba(0,0,0,0.22)' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/disease')}
                  className="px-10 py-4 bg-white text-[#106EBE] font-bold rounded-full text-base shadow-2xl transition-all"
                >
                  Detect Disease Risk
                </motion.button>
                <motion.button
                  id="cta-mental-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/depression')}
                  className="px-10 py-4 bg-white/15 text-white font-bold rounded-full text-base border-2 border-white/30 hover:bg-white/25 transition-all"
                >
                  Mental Health Screen
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </AnimSection>

    </div>
  );
}
