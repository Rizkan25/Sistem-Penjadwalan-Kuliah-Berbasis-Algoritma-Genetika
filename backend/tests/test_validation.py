import uuid
import pytest
from fastapi import HTTPException
from app.database import SessionLocal
from app.models.schedule import ScheduleJob, Schedule
from app.models.master import AcademicClass, Room, TimeSlot
from app.api.schedules import validate_job_internal, publish_schedule
from app.tasks import execute_optimization

def test_validation_endpoint_and_publish_flow():
    """
    Test validasi:
    - Menghitung ulang HC1-HC6 terhadap data master terbaru
    - publish_schedule berhasil jika 0 HC
    - publish_schedule ditolak jika ada HC
    """
    db = SessionLocal()
    academic_year = "2026/2027"
    semester_type = "ODD"

    # 1. Run optimization to create a valid job
    job_id = uuid.uuid4()
    job = ScheduleJob(
        id=job_id,
        academic_year=academic_year,
        semester_type=semester_type,
        status="PENDING",
        is_published=False,
        max_generations=20
    )
    db.add(job)
    db.commit()

    try:
        execute_optimization(str(job_id), {"population_size": 30, "max_generations": 20})

        # Validate job
        val = validate_job_internal(job_id, db)
        assert val["status"] == "success"
        assert "conflicts_by_type" in val
        assert val["is_valid"] is True
        assert val["hard_conflicts_count"] == 0

        # Test publish succeeds
        pub_res = publish_schedule(job_id, db)
        assert pub_res["status"] == "success"
        db.refresh(job)
        assert job.is_published is True

        # Now deliberately induce a hard conflict:
        # Move one schedule to share the exact same room and slot as another schedule (HC2)
        schedules = db.query(Schedule).filter(Schedule.job_id == job_id).limit(2).all()
        assert len(schedules) == 2
        s1, s2 = schedules[0], schedules[1]
        s2.room_id = s1.room_id
        s2.time_slot_id = s1.time_slot_id
        db.commit()

        # Validate again: must detect the conflict
        val2 = validate_job_internal(job_id, db)
        assert val2["is_valid"] is False
        assert val2["hard_conflicts_count"] > 0
        assert val2["conflicts_by_type"]["hc2_room_clash"] >= 1

        # Publish must now be rejected
        with pytest.raises(HTTPException) as exc_info:
            publish_schedule(job_id, db)
        assert exc_info.value.status_code == 400
        assert "bentrok mutlak" in exc_info.value.detail

    finally:
        db.query(Schedule).filter(Schedule.job_id == job_id).delete()
        db.query(ScheduleJob).filter(ScheduleJob.id == job_id).delete()
        db.commit()
        db.close()
