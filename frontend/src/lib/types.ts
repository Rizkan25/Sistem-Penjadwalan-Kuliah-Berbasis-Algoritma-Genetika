export interface Lecturer {
  id: string;
  nidn?: string | null;
  name: string;
  email: string;
  jabatan?: string | null;
  is_guest?: boolean;
  kbk?: 'GENERAL' | 'PEMROGRAMAN' | 'MULTIMEDIA' | 'IOT';
  created_at?: string;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  capacity: number;
  room_type: 'THEORY' | 'LABORATORY';
  is_active: boolean;
}

export interface TimeSlot {
  id: string;
  day_of_week: number;
  period_order: number;
  start_time: string;
  end_time: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  course_type: 'THEORY' | 'LABORATORY';
  kbk: 'GENERAL' | 'PEMROGRAMAN' | 'MULTIMEDIA' | 'IOT';
  jenis_mk?: string;
  prerequisites?: string | null;
}

export interface AcademicClass {
  id: string;
  course_id: string;
  lecturer_id: string;
  class_name: string;
  semester: number;
  cohort: string;
  kbk: 'GENERAL' | 'PEMROGRAMAN' | 'MULTIMEDIA' | 'IOT';
  student_count: number;
  academic_year: string;
  semester_type: 'ODD' | 'EVEN';
  course?: Course;
  lecturer?: Lecturer;
}

export interface LecturerPreference {
  id: string;
  lecturer_id: string;
  time_slot_id: string;
  preference_type: 'UNAVAILABLE' | 'PREFERRED';
  reason?: string;
  lecturer?: Lecturer;
  time_slot?: TimeSlot;
}

export interface BatchPreferenceRequest {
  lecturer_id: string;
  mode: 'UNAVAILABLE_DAYS' | 'ONLY_AVAILABLE_DAYS' | 'PREFERRED_DAYS';
  days: number[];
  time_range?: 'ALL' | 'MORNING' | 'AFTERNOON';
  reason?: string;
  clear_existing_days?: boolean;
}

export interface BulkSlotPreference {
  time_slot_id: string;
  preference_type: 'UNAVAILABLE' | 'PREFERRED' | 'NONE';
  reason?: string;
}

export interface BulkPreferenceRequest {
  lecturer_id: string;
  slots: BulkSlotPreference[];
}

export interface GAParameters {
  population_size: number;
  max_generations: number;
  crossover_rate: number;
  mutation_rate: number;
  elitism_count: number;
}

export interface ScheduleJob {
  id: string;
  academic_year: string;
  semester_type: 'ODD' | 'EVEN';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  is_published: boolean;
  progress_percentage: number;
  current_generation: number;
  max_generations: number;
  best_fitness: number;
  hard_conflicts_count: number;
  soft_conflicts_count: number;
  execution_time_seconds?: number;
  error_message?: string;
  is_valid?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleItem {
  id: string;
  job_id: string;
  class_id: string;
  class_name: string;
  semester: number;
  cohort: string;
  kbk: 'GENERAL' | 'PEMROGRAMAN' | 'MULTIMEDIA' | 'IOT';
  student_count: number;
  academic_year: string;
  semester_type: 'ODD' | 'EVEN';
  course_id: string;
  course_code: string;
  course_name: string;
  credits: number;
  course_type: 'THEORY' | 'LABORATORY';
  lecturer_id: string;
  lecturer_nidn?: string | null;
  lecturer_name: string;
  room_id: string;
  room_code: string;
  room_name: string;
  room_capacity: number;
  room_type: 'THEORY' | 'LABORATORY';
  time_slot_id: string;
  day_of_week: number;
  period_order: number;
  start_time: string;
  end_time: string;
  is_preferred_slot: boolean;
  soft_penalty_reasons: string[];
  is_conflict?: boolean;
}

export interface JobValidationResult {
  status: string;
  job_id: string;
  is_valid: boolean;
  hard_conflicts_count: number;
  soft_conflicts_count: number;
  conflicts_by_type: {
    hc1_lecturer_clash: number;
    hc2_room_clash: number;
    hc3_cohort_clash: number;
    hc4_capacity_deficit: number;
    hc5_room_type_mismatch: number;
    hc6_lecturer_unavailable: number;
  };
  conflict_details: string[];
  message: string;
}

export interface PreCheckResult {
  status: string;
  is_feasible: boolean;
  total_classes: number;
  total_theory_classes: number;
  total_lab_classes: number;
  total_time_slots: number;
  total_rooms: number;
  capacity_issues: string[];
  lecturer_workload_issues: string[];
  message: string;
}
