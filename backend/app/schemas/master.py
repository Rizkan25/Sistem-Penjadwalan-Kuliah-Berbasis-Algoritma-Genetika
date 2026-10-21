from typing import Optional, List
from datetime import time, datetime
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr

# Lecturer
class LecturerBase(BaseModel):
    nidn: Optional[str] = Field(None, max_length=30)
    name: str = Field(..., max_length=150)
    email: EmailStr
    jabatan: Optional[str] = Field(None, max_length=150)
    is_guest: bool = False

class LecturerCreate(LecturerBase):
    pass

class LecturerUpdate(BaseModel):
    nidn: Optional[str] = Field(None, max_length=30)
    name: Optional[str] = Field(None, max_length=150)
    email: Optional[EmailStr] = None
    jabatan: Optional[str] = Field(None, max_length=150)
    is_guest: Optional[bool] = None

class LecturerResponse(LecturerBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Room
class RoomBase(BaseModel):
    code: str = Field(..., max_length=20)
    name: str = Field(..., max_length=100)
    capacity: int = Field(..., gt=0)
    room_type: str = Field(default="THEORY", description="THEORY or LABORATORY")
    is_active: bool = True

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=20)
    name: Optional[str] = Field(None, max_length=100)
    capacity: Optional[int] = Field(None, gt=0)
    room_type: Optional[str] = None
    is_active: Optional[bool] = None

class RoomResponse(RoomBase):
    id: UUID

    class Config:
        from_attributes = True

# TimeSlot
class TimeSlotBase(BaseModel):
    day_of_week: int = Field(..., ge=1, le=6, description="1: Senin, 5: Jumat, 6: Sabtu")
    period_order: int = Field(..., gt=0)
    start_time: time
    end_time: time

class TimeSlotCreate(TimeSlotBase):
    pass

class TimeSlotUpdate(BaseModel):
    day_of_week: Optional[int] = Field(None, ge=1, le=6)
    period_order: Optional[int] = Field(None, gt=0)
    start_time: Optional[time] = None
    end_time: Optional[time] = None

class TimeSlotResponse(TimeSlotBase):
    id: UUID

    class Config:
        from_attributes = True

# LecturerTimePreference
class LecturerPreferenceBase(BaseModel):
    lecturer_id: UUID
    time_slot_id: UUID
    preference_type: str = Field(..., description="UNAVAILABLE or PREFERRED")
    reason: Optional[str] = Field(None, max_length=255)

class LecturerPreferenceCreate(LecturerPreferenceBase):
    pass

class LecturerPreferenceUpdate(BaseModel):
    preference_type: Optional[str] = None
    reason: Optional[str] = None

class LecturerPreferenceResponse(LecturerPreferenceBase):
    id: UUID
    lecturer: Optional[LecturerResponse] = None
    time_slot: Optional[TimeSlotResponse] = None

    class Config:
        from_attributes = True

# Course
class CourseBase(BaseModel):
    code: str = Field(..., max_length=20)
    name: str = Field(..., max_length=150)
    credits: int = Field(..., ge=1, le=6)
    semester: int = Field(..., ge=1, le=8)
    course_type: str = Field(default="THEORY", description="THEORY or LABORATORY")
    kbk: str = Field(default="GENERAL", description="GENERAL, PEMROGRAMAN, MULTIMEDIA, IOT")

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    code: Optional[str] = Field(None, max_length=20)
    name: Optional[str] = Field(None, max_length=150)
    credits: Optional[int] = Field(None, ge=1, le=6)
    semester: Optional[int] = Field(None, ge=1, le=8)
    course_type: Optional[str] = None
    kbk: Optional[str] = None

class CourseResponse(CourseBase):
    id: UUID

    class Config:
        from_attributes = True

# AcademicClass
class AcademicClassBase(BaseModel):
    course_id: UUID
    lecturer_id: UUID
    class_name: str = Field(..., max_length=50)
    semester: int = Field(..., ge=1, le=8)
    cohort: str = Field(default="A", max_length=10)
    kbk: str = Field(default="GENERAL", description="GENERAL, PEMROGRAMAN, MULTIMEDIA, IOT")
    student_count: int = Field(..., gt=0)
    academic_year: str = Field(default="2026/2027", max_length=10)
    semester_type: str = Field(default="ODD", description="ODD or EVEN")

class AcademicClassCreate(AcademicClassBase):
    pass

class AcademicClassUpdate(BaseModel):
    course_id: Optional[UUID] = None
    lecturer_id: Optional[UUID] = None
    class_name: Optional[str] = Field(None, max_length=50)
    semester: Optional[int] = Field(None, ge=1, le=8)
    cohort: Optional[str] = None
    kbk: Optional[str] = None
    student_count: Optional[int] = Field(None, gt=0)
    academic_year: Optional[str] = None
    semester_type: Optional[str] = None

class AcademicClassResponse(AcademicClassBase):
    id: UUID
    course: Optional[CourseResponse] = None
    lecturer: Optional[LecturerResponse] = None

    class Config:
        from_attributes = True
