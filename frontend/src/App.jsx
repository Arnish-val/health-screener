import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useDarkMode from './hooks/useDarkMode';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PageWrapper from './components/layout/PageWrapper';
import LandingScreen from './components/LandingScreen';
import DiseasePredictor from './components/disease/DiseasePredictor';
import DepressionScreener from './components/depression/DepressionScreener';
import AuthScreen from './components/auth/AuthScreen';
import HistoryView from './components/history/HistoryView';
import { AuthProvider } from './contexts/AuthContext';

/**
 * Inner shell — handles layout differences between landing and inner pages.
 * Landing page is full-width (no PageWrapper); inner pages use the constrained wrapper.
 */
function AppShell({ isDark, toggleTheme }) {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#020617] transition-colors duration-300">
      <Navbar isDark={isDark} toggleTheme={toggleTheme} />
      {isLanding ? (
        <main className="flex-1 w-full">
          <LandingScreen />
        </main>
      ) : (
        <PageWrapper>
          <Routes>
            <Route path="/disease" element={<DiseasePredictor />} />
            <Route path="/depression" element={<DepressionScreener />} />
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/history" element={<HistoryView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageWrapper>
      )}
      <Footer />
    </div>
  );
}

/**
 * Root application shell — routing, layout, and theme switching.
 */
export default function App() {
  const { isDark, toggleTheme } = useDarkMode();

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/*" element={<AppShell isDark={isDark} toggleTheme={toggleTheme} />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
