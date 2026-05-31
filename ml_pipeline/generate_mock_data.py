import pandas as pd
import numpy as np
import os

os.makedirs('data', exist_ok=True)
np.random.seed(42)
n_samples = 2500

# ----------------- DISEASE MOCK DATA (20 FEATURES) -----------------
symptoms_list = [
    'fever', 'cough', 'fatigue', 'headache', 'sore_throat',
    'shortness_of_breath', 'loss_of_taste_smell', 'nausea', 'dizziness', 'chest_pain',
    'muscle_aches', 'chills', 'congestion', 'diarrhea', 'vomiting',
    'stomach_pain', 'rash', 'joint_pain', 'visual_disturbances', 'confusion'
]

disease_classes = ['Healthy', 'COVID-19', 'Flu', 'Migraine', 'Food Poisoning', 
                   'Common Cold', 'Heart Issue', 'Lyme Disease', 'Unknown Mild', 'Unknown Severe']
y_disease = np.random.choice(disease_classes, n_samples)
disease_data = {'disease': y_disease}
for sym in symptoms_list:
    disease_data[sym] = np.zeros(n_samples, dtype=int)

df_disease = pd.DataFrame(disease_data)

for i in range(n_samples):
    cond = df_disease.loc[i, 'disease']
    if cond == 'COVID-19':
        active = ['fever', 'cough', 'fatigue', 'shortness_of_breath', 'loss_of_taste_smell', 'muscle_aches']
    elif cond == 'Flu':
        active = ['fever', 'cough', 'fatigue', 'muscle_aches', 'chills', 'congestion']
    elif cond == 'Migraine':
        active = ['headache', 'nausea', 'visual_disturbances', 'fatigue']
    elif cond == 'Food Poisoning':
        active = ['nausea', 'vomiting', 'stomach_pain', 'diarrhea', 'fatigue', 'fever']
    elif cond == 'Common Cold':
        active = ['cough', 'congestion', 'sore_throat', 'fatigue']
    elif cond == 'Heart Issue':
        active = ['chest_pain', 'dizziness', 'shortness_of_breath', 'fatigue', 'confusion']
    elif cond == 'Lyme Disease':
        active = ['joint_pain', 'fatigue', 'rash', 'fever', 'muscle_aches']
    elif cond == 'Unknown Mild':
        active = list(np.random.choice(symptoms_list, 2, replace=False))
    elif cond == 'Unknown Severe':
        active = list(np.random.choice(symptoms_list, 8, replace=False))
    else: # Healthy
        active = []
        
    for a in active:
        df_disease.loc[i, a] = 1
    
    # Add random noise
    noise = np.random.choice(symptoms_list, 1)[0]
    df_disease.loc[i, noise] = 1

df_disease.to_csv('data/disease_data.csv', index=False)

# ----------------- MENTAL HEALTH MOCK DATA (8 FEATURES) -----------------
mh_classes = ['Normal', 'Stress', 'Anxiety', 'Depression', 'Bipolar Disorder']
y_mh = np.random.choice(mh_classes, n_samples, p=[0.4, 0.25, 0.2, 0.1, 0.05])

mh_data = {
    'condition': y_mh,
    'sleep_hours': np.clip(np.random.normal(7, 1.5, n_samples), 2, 12),
    'social_activity': np.clip(np.random.normal(5, 2.5, n_samples), 0, 10),
    'screen_time_hours': np.clip(np.random.normal(5, 3, n_samples), 1, 16),
    'stress_level': np.random.randint(1, 11, n_samples),
    'exercise_days_per_week': np.clip(np.random.normal(3, 2, n_samples).astype(int), 0, 7),
    'eating_quality': np.random.randint(1, 11, n_samples),
    'mood_score': np.random.randint(1, 11, n_samples),
    'energy_level': np.random.randint(1, 11, n_samples)
}
df_mh = pd.DataFrame(mh_data)

for i in range(n_samples):
    cond = df_mh.loc[i, 'condition']
    if cond == 'Bipolar Disorder':
        df_mh.loc[i, 'sleep_hours'] = np.random.choice([2,3,4,10,11,12])
        df_mh.loc[i, 'mood_score'] = np.random.choice([1,2,9,10])
    elif cond == 'Depression':
        df_mh.loc[i, 'sleep_hours'] = np.clip(df_mh.loc[i, 'sleep_hours'] - 2, 2, 12)
        df_mh.loc[i, 'mood_score'] = np.random.randint(1, 4)
        df_mh.loc[i, 'energy_level'] = np.random.randint(1, 4)
        df_mh.loc[i, 'social_activity'] = np.clip(df_mh.loc[i, 'social_activity'] - 3, 0, 10)
    elif cond == 'Anxiety':
        df_mh.loc[i, 'sleep_hours'] = np.clip(df_mh.loc[i, 'sleep_hours'] - 1, 2, 12)
        df_mh.loc[i, 'stress_level'] = np.random.randint(7, 11)
    elif cond == 'Stress':
        df_mh.loc[i, 'stress_level'] = np.random.randint(6, 11)
    else: # Normal
        df_mh.loc[i, 'stress_level'] = np.random.randint(1, 6)
        df_mh.loc[i, 'mood_score'] = np.random.randint(6, 11)
        df_mh.loc[i, 'energy_level'] = np.random.randint(6, 11)

df_mh.to_csv('data/mental_health_data.csv', index=False)
