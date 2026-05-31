import { ShieldAlert } from 'lucide-react';

/**
 * Enhanced medical disclaimer — more prominent, visually distinct.
 * Appears on every result screen and in the site footer.
 */
export default function Disclaimer({ compact = false }) {
  if (compact) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-500 text-center leading-relaxed">
        <ShieldAlert className="w-3 h-3 inline mr-1 -mt-0.5" />
        Educational tool only — not a clinical diagnostic device. Always consult a qualified healthcare provider.
      </p>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-amber-300/50 dark:border-amber-700/50 bg-amber-50/80 dark:bg-amber-900/10 backdrop-blur-sm px-6 py-5">
      {/* Decorative accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-1">
            Medical Disclaimer
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400/80 leading-relaxed">
            This tool is for{' '}
            <span className="font-semibold">
              educational and portfolio demonstration purposes only
            </span>
            . It is <span className="font-semibold">not</span> a clinical
            diagnostic device and should never replace professional medical
            advice, diagnosis, or treatment. Always consult a qualified
            healthcare provider for health concerns.
          </p>
        </div>
      </div>
    </div>
  );
}
