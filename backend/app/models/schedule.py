import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, Float, Text, ForeignKey, UniqueConstraint, CheckConstraint, DateTime
from sqlalchemy.orm import relationship
from app.database import Base, GUID

class ScheduleJob(Base):
    __tablename__ = "schedule_jobs"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    academic_year = Column(String(10), nullable=False) # e.g. "2026/2027"
    semester_type = Column(String(10), nullable=False) # ODD, EVEN
    status = Column(String(20), nullable=False, default="PENDING") # PENDING, RUNNING, COMPLETED, FAILED
    is_published = Column(Boolean, nullable=False, default=False)
    progress_percentage = Column(Integer, default=0)
    current_generation = Column(Integer, default=0)
    max_generations = Column(Integer, nullable=False)
    best_fitness = Column(Float, default=0.0)
    hard_conflicts_count = Column(Integer, default=0)
    soft_conflicts_count = Column(Integer, default=0)
    execution_time_seconds = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')", name="check_job_status"),
        CheckConstraint("semester_type IN ('ODD', 'EVEN')", name="check_job_semester_type"),
        CheckConstraint("progress_percentage BETWEEN 0 AND 100", name="check_job_progress"),
    )

    # Relationships
    schedules = relationship("Schedule", back_populates="job", cascade="all, delete-orphan")

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    job_id = Column(GUID, ForeignKey("schedule_jobs.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(GUID, ForeignKey("academic_classes.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(GUID, ForeignKey("rooms.id", ondelete="RESTRICT"), nullable=False)
    time_slot_id = Column(GUID, ForeignKey("time_slots.id", ondelete="RESTRICT"), nullable=False)
    is_conflict = Column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("job_id", "class_id", name="unique_class_per_job"),
    )

    # Relationships
    job = relationship("ScheduleJob", back_populates="schedules")
    academic_class = relationship("AcademicClass", back_populates="schedules")
    room = relationship("Room", back_populates="schedules")
    time_slot = relationship("TimeSlot", back_populates="schedules")
