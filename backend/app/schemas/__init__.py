from app.schemas.master import (
    LecturerBase, LecturerCreate, LecturerUpdate, LecturerResponse,
    RoomBase, RoomCreate, RoomUpdate, RoomResponse,
    TimeSlotBase, TimeSlotCreate, TimeSlotUpdate, TimeSlotResponse,
    LecturerPreferenceBase, LecturerPreferenceCreate, LecturerPreferenceUpdate, LecturerPreferenceResponse,
    CourseBase, CourseCreate, CourseUpdate, CourseResponse,
    AcademicClassBase, AcademicClassCreate, AcademicClassUpdate, AcademicClassResponse
)
from app.schemas.schedule import (
    GAParameters, GenerateScheduleRequest, GenerateScheduleResponse,
    JobStatusResponse, ScheduleItemResponse, ScheduleResultResponse,
    ManualSwapRequest, ManualSwapResponse, PreCheckResponse, ConflictItem
)

__all__ = [
    "LecturerBase", "LecturerCreate", "LecturerUpdate", "LecturerResponse",
    "RoomBase", "RoomCreate", "RoomUpdate", "RoomResponse",
    "TimeSlotBase", "TimeSlotCreate", "TimeSlotUpdate", "TimeSlotResponse",
    "LecturerPreferenceBase", "LecturerPreferenceCreate", "LecturerPreferenceUpdate", "LecturerPreferenceResponse",
    "CourseBase", "CourseCreate", "CourseUpdate", "CourseResponse",
    "AcademicClassBase", "AcademicClassCreate", "AcademicClassUpdate", "AcademicClassResponse",
    "GAParameters", "GenerateScheduleRequest", "GenerateScheduleResponse",
    "JobStatusResponse", "ScheduleItemResponse", "ScheduleResultResponse",
    "ManualSwapRequest", "ManualSwapResponse", "PreCheckResponse", "ConflictItem"
]
