from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.master import AcademicClass, Course, Room, TimeSlot, Lecturer
from app.schemas.schedule import PreCheckResponse

router = APIRouter(prefix="/conflicts", tags=["Conflicts & Feasibility"])

def run_feasibility_check(db: Session, academic_year: str = "2026/2027", semester_type: str = "ODD") -> Dict[str, Any]:
    """
    Performs comprehensive pre-execution feasibility check:
    1. Room count & slot capacity for THEORY and LABORATORY.
    2. Lecturer weekly teaching workload vs total slots.
    3. Room capacity vs student count for each class.
    """
    classes = db.query(AcademicClass).filter(
        AcademicClass.academic_year == academic_year,
        AcademicClass.semester_type == semester_type
    ).all()

    rooms = db.query(Room).filter(Room.is_active == True).all()
    time_slots = db.query(TimeSlot).all()
    lecturers = db.query(Lecturer).all()

    total_classes = len(classes)
    total_slots = len(time_slots)
    total_rooms = len(rooms)

    theory_rooms = [r for r in rooms if r.room_type == "THEORY"]
    lab_rooms = [r for r in rooms if r.room_type == "LABORATORY"]

    theory_classes = [c for c in classes if c.course.course_type == "THEORY"]
    lab_classes = [c for c in classes if c.course.course_type == "LABORATORY"]

    capacity_issues: List[str] = []
    lecturer_workload_issues: List[str] = []

    # 1. Slot space feasibility
    max_theory_capacity = len(theory_rooms) * total_slots
    max_lab_capacity = len(lab_rooms) * total_slots

    if len(theory_classes) > max_theory_capacity:
        capacity_issues.append(
            f"Kapasitas ruangan Teori tidak mencukupi: Total {len(theory_classes)} kelas teori melebihi kapasitas maksimum ({max_theory_capacity} slot)."
        )

    if len(lab_classes) > max_lab_capacity:
        capacity_issues.append(
            f"Kapasitas Laboratorium tidak mencukupi: Total {len(lab_classes)} sesi praktikum melebihi kapasitas laboratorium ({max_lab_capacity} slot)."
        )

    # 2. Check if every class has at least one valid room (HC4 & HC5)
    for c in classes:
        valid_rooms = [
            r for r in rooms 
            if r.room_type == c.course.course_type and r.capacity >= c.student_count
        ]
        if not valid_rooms:
            capacity_issues.append(
                f"Kelas '{c.class_name}' ({c.student_count} mhs, tipe {c.course.course_type}) tidak memiliki ruangan yang sesuai kapasitas atau tipe."
            )

    # 3. Check lecturer teaching load
    for lec in lecturers:
        lec_classes = [c for c in classes if c.lecturer_id == lec.id]
        if len(lec_classes) > total_slots:
            lecturer_workload_issues.append(
                f"Beban dosen '{lec.name}' ({len(lec_classes)} kelas) melebihi total slot waktu mingguan ({total_slots} slot)."
            )

    is_feasible = (len(capacity_issues) == 0 and len(lecturer_workload_issues) == 0)

    return {
        "is_feasible": is_feasible,
        "total_classes": total_classes,
        "total_theory_classes": len(theory_classes),
        "total_lab_classes": len(lab_classes),
        "total_time_slots": total_slots,
        "total_rooms": total_rooms,
        "capacity_issues": capacity_issues,
        "lecturer_workload_issues": lecturer_workload_issues,
        "message": "Semua batasan awal terpenuhi. Data master layak untuk dioptimasi GA." if is_feasible else "Terdapat kendala kelayakan data master."
    }

@router.get("/pre-check", response_model=PreCheckResponse)
def pre_execution_check(
    academic_year: str = "2026/2027",
    semester_type: str = "ODD",
    db: Session = Depends(get_db)
):
    """
    Pre-feasibility validation endpoint before triggering GA engine.
    """
    result = run_feasibility_check(db, academic_year, semester_type)
    if not result["is_feasible"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Validasi kelayakan gagal. Data master tidak dapat dijadwalkan tanpa bentrok mutlak.",
                "capacity_issues": result["capacity_issues"],
                "lecturer_workload_issues": result["lecturer_workload_issues"]
            }
        )
    return {
        "status": "success",
        **result
    }
