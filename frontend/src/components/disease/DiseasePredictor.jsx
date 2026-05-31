import { useState, useMemo } from 'react';
import { Stethoscope, Search } from 'lucide-react';
import { predictDisease } from '../../api/diseaseApi';
import useApi from '../../hooks/useApi';
import Button from '../ui/Button';
import Alert from '../ui/Alert';
import SymptomGrid from './SymptomGrid';
import SymptomTags from './SymptomTags';
import DiseaseResults from './DiseaseResults';
import Disclaimer from '../shared/Disclaimer';

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

const formatLabel = (key) =>
  key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    .replace('(Typhos)', '').trim();

export default function DiseasePredictor() {
  const [symptoms, setSymptoms] = useState({});
  const [search, setSearch] = useState('');
  const { data: result, loading, error, execute } = useApi(predictDisease);

  const toggleSymptom = (key) => {
    setSymptoms((prev) => ({ ...prev, [key]: prev[key] === 1 ? 0 : 1 }));
  };

  const filteredSymptoms = useMemo(() => {
    if (!search.trim()) return KAGGLE_SYMPTOMS;
    return KAGGLE_SYMPTOMS.filter((s) =>
      formatLabel(s).toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const selectedCount = Object.values(symptoms).filter(Boolean).length;

  const handleSubmit = () => execute(symptoms);

  // Unwrap APIResponse envelope
  const resultData = result?.data || result;

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

      <SymptomGrid
        symptoms={symptoms}
        filteredSymptoms={filteredSymptoms}
        onToggle={toggleSymptom}
        search={search}
      />

      <SymptomTags symptoms={symptoms} onRemove={toggleSymptom} />

      <Button
        variant="primary"
        size="lg"
        loading={loading}
        disabled={selectedCount === 0}
        onClick={handleSubmit}
        className="w-full"
      >
        {loading
          ? `Analyzing ${selectedCount} parameters...`
          : `Generate Diagnostic (Features: ${selectedCount})`}
      </Button>

      {error && <Alert variant="error">{error}</Alert>}

      <DiseaseResults result={resultData} />

      <Disclaimer />
    </div>
  );
}
