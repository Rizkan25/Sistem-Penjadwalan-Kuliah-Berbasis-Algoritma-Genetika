import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.master import (
    Lecturer, Room, TimeSlot, LecturerTimePreference, Course, AcademicClass
)
from app.schemas.master import (
    LecturerCreate, LecturerUpdate, LecturerResponse,
    RoomCreate, RoomUpdate, RoomResponse,
    TimeSlotCreate, TimeSlotUpdate, TimeSlotResponse,
    LecturerPreferenceCreate, LecturerPreferenceUpdate, LecturerPreferenceResponse,
    CourseCreate, CourseUpdate, CourseResponse,
    AcademicClassCreate, AcademicClassUpdate, AcademicClassResponse
)

router = APIRouter(prefix="/master", tags=["Master Data"])

# ==================== LECTURERS ====================
@router.get("/lecturers", response_model=List[LecturerResponse])
def get_lecturers(db: Session = Depends(get_db)):
    return db.query(Lecturer).order_by(Lecturer.name.asc()).all()

@router.post("/lecturers", response_model=LecturerResponse, status_code=status.HTTP_201_CREATED)
def create_lecturer(payload: LecturerCreate, db: Session = Depends(get_db)):
    if db.query(Lecturer).filter((Lecturer.nidn == payload.nidn) | (Lecturer.email == payload.email)).first():
        raise HTTPException(status_code=400, detail="Dosen dengan NIDN atau Email ini sudah terdaftar.")
    obj = Lecturer(id=uuid.uuid4(), **payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/lecturers/{id}", response_model=LecturerResponse)
def update_lecturer(id: uuid.UUID, payload: LecturerUpdate, db: Session = Depends(get_db)):
    obj = db.query(Lecturer).filter(Lecturer.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Dosen tidak ditemukan.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/lecturers/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lecturer(id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(Lecturer).filter(Lecturer.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Dosen tidak ditemukan.")
    db.delete(obj)
    db.commit()
    return None

# ==================== ROOMS ====================
@router.get("/rooms", response_model=List[RoomResponse])
def get_rooms(db: Session = Depends(get_db)):
    return db.query(Room).order_by(Room.code.asc()).all()

@router.post("/rooms", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(payload: RoomCreate, db: Session = Depends(get_db)):
    if db.query(Room).filter(Room.code == payload.code).first():
        raise HTTPException(status_code=400, detail="Kode ruangan sudah digunakan.")
    obj = Room(id=uuid.uuid4(), **payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/rooms/{id}", response_model=RoomResponse)
def update_room(id: uuid.UUID, payload: RoomUpdate, db: Session = Depends(get_db)):
    obj = db.query(Room).filter(Room.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Ruangan tidak ditemukan.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/rooms/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(Room).filter(Room.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Ruangan tidak ditemukan.")
    db.delete(obj)
    db.commit()
    return None

# ==================== TIME SLOTS ====================
@router.get("/time-slots", response_model=List[TimeSlotResponse])
def get_time_slots(db: Session = Depends(get_db)):
    return db.query(TimeSlot).order_by(TimeSlot.day_of_week.asc(), TimeSlot.period_order.asc()).all()

@router.post("/time-slots", response_model=TimeSlotResponse, status_code=status.HTTP_201_CREATED)
def create_time_slot(payload: TimeSlotCreate, db: Session = Depends(get_db)):
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=400, detail="Jam selesai harus lebih besar dari jam mulai.")
    if db.query(TimeSlot).filter(TimeSlot.day_of_week == payload.day_of_week, TimeSlot.period_order == payload.period_order).first():
        raise HTTPException(status_code=400, detail="Slot waktu dengan hari dan periode tersebut sudah ada.")
    obj = TimeSlot(id=uuid.uuid4(), **payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/time-slots/{id}", response_model=TimeSlotResponse)
def update_time_slot(id: uuid.UUID, payload: TimeSlotUpdate, db: Session = Depends(get_db)):
    obj = db.query(TimeSlot).filter(TimeSlot.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Slot waktu tidak ditemukan.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/time-slots/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_slot(id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(TimeSlot).filter(TimeSlot.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Slot waktu tidak ditemukan.")
    db.delete(obj)
    db.commit()
    return None

# ==================== COURSES ====================
@router.get("/courses", response_model=List[CourseResponse])
def get_courses(semester: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Course)
    if semester:
        query = query.filter(Course.semester == semester)
    return query.order_by(Course.semester.asc(), Course.code.asc()).all()

@router.post("/courses", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
def create_course(payload: CourseCreate, db: Session = Depends(get_db)):
    if db.query(Course).filter(Course.code == payload.code).first():
        raise HTTPException(status_code=400, detail="Kode mata kuliah sudah ada.")
    obj = Course(id=uuid.uuid4(), **payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/courses/{id}", response_model=CourseResponse)
def update_course(id: uuid.UUID, payload: CourseUpdate, db: Session = Depends(get_db)):
    obj = db.query(Course).filter(Course.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Mata kuliah tidak ditemukan.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/courses/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(Course).filter(Course.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Mata kuliah tidak ditemukan.")
    db.delete(obj)
    db.commit()
    return None

# ==================== ACADEMIC CLASSES ====================
@router.get("/classes", response_model=List[AcademicClassResponse])
def get_classes(semester: Optional[int] = None, kbk: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AcademicClass)
    if semester:
        query = query.filter(AcademicClass.semester == semester)
    if kbk:
        query = query.filter(AcademicClass.kbk == kbk)
    return query.order_by(AcademicClass.semester.asc(), AcademicClass.class_name.asc()).all()

@router.post("/classes", response_model=AcademicClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(payload: AcademicClassCreate, db: Session = Depends(get_db)):
    obj = AcademicClass(id=uuid.uuid4(), **payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.put("/classes/{id}", response_model=AcademicClassResponse)
def update_class(id: uuid.UUID, payload: AcademicClassUpdate, db: Session = Depends(get_db)):
    obj = db.query(AcademicClass).filter(AcademicClass.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan.")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/classes/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(AcademicClass).filter(AcademicClass.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan.")
    db.delete(obj)
    db.commit()
    return None

# ==================== PREFERENCES ====================
@router.get("/preferences", response_model=List[LecturerPreferenceResponse])
def get_preferences(lecturer_id: Optional[uuid.UUID] = None, db: Session = Depends(get_db)):
    query = db.query(LecturerTimePreference)
    if lecturer_id:
        query = query.filter(LecturerTimePreference.lecturer_id == lecturer_id)
    return query.all()

@router.post("/preferences", response_model=LecturerPreferenceResponse, status_code=status.HTTP_201_CREATED)
def create_preference(payload: LecturerPreferenceCreate, db: Session = Depends(get_db)):
    existing = db.query(LecturerTimePreference).filter(
        LecturerTimePreference.lecturer_id == payload.lecturer_id,
        LecturerTimePreference.time_slot_id == payload.time_slot_id
    ).first()
    if existing:
        existing.preference_type = payload.preference_type
        existing.reason = payload.reason
        db.commit()
        db.refresh(existing)
        return existing
    obj = LecturerTimePreference(id=uuid.uuid4(), **payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

@router.delete("/preferences/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_preference(id: uuid.UUID, db: Session = Depends(get_db)):
    obj = db.query(LecturerTimePreference).filter(LecturerTimePreference.id == id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Preferensi tidak ditemukan.")
    db.delete(obj)
    db.commit()
    return None
