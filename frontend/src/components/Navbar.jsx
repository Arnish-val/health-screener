import { Activity, Brain } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav className="fixed top-4 left-4 right-4 z-50 neu-raised px-6 py-3 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-lg font-bold text-text-primary leading-tight">
            HealthLens
          </h1>
          <p className="text-[10px] text-text-muted font-medium tracking-wide uppercase">
            Wellness Screener
          </p>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="neu-pressed p-1 flex gap-1">
        <button
          id="tab-disease"
          onClick={() => setActiveTab('disease')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
            activeTab === 'disease'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-primary'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">Physical Health</span>
        </button>
        <button
          id="tab-depression"
          onClick={() => setActiveTab('depression')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
            activeTab === 'depression'
              ? 'bg-primary text-white shadow-md'
              : 'text-text-secondary hover:text-primary'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span className="hidden sm:inline">Mental Wellness</span>
        </button>
      </div>
    </nav>
  );
}
