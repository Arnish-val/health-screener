import { ShieldAlert } from 'lucide-react';

export default function Disclaimer() {
  return (
    <div className="neu-pressed px-5 py-4 flex items-start gap-3 border border-warning/30">
      <ShieldAlert className="w-5 h-5 text-warning mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-text-primary">
          Medical Disclaimer
        </p>
        <p className="text-xs text-text-secondary mt-1 leading-relaxed">
          This tool is for <span className="font-semibold">educational and portfolio demonstration purposes only</span>.
          It is <span className="font-semibold">not</span> a clinical diagnostic device and should never replace professional medical advice,
          diagnosis, or treatment. Always consult a qualified healthcare provider for health concerns.
        </p>
      </div>
    </div>
  );
}
