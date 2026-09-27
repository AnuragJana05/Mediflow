from typing import Dict, Any, List

CRITICAL_SYMPTOM_KEYWORDS = [
    "cardiac arrest", "unresponsive", "respiratory failure", "severe trauma", 
    "massive hemorrhage", "stroke", "anaphylaxis", "septic shock", "cyanosis", 
    "severe respiratory distress", "altered mental status", "gcs < 9"
]

HIGH_SYMPTOM_KEYWORDS = [
    "chest pain", "shortness of breath", "acute asthma", "suspected sepsis", 
    "severe burn", "head injury", "severe pain", "ketoacidosis", "pulmonary embolism",
    "acute coronary syndrome", "open fracture", "syncope"
]

MEDIUM_SYMPTOM_KEYWORDS = [
    "abdominal pain", "persistent vomiting", "fever", "uncontrolled hypertension", 
    "closed fracture", "laceration", "moderate asthma", "migraine", "infection"
]

def assess_patient_triage(
    spo2: int,
    heart_rate: int,
    bp_sys: int,
    bp_dia: int,
    temperature: float,
    symptoms: str,
    oxygen_requirement: str = "None",
    emergency_presentation: bool = False,
    isolation_requirement: str = "None"
) -> Dict[str, Any]:
    """
    Explainable Triage & Priority Assessment Engine.
    Evaluates physiological vitals, clinical presentations, and critical flags.
    NOTE: Prototype decision-support mechanism. Does not replace clinician diagnosis.
    """
    factors: List[str] = []
    points = 0 # 0-100 severity index
    symptoms_lower = symptoms.lower()

    # 1. SpO2 evaluation
    if spo2 < 88:
        points += 40
        factors.append(f"Critical Hypoxemia: SpO2 {spo2}% is severely depressed (<88%)")
    elif spo2 < 92:
        points += 30
        factors.append(f"Significant Hypoxemia: SpO2 {spo2}% (<92%)")
    elif spo2 < 95:
        points += 15
        factors.append(f"Borderline Oxygen Saturation: SpO2 {spo2}% (92-94%)")

    # 2. Oxygen Support Requirement
    if oxygen_requirement == "Invasive":
        points += 45
        factors.append("Requires invasive mechanical ventilation / airway management")
    elif oxygen_requirement == "High Flow":
        points += 25
        factors.append("Requires high-flow oxygen support (HFNC / NRB mask)")
    elif oxygen_requirement == "Low Flow":
        points += 10
        factors.append("Requires supplemental low-flow oxygen therapy")

    # 3. Heart Rate evaluation
    if heart_rate > 140 or heart_rate < 40:
        points += 35
        factors.append(f"Extreme Hemodynamic Instability: Heart rate {heart_rate} bpm")
    elif heart_rate > 115 or heart_rate < 50:
        points += 20
        factors.append(f"Abnormal Heart Rate: {heart_rate} bpm (Tachycardia/Bradycardia)")
    elif heart_rate > 100:
        points += 10
        factors.append(f"Mild Tachycardia: {heart_rate} bpm")

    # 4. Blood Pressure evaluation
    if bp_sys < 80 or bp_sys > 210 or bp_dia > 125:
        points += 35
        factors.append(f"Hypertensive Crisis or Severe Shock: BP {bp_sys}/{bp_dia} mmHg")
    elif bp_sys < 90 or bp_sys > 180 or bp_dia > 110:
        points += 20
        factors.append(f"Abnormal Blood Pressure: {bp_sys}/{bp_dia} mmHg")
    elif bp_sys > 150 or bp_dia > 95:
        points += 10
        factors.append(f"Elevated Blood Pressure: {bp_sys}/{bp_dia} mmHg")

    # 5. Body Temperature evaluation
    if temperature >= 40.0 or temperature < 34.5:
        points += 25
        factors.append(f"Extreme Core Temperature: {temperature:.1f}°C (Severe hyperthermia/hypothermia)")
    elif temperature >= 38.8 or temperature < 35.5:
        points += 15
        factors.append(f"Significant Fever / Low Temperature: {temperature:.1f}°C")
    elif temperature >= 38.0:
        points += 8
        factors.append(f"Mild Pyrexia: {temperature:.1f}°C")

    # 6. Symptom presentation analysis
    for kw in CRITICAL_SYMPTOM_KEYWORDS:
        if kw in symptoms_lower:
            points += 35
            factors.append(f"Critical Clinical Indicator: '{kw.title()}' noted in symptoms")
            break

    for kw in HIGH_SYMPTOM_KEYWORDS:
        if kw in symptoms_lower:
            points += 20
            factors.append(f"Urgent Symptom Trigger: '{kw.title()}' detected")
            break

    # 7. Additional flags
    if emergency_presentation:
        points += 15
        factors.append("Emergency department arrival presentation")

    if isolation_requirement != "None":
        points += 10
        factors.append(f"Infection control isolation protocol active ({isolation_requirement})")

    # Determine Priority Classification based on accumulated points and overrides
    if points >= 45 or spo2 < 90 or oxygen_requirement == "Invasive" or any(kw in symptoms_lower for kw in CRITICAL_SYMPTOM_KEYWORDS):
        priority = "Critical"
    elif points >= 25 or spo2 < 94 or oxygen_requirement == "High Flow" or any(kw in symptoms_lower for kw in HIGH_SYMPTOM_KEYWORDS):
        priority = "High"
    elif points >= 12:
        priority = "Medium"
    else:
        priority = "Low"
        if not factors:
            factors.append("Vitals within baseline physiological limits; non-acute presentation")

    return {
        "priority": priority,
        "severity_score": min(points, 100),
        "factors": factors,
        "disclaimer": "MediFlow is a clinical decision-support prototype. Triage suggestions require verification by qualified medical professionals."
    }
