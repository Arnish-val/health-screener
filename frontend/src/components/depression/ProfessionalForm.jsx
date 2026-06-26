import { useState } from 'react';
import { Building, HeartHandshake, Users, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

const TABS = [
  { id: 'role', label: 'Company & Role', icon: Building },
  { id: 'benefits', label: 'Benefits & Support', icon: HeartHandshake },
  { id: 'culture', label: 'Workplace Culture', icon: Users },
  { id: 'interviews', label: 'Stigma & Interviews', icon: FileText },
];

export default function ProfessionalForm({ metrics, onUpdate }) {
  const [activeTab, setActiveTab] = useState('role');

  const tabIndex = TABS.findIndex((t) => t.id === activeTab);

  const handleNext = () => {
    if (tabIndex < TABS.length - 1) {
      setActiveTab(TABS[tabIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (tabIndex > 0) {
      setActiveTab(TABS[tabIndex - 1].id);
    }
  };

  return (
    <div className="md:col-span-2 glass-panel p-6 rounded-2xl space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700/50 overflow-x-auto no-scrollbar gap-1 pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[280px]">
        {activeTab === 'role' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Gender</label>
              <select
                value={metrics.Gender}
                onChange={(e) => onUpdate('Gender', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="Male" className="dark:bg-slate-800">Male</option>
                <option value="Female" className="dark:bg-slate-800">Female</option>
                <option value="Other" className="dark:bg-slate-800">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Are you self-employed?</label>
              <select
                value={metrics.self_employed}
                onChange={(e) => onUpdate('self_employed', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Company Size</label>
              <select
                value={metrics.no_employees}
                onChange={(e) => onUpdate('no_employees', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="1-5" className="dark:bg-slate-800">1 - 5 employees</option>
                <option value="6-25" className="dark:bg-slate-800">6 - 25 employees</option>
                <option value="26-100" className="dark:bg-slate-800">26 - 100 employees</option>
                <option value="100-500" className="dark:bg-slate-800">100 - 500 employees</option>
                <option value="500-1000" className="dark:bg-slate-800">500 - 1,000 employees</option>
                <option value="More than 1000" className="dark:bg-slate-800">More than 1,000 employees</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Do you work remotely (at least 50%)?</label>
              <select
                value={metrics.remote_work}
                onChange={(e) => onUpdate('remote_work', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Is your employer primarily a tech company?</label>
              <select
                value={metrics.tech_company}
                onChange={(e) => onUpdate('tech_company', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'benefits' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Does employer provide mental health benefits?</label>
              <select
                value={metrics.benefits}
                onChange={(e) => onUpdate('benefits', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Don't know" className="dark:bg-slate-800">Don't know</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Do you know options for mental health care?</label>
              <select
                value={metrics.care_options}
                onChange={(e) => onUpdate('care_options', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Not sure" className="dark:bg-slate-800">Not sure</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Discussed in wellness program?</label>
              <select
                value={metrics.wellness_program}
                onChange={(e) => onUpdate('wellness_program', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Don't know" className="dark:bg-slate-800">Don't know</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Does employer provide resources / seek help?</label>
              <select
                value={metrics.seek_help}
                onChange={(e) => onUpdate('seek_help', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Don't know" className="dark:bg-slate-800">Don't know</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Is anonymity protected if you seek treatment?</label>
              <select
                value={metrics.anonymity}
                onChange={(e) => onUpdate('anonymity', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Don't know" className="dark:bg-slate-800">Don't know</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Ease of taking medical leave</label>
              <select
                value={metrics.leave}
                onChange={(e) => onUpdate('leave', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="Very easy" className="dark:bg-slate-800">Very easy</option>
                <option value="Somewhat easy" className="dark:bg-slate-800">Somewhat easy</option>
                <option value="Don't know" className="dark:bg-slate-800">Don't know</option>
                <option value="Somewhat difficult" className="dark:bg-slate-800">Somewhat difficult</option>
                <option value="Very difficult" className="dark:bg-slate-800">Very difficult</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'culture' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Family history of mental illness?</label>
              <select
                value={metrics.family_history}
                onChange={(e) => onUpdate('family_history', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Does mental health interfere with your work?</label>
              <select
                value={metrics.work_interfere}
                onChange={(e) => onUpdate('work_interfere', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium animate-pulse border-emerald-400/50 focus:animate-none"
              >
                <option value="Often" className="dark:bg-slate-800">Often</option>
                <option value="Sometimes" className="dark:bg-slate-800">Sometimes</option>
                <option value="Rarely" className="dark:bg-slate-800">Rarely</option>
                <option value="Never" className="dark:bg-slate-800">Never</option>
                <option value="Don't know" className="dark:bg-slate-800">Don't know</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Discussing mental health negative consequences?</label>
              <select
                value={metrics.mental_health_consequence}
                onChange={(e) => onUpdate('mental_health_consequence', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Maybe" className="dark:bg-slate-800">Maybe</option>
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Discussing physical health negative consequences?</label>
              <select
                value={metrics.phys_health_consequence}
                onChange={(e) => onUpdate('phys_health_consequence', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Maybe" className="dark:bg-slate-800">Maybe</option>
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Willingness to discuss with coworkers?</label>
              <select
                value={metrics.coworkers}
                onChange={(e) => onUpdate('coworkers', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="Some of them" className="dark:bg-slate-800">Some of them</option>
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Willingness to discuss with supervisor?</label>
              <select
                value={metrics.supervisor}
                onChange={(e) => onUpdate('supervisor', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
                <option value="Some of them" className="dark:bg-slate-800">Some of them</option>
                <option value="No" className="dark:bg-slate-800">No</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Observed consequences for others in workplace?</label>
              <select
                value={metrics.obs_consequence}
                onChange={(e) => onUpdate('obs_consequence', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Employer takes mental health seriously as physical?</label>
              <select
                value={metrics.mental_vs_physical}
                onChange={(e) => onUpdate('mental_vs_physical', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Don't know" className="dark:bg-slate-800">Don't know</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'interviews' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Bring up mental health issues in interviews?</label>
              <select
                value={metrics.mental_health_interview}
                onChange={(e) => onUpdate('mental_health_interview', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Maybe" className="dark:bg-slate-800">Maybe</option>
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">Bring up physical health issues in interviews?</label>
              <select
                value={metrics.phys_health_interview}
                onChange={(e) => onUpdate('phys_health_interview', e.target.value)}
                className="glass-input w-full rounded-lg px-4 py-2 outline-none text-sm text-emerald-700 dark:text-emerald-400 font-medium"
              >
                <option value="Maybe" className="dark:bg-slate-800">Maybe</option>
                <option value="No" className="dark:bg-slate-800">No</option>
                <option value="Yes" className="dark:bg-slate-800">Yes</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700/50">
        <button
          onClick={handlePrev}
          disabled={tabIndex === 0}
          className="cursor-pointer flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800/80 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous Section
        </button>

        <button
          onClick={handleNext}
          disabled={tabIndex === TABS.length - 1}
          className="cursor-pointer flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800/80 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next Section
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
