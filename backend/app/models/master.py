import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, Time, ForeignKey, UniqueConstraint, CheckConstraint, DateTime
from sqlalchemy.orm import relationship
from app.database import Base, GUID

class Lecturer(Base):
    __tablename__ = "lecturers"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    nidn = Column(String(30), unique=True, nullable=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    jabatan = Column(String(150), nullable=True)
    is_guest = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    classes = relationship("AcademicClass", back_populates="lecturer")
    preferences = relationship("LecturerTimePreference", back_populates="lecturer", cascade="all, delete-orphan")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    capacity = Column(Integer, nullable=False)
    room_type = Column(String(30), nullable=False, default="THEORY") # THEORY, LABORATORY
    is_active = Column(Boolean, default=True)

    __table_args__ = (
        CheckConstraint("capacity > 0", name="check_room_capacity_positive"),
        CheckConstraint("room_type IN ('THEORY', 'LABORATORY')", name="check_room_type"),
    )

    # Relationships
    schedules = relationship("Schedule", back_populates="room")

class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    day_of_week = Column(Integer, nullable=False) # 1: Senin, 2: Selasa, 3: Rabu, 4: Kamis, 5: Jumat, 6: Sabtu
    period_order = Column(Integer, nullable=False) # 1, 2, 3, ...
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    __table_args__ = (
        CheckConstraint("day_of_week BETWEEN 1 AND 6", name="check_time_slot_day"),
        CheckConstraint("period_order > 0", name="check_time_slot_period"),
        CheckConstraint("end_time > start_time", name="check_time_slot_order"),
        UniqueConstraint("day_of_week", "period_order", name="unique_day_period"),
    )

    # Relationships
    preferences = relationship("LecturerTimePreference", back_populates="time_slot", cascade="all, delete-orphan")
    schedules = relationship("Schedule", back_populates="time_slot")

class LecturerTimePreference(Base):
    __tablename__ = "lecturer_time_preferences"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    lecturer_id = Column(GUID, ForeignKey("lecturers.id", ondelete="CASCADE"), nullable=False)
    time_slot_id = Column(GUID, ForeignKey("time_slots.id", ondelete="CASCADE"), nullable=False)
    preference_type = Column(String(20), nullable=False) # UNAVAILABLE, PREFERRED
    reason = Column(String(255), nullable=True)

    __table_args__ = (
        CheckConstraint("preference_type IN ('UNAVAILABLE', 'PREFERRED')", name="check_preference_type"),
        UniqueConstraint("lecturer_id", "time_slot_id", name="unique_lecturer_slot_pref"),
    )

    # Relationships
    lecturer = relationship("Lecturer", back_populates="preferences")
    time_slot = relationship("TimeSlot", back_populates="preferences")

class Course(Base):
    __tablename__ = "courses"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    credits = Column(Integer, nullable=False)
    semester = Column(Integer, nullable=False)
    course_type = Column(String(20), nullable=False, default="THEORY") # THEORY, LABORATORY
    kbk = Column(String(30), nullable=False, default="GENERAL") # GENERAL, PEMROGRAMAN, MULTIMEDIA, IOT
    jenis_mk = Column(String(20), nullable=True, default="Wajib") # Wajib, Pilihan
    prerequisites = Column(String(255), nullable=True)

    __table_args__ = (
        CheckConstraint("credits BETWEEN 1 AND 6", name="check_course_credits"),
        CheckConstraint("semester BETWEEN 1 AND 8", name="check_course_semester"),
        CheckConstraint("course_type IN ('THEORY', 'LABORATORY')", name="check_course_type"),
        CheckConstraint("kbk IN ('GENERAL', 'PEMROGRAMAN', 'MULTIMEDIA', 'IOT')", name="check_course_kbk"),
    )

    # Relationships
    classes = relationship("AcademicClass", back_populates="course")

class AcademicClass(Base):
    __tablename__ = "academic_classes"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    course_id = Column(GUID, ForeignKey("courses.id", ondelete="RESTRICT"), nullable=False)
    lecturer_id = Column(GUID, ForeignKey("lecturers.id", ondelete="RESTRICT"), nullable=False)
    class_name = Column(String(50), nullable=False) # e.g. "IK-3A (Pemrograman)"
    semester = Column(Integer, nullable=False)
    cohort = Column(String(10), nullable=False, default="A")
    kbk = Column(String(30), nullable=False, default="GENERAL") # GENERAL, PEMROGRAMAN, MULTIMEDIA, IOT
    student_count = Column(Integer, nullable=False)
    academic_year = Column(String(10), nullable=False) # e.g. "2026/2027"
    semester_type = Column(String(10), nullable=False) # ODD, EVEN

    __table_args__ = (
        CheckConstraint("semester BETWEEN 1 AND 8", name="check_class_semester"),
        CheckConstraint("student_count > 0", name="check_class_student_count"),
        CheckConstraint("kbk IN ('GENERAL', 'PEMROGRAMAN', 'MULTIMEDIA', 'IOT')", name="check_class_kbk"),
        CheckConstraint("semester_type IN ('ODD', 'EVEN')", name="check_class_semester_type"),
    )

    # Relationships
    course = relationship("Course", back_populates="classes")
    lecturer = relationship("Lecturer", back_populates="classes")
    schedules = relationship("Schedule", back_populates="academic_class", cascade="all, delete-orphan")
