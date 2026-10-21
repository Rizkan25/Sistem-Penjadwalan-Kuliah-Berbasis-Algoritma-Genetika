from typing import Optional, List, Dict, Any
from datetime import time, datetime
from uuid import UUID
from pydantic import BaseModel, Field

class GAParameters(BaseModel):
    population_size: int = Field(default=100, ge=20, le=500)
    max_generations: int = Field(default=500, ge=10, le=2000)
    crossover_rate: float = Field(default=0.85, ge=0.1, le=1.0)
    mutation_rate: float = Field(default=0.08, ge=0.01, le=0.5)
    elitism_count: int = Field(default=2, ge=1, le=10)

class GenerateScheduleRequest(BaseModel):
    academic_year: str = Field(default="2026/2027")
    semester_type: str = Field(default="ODD", description="ODD or EVEN")
    parameters: Optional[GAParameters] = Field(default_factory=GAParameters)

class GenerateScheduleResponseData(BaseModel):
    job_id: UUID
    status: str
    created_at: datetime

class GenerateScheduleResponse(BaseModel):
    status: str = "success"
    message: str = "Proses optimasi penjadwalan berhasil dijadwalkan ke antrean."
    data: GenerateScheduleResponseData

class JobStatusData(BaseModel):
    job_id: UUID
    status: str
    progress_percentage: int
    current_generation: int
    max_generations: int
    best_fitness: float
    hard_conflicts_count: int
    soft_conflicts_count: int
    estimated_remaining_seconds: Optional[float] = 0.0
    execution_time_seconds: Optional[float] = None
    error_message: Optional[str] = None
    is_published: bool = False

class JobStatusResponse(BaseModel):
    status: str = "success"
    data: JobStatusData

class ScheduleItemResponse(BaseModel):
    id: UUID
    job_id: UUID
    class_id: UUID
    class_name: str
    semester: int
    cohort: str
    kbk: str
    student_count: int
    academic_year: str
    semester_type: str
    
    # Course info
    course_id: UUID
    course_code: str
    course_name: str
    credits: int
    course_type: str
    
    # Lecturer info
    lecturer_id: UUID
    lecturer_nidn: Optional[str] = "-"
    lecturer_name: str
    
    # Room info
    room_id: UUID
    room_code: str
    room_name: str
    room_capacity: int
    room_type: str
    
    # Time slot info
    time_slot_id: UUID
    day_of_week: int
    period_order: int
    start_time: time
    end_time: time

    # Soft constraint indicators for UI
    is_preferred_slot: bool = True
    soft_penalty_reasons: List[str] = []

class ScheduleResultResponse(BaseModel):
    status: str = "success"
    total_items: int
    data: List[ScheduleItemResponse]

class ManualSwapRequest(BaseModel):
    new_room_id: UUID
    new_time_slot_id: UUID

class ManualSwapResponse(BaseModel):
    status: str = "success"
    message: str = "Perubahan jadwal berhasil divalidasi dan disimpan."
    data: ScheduleItemResponse

class ConflictItem(BaseModel):
    constraint: str # HC1 - HC6 or SC1 - SC3
    description: str
    affected_classes: List[str] = []

class PreCheckResponse(BaseModel):
    status: str = "success"
    is_feasible: bool
    total_classes: int
    total_theory_classes: int
    total_lab_classes: int
    total_time_slots: int
    total_rooms: int
    capacity_issues: List[str] = []
    lecturer_workload_issues: List[str] = []
    message: str
