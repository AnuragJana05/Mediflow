export type UserRole = 'admin' | 'doctor' | 'nurse';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  status: string;
}

export type BedStatus = 'Available' | 'Occupied' | 'Cleaning' | 'Reserved' | 'Maintenance';
export type BedType = 'Standard' | 'ICU' | 'CCU' | 'Isolation' | 'Step-down' | 'ER';

export interface Bed {
  id: string;
  ward_id: number;
  department_id: number;
  bed_type: BedType;
  status: BedStatus;
  floor: string;
  room: string;
  has_oxygen: boolean;
  has_ventilator: boolean;
  has_cardiac_monitor: boolean;
  has_isolation: boolean;
  has_infusion_pump: boolean;
  notes?: string;
  department_name?: string;
  department_code?: string;
  ward_name?: string;
  current_patient_id?: string;
  current_patient_name?: string;
  last_updated?: string;
}

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';
export type PatientStatus = 'Waiting' | 'Under Assessment' | 'Awaiting Bed' | 'Admitted' | 'Discharged' | 'Transferred';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contact?: string;
  emergency_contact?: string;
  arrival_time: string;
  symptoms: string;
  oxygen_requirement: 'None' | 'Low Flow' | 'High Flow' | 'Invasive';
  heart_rate: number;
  spo2: number;
  blood_pressure_sys: number;
  blood_pressure_dia: number;
  temperature: number;
  mobility_requirement: 'Ambulatory' | 'Wheelchair' | 'Stretcher';
  isolation_requirement: 'None' | 'Airborne' | 'Droplet' | 'Contact';
  required_equipment: string;
  department_requirement: string;
  priority: PriorityLevel;
  priority_override_reason?: string;
  current_status: PatientStatus;
  assigned_bed_id?: string;
  assigned_bed_room?: string;
  admitted_at?: string;
  discharged_at?: string;
  is_simulation: boolean;
  created_at: string;
  triage_factors?: string[];
}

export interface DepartmentOccupancy {
  id: number;
  name: string;
  code: string;
  type: string;
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  cleaning_beds: number;
  maintenance_beds: number;
  occupancy_rate: number;
}

export interface DashboardSummary {
  total_beds: number;
  available_beds: number;
  occupied_beds: number;
  cleaning_beds: number;
  maintenance_beds: number;
  reserved_beds: number;
  overall_occupancy_rate: number;
  icu_occupancy_rate: number;
  emergency_occupancy_rate: number;
  general_ward_occupancy_rate: number;
  isolation_occupancy_rate: number;
  icu_total: number;
  icu_available: number;
  icu_occupied: number;
  emergency_total: number;
  emergency_available: number;
  emergency_occupied: number;
  total_patients: number;
  waiting_patients: number;
  critical_patients_waiting: number;
  average_wait_time_minutes: number;
  departments: DepartmentOccupancy[];
}

export interface BedMatchItem {
  bed_id: string;
  ward_name: string;
  department_name: string;
  department_code: string;
  floor: string;
  room: string;
  bed_type: string;
  status: string;
  has_oxygen: boolean;
  has_ventilator: boolean;
  has_cardiac_monitor: boolean;
  has_isolation: boolean;
  compatibility_score: number;
  is_compatible: boolean;
  reasons: string[];
  rejection_reasons: string[];
}

export interface RecommendationResponse {
  patient_id: string;
  patient_name: string;
  patient_priority: PriorityLevel;
  required_department: string;
  recommendations: BedMatchItem[];
  unavailable_alternatives: BedMatchItem[];
  top_recommendation?: BedMatchItem;
  disclaimer: string;
}

export interface Alert {
  id: number;
  type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Info';
  title: string;
  message: string;
  department?: string;
  status: 'Active' | 'Acknowledged' | 'Resolved';
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by_id?: number;
  acknowledged_by_name?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name: string;
  user_role: string;
  action: string;
  entity: string;
  entity_id: string;
  old_value?: string;
  new_value?: string;
  details?: string;
  timestamp: string;
}

export interface SurgeSimulationResponse {
  scenario: string;
  scenario_title: string;
  scenario_description: string;
  incoming_patients_count: number;
  critical_patients_added: number;
  high_patients_added: number;
  medium_patients_added: number;
  beds_occupied_automatically: number;
  icu_utilization_after: number;
  emergency_utilization_after: number;
  overall_hospital_capacity_after: number;
  capacity_status: string;
  estimated_waiting_time_minutes: number;
  alerts_triggered: string[];
  resource_shortages: string[];
  disclaimer: string;
}
