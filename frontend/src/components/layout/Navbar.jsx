import { Activity, Sun, Moon, Menu, X, LogIn, LogOut, History } from 'lucide-react';
import { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../contexts/auth-context';

/**
 * Site navigation bar
 */
export default function Navbar({ isDark, toggleTheme }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const activeTab = location.pathname;

  const handleNavigate = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { key: '/', label: 'Dashboard' },
    { key: '/disease', label: 'Disease AI' },
    { key: '/depression', label: 'Mental Health' },
    { key: '/alzheimers', label: "Alzheimer's" },
  ];

  const linkClass = (path) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
      activeTab === path
        ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  const handleLogout = () => {
    logout();
    handleNavigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-x-0 border-t-0 rounded-none rounded-b-xl px-4 py-3 md:px-8 bg-white/80 dark:bg-slate-900/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => handleNavigate('/')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300 transform group-hover:-translate-y-0.5">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
            Health<span className="text-cyan-600 dark:text-cyan-400">Lens</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <button key={item.key} onClick={() => handleNavigate(item.key)} className={linkClass(item.key)}>
              {item.label}
            </button>
          ))}

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />

          {user ? (
             <div className="flex items-center gap-2">
                <button onClick={() => handleNavigate('/history')} className={linkClass('/history')}>
                   <History className="w-4 h-4 inline-block mr-1" /> History
                </button>
                <button onClick={handleLogout} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all">
                   <LogOut className="w-4 h-4 inline-block mr-1" /> Logout
                </button>
             </div>
          ) : (
             <button
               onClick={() => handleNavigate('/auth')}
               id="nav-get-started-btn"
               className="px-5 py-2 bg-[#106EBE] hover:bg-[#0A4F8A] text-white text-sm font-bold rounded-full shadow-md shadow-[#106EBE]/25 hover:shadow-[#106EBE]/40 transition-all"
             >
               Get Started
             </button>
          )}

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2" />

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 cursor-pointer">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden pt-4 pb-2 space-y-1 border-t border-slate-100 dark:border-slate-800 mt-3">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavigate(item.key)}
              className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-medium cursor-pointer ${
                activeTab === item.key
                  ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="border-t border-slate-100 dark:border-slate-800 my-2 pt-2">
             {user ? (
               <>
                 <button onClick={() => handleNavigate('/history')} className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-medium cursor-pointer text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800`}>
                   History
                 </button>
                 <button onClick={handleLogout} className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-medium cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`}>
                   Logout
                 </button>
               </>
             ) : (
                 <button onClick={() => handleNavigate('/auth')} className={`block w-full text-left px-4 py-3 rounded-xl text-sm font-medium cursor-pointer text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20`}>
                   Login / Sign Up
                 </button>
             )}
          </div>
        </div>
      )}
    </nav>
  );
}
