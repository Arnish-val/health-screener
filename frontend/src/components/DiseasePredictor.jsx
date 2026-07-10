import { useState, useMemo } from 'react';
import axios from 'axios';
import { Stethoscope, Loader2, CheckCircle2, AlertTriangle, AlertCircle, Search } from 'lucide-react';
import Disclaimer from './Disclaimer';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;

const KAGGLE_SYMPTOMS = [
    "itching","skin_rash","nodal_skin_eruptions","continuous_sneezing",
    "shivering","chills","joint_pain","stomach_pain","acidity","ulcers_on_tongue",
    "muscle_wasting","vomiting","burning_micturition","spotting_urination",
    "fatigue","weight_gain","anxiety","cold_hands_and_feets","mood_swings",
    "weight_loss","restlessness","lethargy","patches_in_throat",
    "irregular_sugar_level","cough","high_fever","sunken_eyes","breathlessness",
    "sweating","dehydration","indigestion","headache","yellowish_skin",
    "dark_urine","nausea","loss_of_appetite","pain_behind_the_eyes",
    "back_pain","constipation","abdominal_pain","diarrhoea","mild_fever",
    "yellow_urine","yellowing_of_eyes","acute_liver_failure","fluid_overload",
    "swelling_of_stomach","swelled_lymph_nodes","malaise","blurred_and_distorted_vision",
    "phlegm","throat_irritation","redness_of_eyes","sinus_pressure","runny_nose",
    "congestion","chest_pain","weakness_in_limbs","fast_heart_rate",
    "pain_during_bowel_movements","pain_in_anal_region","bloody_stool",
    "irritation_in_anus","neck_pain","dizziness","cramps","bruising",
    "obesity","swollen_legs","swollen_blood_vessels","puffy_face_and_eyes",
    "enlarged_thyroid","brittle_nails","swollen_extremeties","excessive_hunger",
    "extra_marital_contacts","drying_and_tingling_lips","slurred_speech",
    "knee_pain","hip_joint_pain","muscle_weakness","stiff_neck","swelling_joints",
    "movement_stiffness","spinning_movements","loss_of_balance","unsteadiness",
    "weakness_of_one_body_side","loss_of_smell","bladder_discomfort",
    "foul_smell_of_urine","continuous_feel_of_urine","passage_of_gases",
    "internal_itching","toxic_look_(typhos)","depression","irritability",
    "muscle_pain","altered_sensorium","red_spots_over_body","belly_pain",
    "abnormal_menstruation","dischromic_patches","watering_from_eyes",
    "increased_appetite","polyuria","family_history","mucoid_sputum",
    "rusty_sputum","lack_of_concentration","visual_disturbances",
    "receiving_blood_transfusion","receiving_unsterile_injections","coma",
    "stomach_bleeding","distention_of_abdomen","history_of_alcohol_consumption",
    "fluid_overload_1","blood_in_sputum","prominent_veins_on_calf",
    "palpitations","painful_walking","pus_filled_pimples","blackheads",
    "scurring","skin_peeling","silver_like_dusting","small_dents_in_nails",
    "inflammatory_nails","blister","red_sore_around_nose","yellow_crust_ooze"
];

const formatLabel = (key) => key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').replace('(Typhos)', '').trim();

