import uuid
import threading
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models.schedule import ScheduleJob, Schedule
from app.models.master import AcademicClass, Room, TimeSlot, Lecturer, Course, LecturerTimePreference
from collections import defaultdict
from app.schemas.schedule import (
    GenerateScheduleRequest, GenerateScheduleResponse, GenerateScheduleResponseData,
    JobStatusResponse, JobStatusData, ScheduleResultResponse, ScheduleItemResponse,
    ManualSwapRequest, ManualSwapResponse, JobValidationResponse, ValidationConflictBreakdown
)
from app.api.conflicts import run_feasibility_check
from app.tasks import run_ga_optimization_task, execute_optimization
from app.exporter import export_schedule_excel, export_schedule_pdf

import socket
from urllib.parse import urlparse
from app.config import settings

def is_celery_broker_available() -> bool:
    try:
        parsed = urlparse(settings.CELERY_BROKER_URL)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 6379
        with socket.create_connection((host, port), timeout=0.15):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False

router = APIRouter(prefix="/schedules", tags=["Schedules & Optimization"])

@router.post("/generate", response_model=GenerateScheduleResponse, status_code=status.HTTP_202_ACCEPTED)
def generate_schedule(
    request: GenerateScheduleRequest,
    db: Session = Depends(get_db)
):
    """
    Triggers asynchronous schedule optimization using Genetic Algorithm.
    First runs pre-execution feasibility check.
    """
    # 1. Pre-execution feasibility check (PRD 7.1)
    feasibility = run_feasibility_check(db, request.academic_year, request.semester_type)
    if not feasibility["is_feasible"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "message": "Validasi kelayakan gagal. Komputasi GA tidak dapat dimulai.",
                "capacity_issues": feasibility["capacity_issues"],
                "lecturer_workload_issues": feasibility["lecturer_workload_issues"]
            }
        )

    # 2. Create schedule_jobs entry
    params = request.parameters or {}
    params_dict = params.model_dump() if hasattr(params, "model_dump") else dict(params)
    
    new_job = ScheduleJob(
        id=uuid.uuid4(),
        academic_year=request.academic_year,
        semester_type=request.semester_type,
        status="PENDING",
        is_published=False,
        progress_percentage=0,
        current_generation=0,
        max_generations=params_dict.get("max_generations", 500),
        best_fitness=0.0,
        hard_conflicts_count=0,
        soft_conflicts_count=0
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    # 3. Dispatch task to Celery with fallback to asyncio background thread
    job_id_str = str(new_job.id)
    dispatched = False

    if is_celery_broker_available():
        try:
            # Try Celery async dispatch with no-retry
            run_ga_optimization_task.apply_async(
                args=[job_id_str, params_dict],
                retry=False,
                expires=10
            )
            dispatched = True
            print(f"[INFO] Dispatched job {job_id_str} to Celery worker.")
        except Exception as e:
            print(f"[INFO] Celery broker not reachable ({e}). Falling back to background executor thread.")

    if not dispatched:
        # Local background thread fallback (PRD 3.2 resilient anti-timeout)
        print(f"[INFO] Running job {job_id_str} via local background thread.")
        threading.Thread(target=execute_optimization, args=(job_id_str, params_dict), daemon=True).start()

    return {
        "status": "success",
        "message": "Proses optimasi penjadwalan berhasil dijadwalkan ke antrean.",
        "data": {
            "job_id": new_job.id,
            "status": new_job.status,
            "created_at": new_job.created_at
        }
    }

@router.get("/jobs/{job_id}/status", response_model=JobStatusResponse)
def get_job_status(job_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Polling endpoint for GA progress indicator.
    """
    job = db.query(ScheduleJob).filter(ScheduleJob.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pekerjaan penjadwalan dengan ID {job_id} tidak ditemukan."
        )

    # Calculate estimated remaining seconds based on progress
    estimated_remaining = 0.0
    if job.status == "RUNNING" and job.progress_percentage > 0:
        elapsed = (job.updated_at - job.created_at).total_seconds()
        total_estimated = (elapsed / (job.progress_percentage / 100.0))
        estimated_remaining = max(1.0, round(total_estimated - elapsed, 1))

    return {
        "status": "success",
        "data": {
            "job_id": job.id,
            "status": job.status,
            "progress_percentage": job.progress_percentage,
            "current_generation": job.current_generation,
            "max_generations": job.max_generations,
            "best_fitness": job.best_fitness,
            "hard_conflicts_count": job.hard_conflicts_count,
            "soft_conflicts_count": job.soft_conflicts_count,
            "estimated_remaining_seconds": estimated_remaining,
            "execution_time_seconds": job.execution_time_seconds,
            "error_message": job.error_message,
            "is_published": job.is_published
        }
    }

@router.get("/jobs/{job_id}/result", response_model=ScheduleResultResponse)
def get_schedule_result(
    job_id: uuid.UUID,
    semester: Optional[int] = Query(None, description="Filter by semester 1-8"),
    kbk: Optional[str] = Query(None, description="Filter by GENERAL, PEMROGRAMAN, MULTIMEDIA, IOT"),
    lecturer_id: Optional[uuid.UUID] = Query(None, description="Filter by lecturer ID"),
    room_id: Optional[uuid.UUID] = Query(None, description="Filter by room ID"),
    db: Session = Depends(get_db)
):
    """
    Fetches the schedule matrix items for a completed job, supporting filters.
    """
    job = db.query(ScheduleJob).filter(ScheduleJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Pekerjaan tidak ditemukan.")

    query = db.query(Schedule).filter(Schedule.job_id == job_id)
    
    if semester is not None:
        query = query.join(AcademicClass).filter(AcademicClass.semester == semester)
    if kbk:
        if not semester:
            query = query.join(AcademicClass)
        query = query.filter(AcademicClass.kbk == kbk)
    if lecturer_id and str(lecturer_id).strip():
        if not semester and not kbk:
            query = query.join(AcademicClass)
        query = query.filter(AcademicClass.lecturer_id == lecturer_id)
    if room_id and str(room_id).strip():
        query = query.filter(Schedule.room_id == room_id)

    schedules = query.all()

    # Preload preferences for soft-constraint annotations
    prefs = db.query(LecturerTimePreference).all()
    preferred_map = {
        (p.lecturer_id, p.time_slot_id): p.preference_type 
        for p in prefs
    }
    lecturers_with_pref = {p.lecturer_id for p in prefs if p.preference_type == "PREFERRED"}

    items: List[ScheduleItemResponse] = []
    for s in schedules:
        c = s.academic_class
        crs = c.course
        lec = c.lecturer
        rm = s.room
        ts = s.time_slot

        # Soft penalty notes
        penalty_reasons = []
        is_pref = True
        if lec.id in lecturers_with_pref:
            if preferred_map.get((lec.id, ts.id)) != "PREFERRED":
                is_pref = False
                penalty_reasons.append("Di luar preferensi waktu mengajar dosen")

        items.append(ScheduleItemResponse(
            id=s.id,
            job_id=s.job_id,
            class_id=c.id,
            class_name=c.class_name,
            semester=c.semester,
            cohort=c.cohort,
            kbk=c.kbk,
            student_count=c.student_count,
            academic_year=c.academic_year,
            semester_type=c.semester_type,
            course_id=crs.id,
            course_code=crs.code,
            course_name=crs.name,
            credits=crs.credits,
            course_type=crs.course_type,
            lecturer_id=lec.id,
            lecturer_nidn=lec.nidn or "-",
            lecturer_name=lec.name,
            room_id=rm.id,
            room_code=rm.code,
            room_name=rm.name,
            room_capacity=rm.capacity,
            room_type=rm.room_type,
            time_slot_id=ts.id,
            day_of_week=ts.day_of_week,
            period_order=ts.period_order,
            start_time=ts.start_time,
            end_time=ts.end_time,
            is_preferred_slot=is_pref,
            soft_penalty_reasons=penalty_reasons,
            is_conflict=s.is_conflict
        ))

    return {
        "status": "success",
        "total_items": len(items),
        "data": items
    }

def validate_job_internal(job_id: uuid.UUID, db: Session) -> dict:
    job = db.query(ScheduleJob).filter(ScheduleJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Pekerjaan dengan ID {job_id} tidak ditemukan.")

    schedules = db.query(Schedule).filter(Schedule.job_id == job_id).all()
    if not schedules:
        return {
            "status": "success",
            "job_id": job.id,
            "is_valid": False,
            "hard_conflicts_count": 0,
            "soft_conflicts_count": 0,
            "conflicts_by_type": {
                "hc1_lecturer_clash": 0,
                "hc2_room_clash": 0,
                "hc3_cohort_clash": 0,
                "hc4_capacity_deficit": 0,
                "hc5_room_type_mismatch": 0,
                "hc6_lecturer_unavailable": 0
            },
            "conflict_details": ["Belum ada data jadwal yang tersimpan untuk pekerjaan ini."],
            "message": "Belum ada jadwal yang tersimpan."
        }

    # Fetch latest master data
    classes_map = {c.id: c for c in db.query(AcademicClass).all()}
    rooms_map = {r.id: r for r in db.query(Room).all()}
    slots_map = {s.id: s for s in db.query(TimeSlot).all()}
    prefs_map = {(p.lecturer_id, p.time_slot_id): p.preference_type for p in db.query(LecturerTimePreference).all()}
    preferred_slots_by_lec = defaultdict(set)
    lecs_with_preferred = set()
    for (l_id, s_id), p_type in prefs_map.items():
        if p_type == "PREFERRED":
            lecs_with_preferred.add(l_id)
            preferred_slots_by_lec[l_id].add(s_id)

    hc1_lecturer_clash = 0
    hc2_room_clash = 0
    hc3_cohort_clash = 0
    hc4_capacity_deficit = 0
    hc5_room_type_mismatch = 0
    hc6_lecturer_unavailable = 0

    sc1_pref_penalty = 0
    cohort_day_periods = defaultdict(lambda: defaultdict(list))
    lecturer_day_sessions = defaultdict(lambda: defaultdict(int))

    conflict_details: List[str] = []

    lec_slot_usage = defaultdict(list)
    room_slot_usage = defaultdict(list)
    slot_cohort_usage = defaultdict(list)

    for s in schedules:
        c = classes_map.get(s.class_id)
        r = rooms_map.get(s.room_id)
        ts = slots_map.get(s.time_slot_id)

        if not c or not r or not ts:
            conflict_details.append(f"Data master referensi jadwal ID {s.id} tidak lengkap/terhapus.")
            continue

        lec_slot_usage[(c.lecturer_id, s.time_slot_id)].append((s, c))
        room_slot_usage[(s.room_id, s.time_slot_id)].append((s, c, r))
        slot_cohort_usage[(s.time_slot_id, c.semester, c.cohort)].append((s, c))

        # HC4: Room capacity
        if r.capacity < c.student_count:
            hc4_capacity_deficit += 1
            conflict_details.append(
                f"HC4: Kapasitas ruang {r.code} ({r.capacity} kursi) kurang untuk kelas '{c.class_name}' ({c.student_count} mahasiswa)."
            )

        # HC5: Room type
        if r.room_type != c.course.course_type:
            hc5_room_type_mismatch += 1
            conflict_details.append(
                f"HC5: Tipe ruang {r.code} ({r.room_type}) tidak sesuai tipe mata kuliah '{c.course.name}' ({c.course.course_type})."
            )

        # HC6: Lecturer unavailable
        if prefs_map.get((c.lecturer_id, s.time_slot_id)) == "UNAVAILABLE":
            hc6_lecturer_unavailable += 1
            conflict_details.append(
                f"HC6: Dosen {c.lecturer.name} berhalangan hadir pada slot waktu kelas '{c.class_name}'."
            )

        # SC1: Preferred slot
        if c.lecturer_id in lecs_with_preferred:
            if s.time_slot_id not in preferred_slots_by_lec[c.lecturer_id]:
                sc1_pref_penalty += 1

        cohort_day_periods[(c.semester, c.cohort, c.kbk)][ts.day_of_week].append(ts.period_order)
        lecturer_day_sessions[c.lecturer_id][ts.day_of_week] += 1

    # Sum HC1
    for (lec_id, slot_id), items_list in lec_slot_usage.items():
        if len(items_list) > 1:
            hc1_lecturer_clash += (len(items_list) - 1)
            lec_name = items_list[0][1].lecturer.name
            c_names = ", ".join([it[1].class_name for it in items_list])
            conflict_details.append(
                f"HC1: Dosen {lec_name} mengajar {len(items_list)} kelas bersamaan: {c_names}"
            )

    # Sum HC2
    for (room_id, slot_id), items_list in room_slot_usage.items():
        if len(items_list) > 1:
            hc2_room_clash += (len(items_list) - 1)
            rm_code = items_list[0][2].code
            c_names = ", ".join([it[1].class_name for it in items_list])
            conflict_details.append(
                f"HC2: Ruang {rm_code} digunakan bersamaan oleh {len(items_list)} kelas: {c_names}"
            )

    # Sum HC3: Cohort & KBK parallel rules
    for (slot_id, sem, coh), items_list in slot_cohort_usage.items():
        n = len(items_list)
        if n > 1:
            for i in range(n):
                for j in range(i + 1, n):
                    s_i, c_i = items_list[i]
                    s_j, c_j = items_list[j]
                    if c_i.kbk == c_j.kbk or c_i.kbk == "GENERAL" or c_j.kbk == "GENERAL":
                        hc3_cohort_clash += 1
                        conflict_details.append(
                            f"HC3: Bentrok rombel mahasiswa Sem {sem} Kelas {coh}: '{c_i.class_name}' vs '{c_j.class_name}'"
                        )

    total_hard = (
        hc1_lecturer_clash
        + hc2_room_clash
        + hc3_cohort_clash
        + hc4_capacity_deficit
        + hc5_room_type_mismatch
        + hc6_lecturer_unavailable
    )

    # Soft constraints sum
    sc2_gap_penalty = 0
    for group_key, days_dict in cohort_day_periods.items():
        for day, periods in days_dict.items():
            if len(periods) > 1:
                sorted_periods = sorted(periods)
                for idx in range(len(sorted_periods) - 1):
                    gap = sorted_periods[idx + 1] - sorted_periods[idx] - 1
                    if gap > 0:
                        sc2_gap_penalty += gap

    sc3_overload_penalty = 0
    for lec_id, days_dict in lecturer_day_sessions.items():
        for day, sessions_count in days_dict.items():
            if sessions_count > 3:
                sc3_overload_penalty += (sessions_count - 3)

    total_soft = sc1_pref_penalty + sc2_gap_penalty + sc3_overload_penalty

    # Update job fields if different
    if job.hard_conflicts_count != total_hard or job.soft_conflicts_count != total_soft:
        job.hard_conflicts_count = total_hard
        job.soft_conflicts_count = total_soft
        db.commit()

    is_valid = (total_hard == 0)
    msg = "Jadwal valid dan 100% bebas bentrok mutlak (Zero Hard Conflicts)." if is_valid else f"Jadwal memiliki {total_hard} bentrok mutlak."

    return {
        "status": "success",
        "job_id": job.id,
        "is_valid": is_valid,
        "hard_conflicts_count": total_hard,
        "soft_conflicts_count": total_soft,
        "conflicts_by_type": {
            "hc1_lecturer_clash": hc1_lecturer_clash,
            "hc2_room_clash": hc2_room_clash,
            "hc3_cohort_clash": hc3_cohort_clash,
            "hc4_capacity_deficit": hc4_capacity_deficit,
            "hc5_room_type_mismatch": hc5_room_type_mismatch,
            "hc6_lecturer_unavailable": hc6_lecturer_unavailable,
        },
        "conflict_details": conflict_details,
        "message": msg
    }

@router.get("/jobs/{job_id}/validate", response_model=JobValidationResponse)
def validate_job(job_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Validates a schedule job against latest master data (HC1-HC6) and returns conflict breakdown.
    """
    return validate_job_internal(job_id, db)

@router.patch("/jobs/{job_id}/publish")
def publish_schedule(job_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Sets the schedule job as the officially published schedule after validating against latest master data.
    """
    job = db.query(ScheduleJob).filter(ScheduleJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Pekerjaan tidak ditemukan.")

    validation = validate_job_internal(job_id, db)
    if not validation["is_valid"]:
        first_few = "; ".join(validation["conflict_details"][:3])
        raise HTTPException(
            status_code=400,
            detail=f"Jadwal tidak dapat dipublikasikan karena memiliki {validation['hard_conflicts_count']} bentrok mutlak: {first_few}"
        )

    # Set all other jobs in same year & sem as unpublished
    db.query(ScheduleJob).filter(
        ScheduleJob.academic_year == job.academic_year,
        ScheduleJob.semester_type == job.semester_type,
        ScheduleJob.id != job.id
    ).update({"is_published": False})

    job.is_published = True
    db.commit()

    return {
        "status": "success",
        "message": "Jadwal kuliah berhasil divalidasi dan ditetapkan sebagai jadwal resmi aktif (is_published = True)."
    }

@router.post("/{schedule_id}/manual-swap", response_model=ManualSwapResponse)
def manual_swap(
    schedule_id: uuid.UUID,
    payload: ManualSwapRequest,
    db: Session = Depends(get_db)
):
    """
    Post-generation manual swap (PRD 7.4):
    Validates HC1 - HC6 before applying swap. Rejects with 409 Conflict if conflict arises.
    """
    target_sch = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not target_sch:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan.")

    job_id = target_sch.job_id
    new_room = db.query(Room).filter(Room.id == payload.new_room_id).first()
    new_slot = db.query(TimeSlot).filter(TimeSlot.id == payload.new_time_slot_id).first()

    if not new_room or not new_slot:
        raise HTTPException(status_code=404, detail="Ruangan atau slot waktu baru tidak valid.")

    target_class = target_sch.academic_class
    conflicts: List[str] = []

    # 1. HC4: Room capacity
    if new_room.capacity < target_class.student_count:
        conflicts.append(
            f"HC4: Kapasitas ruangan {new_room.code} ({new_room.capacity} kursi) kurang dari jumlah mahasiswa ({target_class.student_count})."
        )

    # 2. HC5: Room type match
    if new_room.room_type != target_class.course.course_type:
        conflicts.append(
            f"HC5: Tipe ruangan {new_room.code} ({new_room.room_type}) tidak cocok dengan tipe mata kuliah ({target_class.course.course_type})."
        )

    # 3. HC6: Lecturer unavailable
    lec_pref = db.query(LecturerTimePreference).filter(
        LecturerTimePreference.lecturer_id == target_class.lecturer_id,
        LecturerTimePreference.time_slot_id == new_slot.id,
        LecturerTimePreference.preference_type == "UNAVAILABLE"
    ).first()
    if lec_pref:
        conflicts.append(
            f"HC6: Dosen {target_class.lecturer.name} berhalangan hadir pada slot waktu ini ({lec_pref.reason or 'UNAVAILABLE'})."
        )

    # Fetch other schedules in the same job at the new slot
    other_schedules_at_slot = db.query(Schedule).filter(
        Schedule.job_id == job_id,
        Schedule.time_slot_id == new_slot.id,
        Schedule.id != target_sch.id
    ).all()

    for other in other_schedules_at_slot:
        other_class = other.academic_class
        # HC1: Lecturer clash
        if other_class.lecturer_id == target_class.lecturer_id:
            conflicts.append(
                f"HC1: Dosen {target_class.lecturer.name} bentrok mengajar kelas lain ({other_class.class_name}) pada slot waktu yang sama."
            )

        # HC2: Room clash
        if other.room_id == new_room.id:
            conflicts.append(
                f"HC2: Ruangan {new_room.code} sudah digunakan oleh kelas '{other_class.class_name}' pada slot waktu yang sama."
            )

        # HC3: Cohort & KBK parallel rules
        if other_class.semester == target_class.semester and other_class.cohort == target_class.cohort:
            if other_class.kbk == target_class.kbk or other_class.kbk == "GENERAL" or target_class.kbk == "GENERAL":
                conflicts.append(
                    f"HC3: Bentrok rombel mahasiswa dengan kelas '{other_class.class_name}' (Semester {other_class.semester}, Kelas {other_class.cohort}, KBK {other_class.kbk})."
                )

    if conflicts:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Penyesuaian manual ditolak karena memicu pelanggaran aturan mutlak (Hard Constraints).",
                "conflicts": conflicts
            }
        )

    # If valid, apply swap
    target_sch.room_id = new_room.id
    target_sch.time_slot_id = new_slot.id
    db.commit()
    db.refresh(target_sch)

    c = target_sch.academic_class
    crs = c.course
    lec = c.lecturer

    response_item = ScheduleItemResponse(
        id=target_sch.id,
        job_id=target_sch.job_id,
        class_id=c.id,
        class_name=c.class_name,
        semester=c.semester,
        cohort=c.cohort,
        kbk=c.kbk,
        student_count=c.student_count,
        academic_year=c.academic_year,
        semester_type=c.semester_type,
        course_id=crs.id,
        course_code=crs.code,
        course_name=crs.name,
        credits=crs.credits,
        course_type=crs.course_type,
        lecturer_id=lec.id,
        lecturer_nidn=lec.nidn or "-",
        lecturer_name=lec.name,
        room_id=new_room.id,
        room_code=new_room.code,
        room_name=new_room.name,
        room_capacity=new_room.capacity,
        room_type=new_room.room_type,
        time_slot_id=new_slot.id,
        day_of_week=new_slot.day_of_week,
        period_order=new_slot.period_order,
        start_time=new_slot.start_time,
        end_time=new_slot.end_time,
        is_preferred_slot=True,
        soft_penalty_reasons=[]
    )

    return {
        "status": "success",
        "message": "Perubahan jadwal berhasil divalidasi dan disimpan.",
        "data": response_item
    }

@router.get("/jobs/{job_id}/export")
def export_schedule(
    job_id: uuid.UUID,
    format: str = Query("excel", pattern="^(excel|pdf)$"),
    db: Session = Depends(get_db)
):
    """
    Downloads published schedule in Excel (.xlsx) or PDF (.pdf) format.
    """
    job = db.query(ScheduleJob).filter(ScheduleJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Pekerjaan tidak ditemukan.")

    schedules = db.query(Schedule).filter(Schedule.job_id == job_id).all()
    if not schedules:
        raise HTTPException(status_code=404, detail="Belum ada data jadwal untuk pekerjaan ini.")

    schedules_data = []
    for s in schedules:
        c = s.academic_class
        schedules_data.append({
            "day_of_week": s.time_slot.day_of_week,
            "period_order": s.time_slot.period_order,
            "start_time": s.time_slot.start_time,
            "end_time": s.time_slot.end_time,
            "course_code": c.course.code,
            "course_name": c.course.name,
            "credits": c.course.credits,
            "semester": c.semester,
            "class_name": c.class_name,
            "kbk": c.kbk,
            "lecturer_name": c.lecturer.name,
            "room_code": s.room.code,
            "room_name": s.room.name
        })

    job_info = {
        "academic_year": job.academic_year,
        "semester_type": job.semester_type,
        "best_fitness": job.best_fitness
    }

    if format == "excel":
        file_stream = export_schedule_excel(job_info, schedules_data)
        filename = f"Jadwal_Kuliah_UBBG_{job.academic_year.replace('/', '-')}_{job.semester_type}.xlsx"
        return StreamingResponse(
            file_stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    else:
        file_stream = export_schedule_pdf(job_info, schedules_data)
        filename = f"Jadwal_Kuliah_UBBG_{job.academic_year.replace('/', '-')}_{job.semester_type}.pdf"
        return StreamingResponse(
            file_stream,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

@router.get("/jobs")
def list_schedule_jobs(db: Session = Depends(get_db)):
    """
    List all recent schedule generation jobs.
    """
    jobs = db.query(ScheduleJob).order_by(ScheduleJob.created_at.desc()).limit(20).all()
    return {
        "status": "success",
        "data": [
            {
                "id": str(j.id),
                "academic_year": j.academic_year,
                "semester_type": j.semester_type,
                "status": j.status,
                "is_published": j.is_published,
                "is_valid": (j.hard_conflicts_count == 0 and j.status == "COMPLETED"),
                "progress_percentage": j.progress_percentage,
                "current_generation": j.current_generation,
                "max_generations": j.max_generations,
                "best_fitness": j.best_fitness,
                "hard_conflicts_count": j.hard_conflicts_count,
                "soft_conflicts_count": j.soft_conflicts_count,
                "execution_time_seconds": j.execution_time_seconds,
                "created_at": j.created_at,
                "updated_at": j.updated_at
            }
            for j in jobs
        ]
    }
