"""
Rule-based intelligent feedback generator for health assessments.
"""

def generate_disease_feedback(symptoms: dict[str, int], top_prediction: str) -> str:
    """Generates educational feedback based on the symptoms provided."""
    active_symptoms = [s for s, v in symptoms.items() if v == 1]
    
    if not active_symptoms:
        return "No symptoms were reported. Please consult a doctor if you feel unwell."
        
    feedback = f"Based on your reported symptoms (including {', '.join(active_symptoms[:3])}), the model identified {top_prediction} as a potential match. "
    
    if len(active_symptoms) > 5:
        feedback += "You have reported a high number of symptoms. It is strongly recommended to seek professional medical evaluation soon."
    elif "high_fever" in active_symptoms or "breathlessness" in active_symptoms:
        feedback += "Some of your symptoms (like fever or breathlessness) can require immediate attention. Please do not ignore them."
    else:
        feedback += "Rest and hydration are generally recommended, but please see a doctor for a formal diagnosis."
        
    return feedback

def generate_depression_feedback(risk_level: str, metrics: dict) -> str:
    """Generates personalized lifestyle feedback based on provided metrics."""
    feedback = []
    
    # Sleep
    sleep = metrics.get('Sleep_Duration', 7)
    if sleep < 6:
        feedback.append("getting more sleep (aim for 7-9 hours)")
    
    # Work/Study Pressure
    pressure = metrics.get('Work_Pressure', 0) + metrics.get('Academic_Pressure', 0)
    if pressure > 6: # Assuming scale 1-5 for each, total > 6 is high
        feedback.append("managing your academic/work stress through breaks or counseling")
        
    # Dietary Habits
    diet = metrics.get('Dietary_Habits', 1)
    if diet < 2: # Assuming scale 0-3 (poor to excellent)
        feedback.append("improving your dietary habits for better mental energy")
        
    if risk_level == "High":
        base = "Your profile indicates a significant risk. We strongly advise reaching out to a mental health professional. In the meantime, focusing on "
    elif risk_level == "Moderate":
        base = "Your profile shows some risk factors. Consider speaking to a counselor, and focus on "
    else:
        base = "Your risk level is relatively low, but maintaining good habits is key. Keep focusing on "
        
    if feedback:
        return base + ", ".join(feedback[:-1]) + (" and " + feedback[-1] if len(feedback) > 1 else feedback[0]) + " can be beneficial."
    
    return base + "maintaining your current healthy routines."