export default function DiseasePredictor() {
  const [symptoms, setSymptoms] = useState({});
  const [search, setSearch] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleSymptom = (key) => {
    setSymptoms((prev) => ({ 
       ...prev, 
       [key]: prev[key] === 1 ? 0 : 1 
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Send the mapped state dictionary back to fast API expecting 'symptoms' generic struct
      const res = await axios.post(`${API_URL}/predict/disease`, { symptoms });
      setResult(res.data);
    } catch (err) {
      if (err.response) {
        const resData = err.response.data;
        if (resData && resData.error && resData.error.message) {
          setError(resData.error.message);
        } else if (resData && resData.detail) {
          if (Array.isArray(resData.detail)) {
            const detailsMsg = resData.detail
              .map((d) => `${d.loc[d.loc.length - 1]}: ${d.msg}`)
              .join(', ');
            setError(`Validation Error — ${detailsMsg}`);
          } else {
            setError(`Validation Error — ${resData.detail}`);
          }
        } else {
          setError(`Request failed with status code ${err.response.status}`);
        }
      } else {
        setError('Could not reach the prediction server. Make sure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredSymptoms = useMemo(() => {
    if (!search.trim()) return KAGGLE_SYMPTOMS;
    return KAGGLE_SYMPTOMS.filter((s) => 
       formatLabel(s).toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const selectedCount = Object.values(symptoms).filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex items-center gap-3">
           <div className="w-12 h-12 rounded-2xl bg-cyan-100/50 dark:bg-cyan-900/40 flex items-center justify-center">
             <Stethoscope className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
           </div>
           <div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
               Disease Predictor
             </h2>
             <p className="text-sm text-slate-600 dark:text-slate-400">
               Select symptoms to query {KAGGLE_SYMPTOMS.length} Kaggle parameters.
             </p>
           </div>
         </div>
         
         <div className="relative w-full md:w-72">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
               type="text" 
               placeholder="Search symptoms..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="glass-input w-full pl-10 pr-4 py-3 rounded-xl"
            />
         </div>
      </div>

      {/* Dynamic Symptom Grid */}
      <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar">
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
           {filteredSymptoms.map((key) => {
             const isSelected = symptoms[key] === 1;
             return (
               <button
                 key={key}
                 onClick={() => toggleSymptom(key)}
                 className={`cursor-pointer flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 border text-left ${
                   isSelected
                     ? 'bg-cyan-600 border-cyan-600 dark:bg-cyan-700 dark:border-cyan-700 text-white shadow-md'
                     : 'glass-card text-slate-800 dark:text-slate-200'
                 }`}
               >
                 <span className={`text-sm font-medium leading-tight mr-2 ${isSelected ? 'text-white' : ''}`}>
                   {formatLabel(key)}
                 </span>
                 <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                   isSelected ? 'border-transparent bg-cyan-400' : 'border-slate-300 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50'
                 }`}>
                   {isSelected && <CheckCircle2 className="w-3 h-3 text-cyan-900" />}
                 </div>
               </button>
             );
           })}
           {filteredSymptoms.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                 No matching symptoms found for "{search}"
              </div>
           )}
         </div>
      </div>

      {/* Selected tags bubble UI */}
      {selectedCount > 0 && (
         <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {Object.keys(symptoms).filter(k => symptoms[k]).map(k => (
               <span key={k} onClick={() => toggleSymptom(k)} className="px-3 py-1 bg-[#0891B2]/10 text-[#0891B2] text-xs font-semibold rounded-full cursor-pointer hover:bg-red-50 hover:text-red-500">
                  {formatLabel(k)} &times;
               </span>
            ))}
         </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || selectedCount === 0}
        className={`w-full py-4 rounded-2xl text-base font-semibold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${
          selectedCount > 0
            ? 'bg-[#0891B2] text-white shadow-lg shadow-[#0891B2]/25 hover:bg-[#06b6d4] hover:-translate-y-0.5 active:scale-[0.98]'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing {selectedCount} parameters...
          </>
        ) : (
          `Generate Diagnostic (Features: ${selectedCount})`
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-100 text-red-700 text-sm">
           <AlertTriangle className="w-4 h-4 shrink-0" />
           {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="glass-panel p-6 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Analysis Results</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">Based on Random Forest classification of 132 features.</p>
          
          <div className="space-y-3 mt-4">
             {result.top3.map((cond, i) => (
                <div key={i} className="flex items-center justify-between p-4 glass-card rounded-xl">
                   <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-cyan-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                         #{i+1}
                      </div>
                      <span className={`font-semibold ${i === 0 ? 'text-cyan-700 dark:text-cyan-400 text-lg' : 'text-slate-800 dark:text-slate-200'}`}>
                        {cond.condition}
                      </span>
                   </div>
                   <div className="text-right">
                      <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
                         {(cond.probability * 100).toFixed(1)}%
                      </span>
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <Disclaimer />
    </div>
  );
}
