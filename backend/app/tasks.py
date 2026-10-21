import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.celery_app import celery_app
from app.database import SessionLocal
from app.models.master import AcademicClass, Room, TimeSlot, LecturerTimePreference, Lecturer, Course
from app.models.schedule import ScheduleJob, Schedule
from app.ga.chromosome import ProblemContext, ClassInfo, RoomInfo, TimeSlotInfo
from app.ga.engine import GAEngine

def build_problem_context(db: Session, academic_year: str, semester_type: str) -> ProblemContext:
    classes_db = db.query(AcademicClass).filter(
        AcademicClass.academic_year == academic_year,
        AcademicClass.semester_type == semester_type
    ).all()

    rooms_db = db.query(Room).filter(Room.is_active == True).all()
    slots_db = db.query(TimeSlot).all()
    prefs_db = db.query(LecturerTimePreference).all()

    class_infos = [
        ClassInfo(
            class_id=c.id,
            class_name=c.class_name,
            course_id=c.course.id,
            course_code=c.course.code,
            course_name=c.course.name,
            credits=c.course.credits,
            semester=c.semester,
            cohort=c.cohort,
            kbk=c.kbk,
            student_count=c.student_count,
            course_type=c.course.course_type,
            lecturer_id=c.lecturer.id,
            lecturer_name=c.lecturer.name,
            lecturer_nidn=c.lecturer.nidn,
        )
        for c in classes_db
    ]

    room_infos = [
        RoomInfo(
            room_id=r.id,
            code=r.code,
            name=r.name,
            capacity=r.capacity,
            room_type=r.room_type,
        )
        for r in rooms_db
    ]

    slot_infos = [
        TimeSlotInfo(
            time_slot_id=s.id,
            day_of_week=s.day_of_week,
            period_order=s.period_order,
            start_time=s.start_time,
            end_time=s.end_time,
        )
        for s in slots_db
    ]

    prefs_map = {
        (p.lecturer_id, p.time_slot_id): p.preference_type
        for p in prefs_db
    }

    return ProblemContext(
        classes=class_infos,
        rooms=room_infos,
        time_slots=slot_infos,
        preferences=prefs_map,
    )

def execute_optimization(job_id_str: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Core executor function called either by Celery worker or async background thread.
    """
    job_uuid = uuid.UUID(job_id_str)
    db: Session = SessionLocal()
    try:
        job = db.query(ScheduleJob).filter(ScheduleJob.id == job_uuid).first()
        if not job:
            raise ValueError(f"Job with id {job_id_str} not found in database.")

        # Update job to RUNNING
        job.status = "RUNNING"
        job.progress_percentage = 5
        db.commit()

        # Build in-memory context
        context = build_problem_context(db, job.academic_year, job.semester_type)
        if len(context.class_list) == 0:
            raise ValueError("Tidak ada kelas perkuliahan yang ditemukan untuk semester dan tahun akademik yang dipilih.")

        # Prepare progress callback
        def on_progress(current_gen: int, max_gen: int, best_fit: float, hard_c: int, soft_c: int):
            try:
                sub_db = SessionLocal()
                j = sub_db.query(ScheduleJob).filter(ScheduleJob.id == job_uuid).first()
                if j:
                    pct = int((current_gen / max_gen) * 90) + 5
                    j.progress_percentage = min(98, max(5, pct))
                    j.current_generation = current_gen
                    j.best_fitness = round(best_fit, 6)
                    j.hard_conflicts_count = hard_c
                    j.soft_conflicts_count = soft_c
                    j.updated_at = datetime.now(timezone.utc)
                    sub_db.commit()
                sub_db.close()
            except Exception as e:
                print(f"[WARN] Failed to update progress: {e}")

        # Initialize GA Engine
        engine = GAEngine(
            context=context,
            population_size=params.get("population_size", 100),
            max_generations=params.get("max_generations", 500),
            crossover_rate=params.get("crossover_rate", 0.85),
            mutation_rate=params.get("mutation_rate", 0.08),
            elitism_count=params.get("elitism_count", 2),
            progress_callback=on_progress
        )

        # Run optimization
        result = engine.run()
        best_chromosome = result["best_chromosome"]

        # Transactional persist of generated schedule
        # First clear old schedules for this job if any
        db.query(Schedule).filter(Schedule.job_id == job_uuid).delete()

        used_room_slots = set()
        for gene in best_chromosome.genes:
            key = (gene.room_id, gene.time_slot_id)
            if key in used_room_slots:
                continue
            used_room_slots.add(key)
            sch = Schedule(
                id=uuid.uuid4(),
                job_id=job_uuid,
                class_id=gene.class_id,
                room_id=gene.room_id,
                time_slot_id=gene.time_slot_id
            )
            db.add(sch)

        # Mark job COMPLETED
        job.status = "COMPLETED"
        job.progress_percentage = 100
        job.current_generation = result["final_generation"]
        job.best_fitness = round(result["best_fitness"], 6)
        job.hard_conflicts_count = result["hard_conflicts"]
        job.soft_conflicts_count = result["soft_conflicts"]
        job.execution_time_seconds = round(result["execution_time_seconds"], 2)
        job.error_message = None
        job.updated_at = datetime.now(timezone.utc)
        db.commit()

        return {
            "status": "COMPLETED",
            "job_id": job_id_str,
            "best_fitness": result["best_fitness"],
            "hard_conflicts": result["hard_conflicts"],
            "soft_conflicts": result["soft_conflicts"],
            "execution_time_seconds": result["execution_time_seconds"]
        }

    except Exception as e:
        db.rollback()
        try:
            job = db.query(ScheduleJob).filter(ScheduleJob.id == job_uuid).first()
            if job:
                job.status = "FAILED"
                job.error_message = str(e)
                job.updated_at = datetime.now(timezone.utc)
                db.commit()
        except Exception:
            pass
        print(f"[ERROR] Optimization task failed: {e}")
        raise e
    finally:
        db.close()

@celery_app.task(name="app.tasks.run_ga_optimization_task")
def run_ga_optimization_task(job_id_str: str, params: Dict[str, Any]):
    """
    Celery background worker entry point.
    """
    return execute_optimization(job_id_str, params)
