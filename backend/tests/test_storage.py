import uuid
from app.database import SessionLocal
from app.models.schedule import ScheduleJob, Schedule
from app.models.master import AcademicClass
from app.tasks import execute_optimization

def test_storage_saves_all_classes():
    """
    Test penyimpanan: setelah execute_optimization, jumlah baris schedules untuk sebuah job
    harus persis sama dengan jumlah kelas (122 kelas), dan tidak ada kelas yang terlewat.
    """
    db = SessionLocal()
    academic_year = "2026/2027"
    semester_type = "ODD"

    total_classes = db.query(AcademicClass).filter(
        AcademicClass.academic_year == academic_year,
        AcademicClass.semester_type == semester_type
    ).count()

    assert total_classes > 0, "No classes found in master data for testing."

    # Create a test job
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
        # Run small fast optimization test (20 individuals, 20 generations)
        params = {
            "population_size": 30,
            "max_generations": 20,
            "crossover_rate": 0.85,
            "mutation_rate": 0.08,
            "elitism_count": 2
        }
        result = execute_optimization(str(job_id), params)

        # Refresh db and verify schedules count
        schedules_count = db.query(Schedule).filter(Schedule.job_id == job_id).count()
        assert schedules_count == total_classes, (
            f"Expected {total_classes} schedules saved, but found {schedules_count}"
        )

        # Verify that all saved schedules have the is_conflict column (boolean)
        sample_schedules = db.query(Schedule).filter(Schedule.job_id == job_id).all()
        for s in sample_schedules:
            assert isinstance(s.is_conflict, bool)

        # Verify job completed status
        db.refresh(job)
        assert job.status == "COMPLETED"
        assert job.progress_percentage == 100

    finally:
        # Cleanup test job
        db.query(Schedule).filter(Schedule.job_id == job_id).delete()
        db.query(ScheduleJob).filter(ScheduleJob.id == job_id).delete()
        db.commit()
        db.close()
