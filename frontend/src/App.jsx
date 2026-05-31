import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
 * Root application shell — routing, layout, and theme switching.
 */
export default function App() {
  const { isDark, toggleTheme } = useDarkMode();

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#020617] transition-colors duration-300">
          <Navbar isDark={isDark} toggleTheme={toggleTheme} />
          <PageWrapper>
            <Routes>
              <Route path="/" element={<LandingScreen />} />
              <Route path="/disease" element={<DiseasePredictor />} />
              <Route path="/depression" element={<DepressionScreener />} />
              <Route path="/auth" element={<AuthScreen />} />
              <Route path="/history" element={<HistoryView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageWrapper>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
