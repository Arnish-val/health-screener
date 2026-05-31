import { ExternalLink, Heart } from 'lucide-react';
import Disclaimer from '../shared/Disclaimer';

/**
 * Site footer with compact disclaimer and social links.
 */
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-6 md:px-8 space-y-4">
        <Disclaimer compact />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400 dark:text-slate-600">
            &copy; {new Date().getFullYear()} HealthLens — Built with{' '}
            <Heart className="w-3 h-3 inline text-red-400" /> for healthcare
            ML research.
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
