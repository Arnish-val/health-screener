import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const formatLabel = (key) =>
  key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace('(Typhos)', '')
    .trim();

/**
 * Grid of toggleable symptom buttons with search filtering.
 */
export default function SymptomGrid({ symptoms, filteredSymptoms, onToggle, search }) {
  return (
    <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredSymptoms.map((key) => {
          const isSelected = symptoms[key] === 1;
          return (
            <motion.button
              key={key}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={() => onToggle(key)}
              className={`cursor-pointer flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 border text-left ${
                isSelected
                  ? 'bg-[#106EBE] border-[#106EBE] dark:bg-[#0A4F8A] dark:border-[#0A4F8A] text-white shadow-md'
                  : 'glass-card text-slate-800 dark:text-slate-200'
              }`}
            >
              <span
                className={`text-sm font-medium leading-tight mr-2 ${isSelected ? 'text-white' : ''}`}
              >
                {formatLabel(key)}
              </span>
              <div
                className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                  isSelected
                    ? 'border-transparent bg-[#4A9BE4]'
                    : 'border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50'
                }`}
              >
                {isSelected && <CheckCircle2 className="w-3 h-3 text-[#0A4F8A]" />}
              </div>
            </motion.button>
          );
        })}
        {filteredSymptoms.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400">
            No matching symptoms found for "{search}"
          </div>
        )}
      </div>
    </div>
  );
}
