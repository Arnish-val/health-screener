import { Activity, ExternalLink, Heart, Mail, GitBranch, Stethoscope, Brain, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Disclaimer from '../shared/Disclaimer';

/**
 * Site footer — 4-column layout matching the premium landing page aesthetic.
 */
export default function Footer() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const links = {
    Tools: [
      { label: 'Disease AI',     path: '/disease'    },
      { label: 'Mental Health',  path: '/depression' },
      { label: 'Sign In',        path: '/auth'       },
      { label: 'History',        path: '/history'    },
    ],
    Technology: [
      { label: 'Random Forest',  href: null },
      { label: 'XGBoost',        href: null },
      { label: 'Kaggle Datasets',href: null },
      { label: 'React + Vite',   href: null },
    ],
  };

  return (
    <footer className="bg-slate-900 text-slate-300">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="md:col-span-2 space-y-5">
            <div
              className="flex items-center gap-2 cursor-pointer group w-fit"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#106EBE] to-[#0FFCBE] flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Health<span className="text-[#0FFCBE]">Lens</span>
              </span>
            </div>

            <p className="text-slate-400 leading-relaxed max-w-sm text-sm">
              Production-grade ML models for disease prediction and mental health screening. Built on Kaggle-validated datasets for accuracy you can trust.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://github.com/Arnish-val/health-screener"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-slate-800 hover:bg-[#106EBE] rounded-lg flex items-center justify-center cursor-pointer transition-colors group"
                aria-label="GitHub Repository"
              >
                <GitBranch className="w-4 h-4 text-slate-300 group-hover:text-white" />
              </a>
              <a
                href="mailto:support@healthlens.com"
                className="w-8 h-8 bg-slate-800 hover:bg-[#106EBE] rounded-lg flex items-center justify-center cursor-pointer transition-colors group"
                aria-label="Email Support"
              >
                <Mail className="w-4 h-4 text-slate-300 group-hover:text-white" />
              </a>
              <a
                href="https://github.com/Arnish-val/health-screener#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-slate-800 hover:bg-[#106EBE] rounded-lg flex items-center justify-center cursor-pointer transition-colors group"
                aria-label="Documentation"
              >
                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Tools */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase">Tools</h4>
            <ul className="space-y-2.5">
              {links.Tools.map(({ label, path }) => (
                <li key={label}>
                  <button
                    onClick={() => navigate(path)}
                    className="text-slate-400 hover:text-[#0FFCBE] text-sm transition-colors text-left"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Technology */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-sm tracking-wider uppercase">Technology</h4>
            <ul className="space-y-2.5">
              {links.Technology.map(({ label }) => (
                <li key={label}>
                  <span className="text-slate-400 text-sm">{label}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2 space-y-1.5">
              {[
                { icon: Stethoscope, text: '42 conditions detected'  },
                { icon: Brain,       text: 'Depression risk scoring'  },
                { icon: ShieldCheck, text: 'Kaggle cross-validated'   },
              ].map(({ icon: Icon, text }) => {
                void Icon;
                return (
                <div key={text} className="flex items-center gap-2 text-xs text-slate-500">
                  <Icon className="w-3.5 h-3.5 text-[#106EBE] flex-shrink-0" />
                  {text}
                </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 space-y-3">
          <Disclaimer compact />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              © {year} HealthLens · Built with{' '}
              <Heart className="w-3 h-3 inline text-red-400" /> for healthcare ML research.
            </p>
            <p className="text-xs text-slate-600">
              Not a medical device · Educational use only
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
