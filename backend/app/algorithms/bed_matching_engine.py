from typing import List, Dict, Any, Tuple
from app.models.bed import Bed, BedStatus
from app.models.patient import Patient

def match_beds_for_patient(patient: Patient, candidate_beds: List[Bed]) -> Dict[str, Any]:
    """
    Transparent, explainable bed recommendation engine.
    Filters candidate beds, assesses compatibility, computes 0-100 scores,
    and returns ranked recommendations with positive matches and rejection reasons.
    """
    recommended_beds: List[Dict[str, Any]] = []
    rejected_beds: List[Dict[str, Any]] = []

    # Parse patient equipment needs
    required_equipment_list = [
        item.strip().lower() for item in patient.required_equipment.split(",") if item.strip()
    ]
    needs_ventilator = "ventilator" in required_equipment_list or patient.oxygen_requirement == "Invasive"
    needs_cardiac_monitor = "cardiac monitor" in required_equipment_list or "monitor" in required_equipment_list or patient.priority == "Critical"
    needs_oxygen = patient.oxygen_requirement in ["Low Flow", "High Flow", "Invasive"] or "oxygen" in required_equipment_list
    needs_isolation = patient.isolation_requirement != "None" and patient.isolation_requirement != ""

    for bed in candidate_beds:
        is_compatible = True
        score = 0
        reasons: List[str] = []
        rejection_reasons: List[str] = []

        # 1. Operational status check
        if bed.status != BedStatus.AVAILABLE.value:
            is_compatible = False
            rejection_reasons.append(f"Bed is not available (Current status: {bed.status})")

        # 2. Isolation requirement check
        if needs_isolation:
            if not bed.has_isolation:
                is_compatible = False
                rejection_reasons.append(f"Lacks required isolation capability ({patient.isolation_requirement} protocol required)")
            else:
                score += 20
                reasons.append(f"Equipped with negative pressure / isolation barrier ({patient.isolation_requirement} compliant)")
        else:
            if bed.has_isolation and patient.priority != "Critical":
                # Conserve isolation beds for patients who actually need isolation
                score -= 10
                reasons.append("Isolation-capable bed allocated to non-isolation case (slight penalty to conserve resources)")

        # 3. Ventilator requirement check
        if needs_ventilator:
            if not bed.has_ventilator:
                is_compatible = False
                rejection_reasons.append("Missing required mechanical ventilator")
            else:
                score += 25
                reasons.append("Mechanical ventilator available and verified")
        else:
            if bed.has_ventilator and patient.priority not in ["Critical", "High"]:
                # Conserve ventilator beds for critical patients
                score -= 15
                reasons.append("Equipped with ventilator (non-ventilated patient penalty to preserve critical assets)")

        # 4. Oxygen requirement check
        if needs_oxygen:
            if not bed.has_oxygen:
                is_compatible = False
                rejection_reasons.append(f"Lacks medical oxygen supply line ({patient.oxygen_requirement} needed)")
            else:
                score += 20
                reasons.append(f"Central oxygen supply active ({patient.oxygen_requirement} supported)")
        else:
            if bed.has_oxygen:
                score += 5
                reasons.append("Supplemental oxygen port available as standby")

        # 5. Cardiac Monitor requirement check
        if needs_cardiac_monitor:
            if not bed.has_cardiac_monitor:
                # If high/critical and missing monitor, penalize or reject if specifically requested
                if "cardiac monitor" in required_equipment_list:
                    is_compatible = False
                    rejection_reasons.append("Missing required multi-parameter cardiac monitor")
                else:
                    score -= 10
                    reasons.append("Cardiac monitoring recommended for critical patient but bed is unmonitored")
            else:
                score += 20
                reasons.append("Continuous telemetry & multi-parameter cardiac monitor equipped")
        else:
            if bed.has_cardiac_monitor:
                score += 5
                reasons.append("Cardiac telemetry available")

        # 6. Department compatibility
        bed_dept_name = bed.department.name if bed.department else ""
        bed_dept_code = bed.department.code if bed.department else ""
        patient_dept = patient.department_requirement

        dept_match = False
        if patient_dept.lower() in bed_dept_name.lower() or patient_dept.lower() in bed_dept_code.lower():
            dept_match = True
            score += 30
            reasons.append(f"Direct department match: {bed_dept_name} ({bed.ward.name if bed.ward else ''})")
        elif patient.priority == "Critical" and bed_dept_code in ["ICU", "CCU", "ED"]:
            dept_match = True
            score += 25
            reasons.append(f"Critical care department match: {bed_dept_name}")
        elif patient_dept in ["General Ward", "General Medicine"] and bed_dept_code in ["GW", "MED", "SURG"]:
            dept_match = True
            score += 20
            reasons.append(f"Compatible inpatient department: {bed_dept_name}")
        else:
            # Check if strict department requirement
            if patient.priority == "Critical" and bed_dept_code not in ["ICU", "CCU", "ED"]:
                is_compatible = False
                rejection_reasons.append(f"Department mismatch: Critical patient requires intensive care, bed is in {bed_dept_name}")
            else:
                score += 5
                reasons.append(f"Secondary department placement: {bed_dept_name}")

        # 7. Priority & Bed Type alignment
        if patient.priority == "Critical":
            if bed.bed_type in ["ICU", "CCU", "ER"]:
                score += 15
                reasons.append(f"Appropriate high-acuity bed type ({bed.bed_type}) for critical case")
            else:
                score -= 10
                reasons.append(f"Lower-acuity bed type ({bed.bed_type}) for critical patient")
        elif patient.priority == "Low":
            if bed.bed_type == "Standard":
                score += 15
                reasons.append("Standard ward bed ideal for low-acuity convalescence")

        # 8. Ward & Floor accessibility
        if patient.mobility_requirement in ["Stretcher", "Wheelchair"] and ("Ground" in bed.floor or "1st" in bed.floor):
            score += 5
            reasons.append(f"Accessible floor location ({bed.floor}) for {patient.mobility_requirement} transport")

        # Normalize score between 10 and 99
        final_score = max(10, min(99, score))

        bed_dict = {
            "bed_id": bed.id,
            "ward_name": bed.ward.name if bed.ward else "Ward",
            "department_name": bed_dept_name,
            "department_code": bed_dept_code,
            "floor": bed.floor,
            "room": bed.room,
            "bed_type": bed.bed_type,
            "status": bed.status,
            "has_oxygen": bed.has_oxygen,
            "has_ventilator": bed.has_ventilator,
            "has_cardiac_monitor": bed.has_cardiac_monitor,
            "has_isolation": bed.has_isolation,
            "compatibility_score": final_score,
            "is_compatible": is_compatible,
            "reasons": reasons,
            "rejection_reasons": rejection_reasons
        }

        if is_compatible:
            recommended_beds.append(bed_dict)
        else:
            rejected_beds.append(bed_dict)

    # Sort recommended beds by compatibility score descending
    recommended_beds.sort(key=lambda b: b["compatibility_score"], reverse=True)

    return {
        "patient_id": patient.id,
        "patient_name": patient.name,
        "patient_priority": patient.priority,
        "required_department": patient.department_requirement,
        "recommendations": recommended_beds,
        "unavailable_alternatives": rejected_beds[:10], # Top 10 rejected/unavailable beds for inspection
        "top_recommendation": recommended_beds[0] if recommended_beds else None,
        "disclaimer": "AI recommendations are operational decision-support rankings. Allocation requires authorized clinician approval."
    }
