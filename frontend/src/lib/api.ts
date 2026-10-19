import { 
  Lecturer, Room, TimeSlot, Course, AcademicClass, LecturerPreference,
  GAParameters, ScheduleJob, ScheduleItem, PreCheckResult
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function fetchJSON<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = 'Terjadi kesalahan pada server';
    try {
      const errData = await res.json();
      errorDetail = errData.detail || errData.message || JSON.stringify(errData);
    } catch {
      errorDetail = `HTTP Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(typeof errorDetail === 'object' ? JSON.stringify(errorDetail) : errorDetail);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  // Master Data: Lecturers
  getLecturers: () => fetchJSON<Lecturer[]>('/master/lecturers'),
  createLecturer: (data: Omit<Lecturer, 'id' | 'created_at'>) => 
    fetchJSON<Lecturer>('/master/lecturers', { method: 'POST', body: JSON.stringify(data) }),
  updateLecturer: (id: string, data: Partial<Lecturer>) => 
    fetchJSON<Lecturer>(`/master/lecturers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLecturer: (id: string) => 
    fetchJSON<void>(`/master/lecturers/${id}`, { method: 'DELETE' }),

  // Master Data: Rooms
  getRooms: () => fetchJSON<Room[]>('/master/rooms'),
  createRoom: (data: Omit<Room, 'id'>) => 
    fetchJSON<Room>('/master/rooms', { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id: string, data: Partial<Room>) => 
    fetchJSON<Room>(`/master/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoom: (id: string) => 
    fetchJSON<void>(`/master/rooms/${id}`, { method: 'DELETE' }),

  // Master Data: TimeSlots
  getTimeSlots: () => fetchJSON<TimeSlot[]>('/master/time-slots'),
  createTimeSlot: (data: Omit<TimeSlot, 'id'>) => 
    fetchJSON<TimeSlot>('/master/time-slots', { method: 'POST', body: JSON.stringify(data) }),
  updateTimeSlot: (id: string, data: Partial<TimeSlot>) => 
    fetchJSON<TimeSlot>(`/master/time-slots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTimeSlot: (id: string) => 
    fetchJSON<void>(`/master/time-slots/${id}`, { method: 'DELETE' }),

  // Master Data: Courses
  getCourses: (semester?: number) => 
    fetchJSON<Course[]>(`/master/courses${semester ? `?semester=${semester}` : ''}`),
  createCourse: (data: Omit<Course, 'id'>) => 
    fetchJSON<Course>('/master/courses', { method: 'POST', body: JSON.stringify(data) }),
  updateCourse: (id: string, data: Partial<Course>) => 
    fetchJSON<Course>(`/master/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCourse: (id: string) => 
    fetchJSON<void>(`/master/courses/${id}`, { method: 'DELETE' }),

  // Master Data: Academic Classes
  getClasses: (semester?: number, kbk?: string) => {
    const params = new URLSearchParams();
    if (semester) params.append('semester', semester.toString());
    if (kbk) params.append('kbk', kbk);
    const qs = params.toString();
    return fetchJSON<AcademicClass[]>(`/master/classes${qs ? `?${qs}` : ''}`);
  },
  createClass: (data: Omit<AcademicClass, 'id'>) => 
    fetchJSON<AcademicClass>('/master/classes', { method: 'POST', body: JSON.stringify(data) }),
  updateClass: (id: string, data: Partial<AcademicClass>) => 
    fetchJSON<AcademicClass>(`/master/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClass: (id: string) => 
    fetchJSON<void>(`/master/classes/${id}`, { method: 'DELETE' }),

  // Master Data: Preferences
  getPreferences: (lecturerId?: string) => 
    fetchJSON<LecturerPreference[]>(`/master/preferences${lecturerId ? `?lecturer_id=${lecturerId}` : ''}`),
  createPreference: (data: Omit<LecturerPreference, 'id'>) => 
    fetchJSON<LecturerPreference>('/master/preferences', { method: 'POST', body: JSON.stringify(data) }),
  deletePreference: (id: string) => 
    fetchJSON<void>(`/master/preferences/${id}`, { method: 'DELETE' }),

  // Conflicts Pre-check
  preCheck: (academicYear = '2026/2027', semesterType = 'ODD') => 
    fetchJSON<PreCheckResult>(`/conflicts/pre-check?academic_year=${encodeURIComponent(academicYear)}&semester_type=${semesterType}`),

  // Schedule Generation & Optimization
  generateSchedule: (data: { academic_year: string; semester_type: string; parameters: GAParameters }) => 
    fetchJSON<{ status: string; message: string; data: { job_id: string; status: string; created_at: string } }>(
      '/schedules/generate', 
      { method: 'POST', body: JSON.stringify(data) }
    ),

  getJobStatus: (jobId: string) => 
    fetchJSON<{ status: string; data: ScheduleJob & { estimated_remaining_seconds: number } }>(`/schedules/jobs/${jobId}/status`),

  getScheduleResult: (jobId: string, filters?: { semester?: number; kbk?: string; lecturer_id?: string; room_id?: string }) => {
    const params = new URLSearchParams();
    if (filters?.semester) params.append('semester', filters.semester.toString());
    if (filters?.kbk && filters.kbk !== 'ALL') params.append('kbk', filters.kbk);
    if (filters?.lecturer_id) params.append('lecturer_id', filters.lecturer_id);
    if (filters?.room_id) params.append('room_id', filters.room_id);
    const qs = params.toString();
    return fetchJSON<{ status: string; total_items: number; data: ScheduleItem[] }>(`/schedules/jobs/${jobId}/result${qs ? `?${qs}` : ''}`);
  },

  publishSchedule: (jobId: string) => 
    fetchJSON<{ status: string; message: string }>(`/schedules/jobs/${jobId}/publish`, { method: 'PATCH' }),

  manualSwap: (scheduleId: string, newRoomId: string, newTimeSlotId: string) => 
    fetchJSON<{ status: string; message: string; data: ScheduleItem }>(
      `/schedules/${scheduleId}/manual-swap`, 
      { method: 'POST', body: JSON.stringify({ new_room_id: newRoomId, new_time_slot_id: newTimeSlotId }) }
    ),

  getJobsHistory: () => 
    fetchJSON<{ status: string; data: ScheduleJob[] }>('/schedules/jobs'),

  getExportUrl: (jobId: string, format: 'excel' | 'pdf') => 
    `${API_BASE_URL}/schedules/jobs/${jobId}/export?format=${format}`,
};
