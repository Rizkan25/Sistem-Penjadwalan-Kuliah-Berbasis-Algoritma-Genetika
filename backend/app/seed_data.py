import uuid
from datetime import time
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models.master import (
    Lecturer,
    Room,
    TimeSlot,
    LecturerTimePreference,
    Course,
    AcademicClass,
)
from app.models.schedule import ScheduleJob, Schedule

def init_db():
    Base.metadata.create_all(bind=engine)

def seed_database():
    init_db()
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Lecturer).count() > 0:
            print("[INFO] Database already contains data. Skipping seed.")
            return

        print("[INFO] Seeding initial UBBG Computer Science data...")

        # 1. Seed Lecturers
        lecturers_data = [
            {"nidn": "0012058501", "name": "Teuku Rizky, M.Kom.", "email": "teuku.rizky@bbg.ac.id"},
            {"nidn": "0015088702", "name": "Fitriani, M.T.", "email": "fitriani@bbg.ac.id"},
            {"nidn": "0022038903", "name": "Cut Maysarah, M.Kom.", "email": "cut.maysarah@bbg.ac.id"},
            {"nidn": "0005118404", "name": "Zulkifli, M.Kom.", "email": "zulkifli@bbg.ac.id"},
            {"nidn": "0018098605", "name": "Ahmad Fauzi, M.Cs.", "email": "ahmad.fauzi@bbg.ac.id"},
            {"nidn": "0028049006", "name": "Rini Anggraini, M.Kom.", "email": "rini.anggraini@bbg.ac.id"},
            {"nidn": "0010078807", "name": "Munawir, M.T.", "email": "munawir@bbg.ac.id"},
            {"nidn": "0003028308", "name": "Dra. Nurhayati, M.Pd.", "email": "nurhayati@bbg.ac.id"},
            {"nidn": "0014068509", "name": "Hendra Syahputra, M.Kom.", "email": "hendra@bbg.ac.id"},
            {"nidn": "0025129110", "name": "Nurlaila, M.Si.", "email": "nurlaila@bbg.ac.id"},
        ]
        created_lecturers = {}
        for l_data in lecturers_data:
            lec = Lecturer(
                id=uuid.uuid4(),
                nidn=l_data["nidn"],
                name=l_data["name"],
                email=l_data["email"]
            )
            db.add(lec)
            created_lecturers[l_data["name"]] = lec
        db.flush()

        # 2. Seed Rooms
        rooms_data = [
            {"code": "C.III.10", "name": "LAB KOMPUTER 02", "capacity": 45, "room_type": "LABORATORY"},
            {"code": "C.III.11", "name": "LAB KOMPUTER 01", "capacity": 45, "room_type": "LABORATORY"},
            {"code": "C.II.01", "name": "LAB CBT 1", "capacity": 50, "room_type": "LABORATORY"},
            {"code": "C.II.12", "name": "LAB CBT 2", "capacity": 50, "room_type": "LABORATORY"},
            {"code": "D.III.01", "name": "RUANG KELAS D301", "capacity": 50, "room_type": "THEORY"},
            {"code": "D.III.02", "name": "RUANG KELAS D302", "capacity": 50, "room_type": "THEORY"},
            {"code": "E.II.06", "name": "RUANG KELAS E206", "capacity": 55, "room_type": "THEORY"},
            {"code": "E.II.07", "name": "RUANG KELAS E207", "capacity": 45, "room_type": "THEORY"},
        ]
        created_rooms = {}
        for r_data in rooms_data:
            room = Room(
                id=uuid.uuid4(),
                code=r_data["code"],
                name=r_data["name"],
                capacity=r_data["capacity"],
                room_type=r_data["room_type"],
                is_active=True
            )
            db.add(room)
            created_rooms[r_data["code"]] = room
        db.flush()

        # 3. Seed Time Slots
        # Days 1=Senin to 6=Sabtu. Friday (5) has locked break 11:30 - 14:00
        created_slots = []
        regular_periods = [
            (1, time(8, 0), time(10, 0)),
            (2, time(10, 15), time(12, 0)),
            (3, time(14, 0), time(16, 0)),
            (4, time(16, 15), time(18, 0)),
        ]
        friday_periods = [
            (1, time(8, 0), time(9, 40)),
            (2, time(9, 45), time(11, 15)),
            # 11:30 - 14:00 is Friday Prayer locked!
            (3, time(14, 0), time(15, 40)),
            (4, time(15, 45), time(17, 30)),
        ]

        for day in range(1, 7):
            periods = friday_periods if day == 5 else regular_periods
            for p_order, s_time, e_time in periods:
                ts = TimeSlot(
                    id=uuid.uuid4(),
                    day_of_week=day,
                    period_order=p_order,
                    start_time=s_time,
                    end_time=e_time
                )
                db.add(ts)
                created_slots.append(ts)
        db.flush()

        # 4. Seed Lecturer Time Preferences (HC_6 & SC_1)
        # Teuku Rizky is UNAVAILABLE on Saturday afternoon (day 6, period 3, 4)
        sat_p3 = next((s for s in created_slots if s.day_of_week == 6 and s.period_order == 3), None)
        sat_p4 = next((s for s in created_slots if s.day_of_week == 6 and s.period_order == 4), None)
        if sat_p3:
            db.add(LecturerTimePreference(
                id=uuid.uuid4(),
                lecturer_id=created_lecturers["Teuku Rizky, M.Kom."].id,
                time_slot_id=sat_p3.id,
                preference_type="UNAVAILABLE",
                reason="Kegiatan pengabdian masyarakat mingguan"
            ))
        if sat_p4:
            db.add(LecturerTimePreference(
                id=uuid.uuid4(),
                lecturer_id=created_lecturers["Teuku Rizky, M.Kom."].id,
                time_slot_id=sat_p4.id,
                preference_type="UNAVAILABLE",
                reason="Kegiatan pengabdian masyarakat mingguan"
            ))

        # Zulkifli is UNAVAILABLE on Monday morning (day 1, period 1)
        mon_p1 = next((s for s in created_slots if s.day_of_week == 1 and s.period_order == 1), None)
        if mon_p1:
            db.add(LecturerTimePreference(
                id=uuid.uuid4(),
                lecturer_id=created_lecturers["Zulkifli, M.Kom."].id,
                time_slot_id=mon_p1.id,
                preference_type="UNAVAILABLE",
                reason="Rapat koordinasi pimpinan fakultas"
            ))

        # Fitriani PREFERS Tuesday morning (day 2, periods 1 & 2)
        tue_p1 = next((s for s in created_slots if s.day_of_week == 2 and s.period_order == 1), None)
        tue_p2 = next((s for s in created_slots if s.day_of_week == 2 and s.period_order == 2), None)
        if tue_p1:
            db.add(LecturerTimePreference(
                id=uuid.uuid4(),
                lecturer_id=created_lecturers["Fitriani, M.T."].id,
                time_slot_id=tue_p1.id,
                preference_type="PREFERRED",
                reason="Jadwal riset laboratorium pagi"
            ))
        if tue_p2:
            db.add(LecturerTimePreference(
                id=uuid.uuid4(),
                lecturer_id=created_lecturers["Fitriani, M.T."].id,
                time_slot_id=tue_p2.id,
                preference_type="PREFERRED",
                reason="Jadwal riset laboratorium pagi"
            ))
        db.flush()

        # 5. Seed Courses
        courses_data = [
            # Semester 1 (GENERAL)
            {"code": "MKKD1001", "name": "Algoritma & Pemrograman I", "credits": 3, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1002", "name": "Praktikum Algoritma & Pemrograman I", "credits": 2, "semester": 1, "course_type": "LABORATORY", "kbk": "GENERAL"},
            {"code": "MKKD1003", "name": "Pengantar Teknologi Informasi", "credits": 2, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1004", "name": "Matematika Diskrit", "credits": 3, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1005", "name": "Pancasila & Kewarganegaraan", "credits": 2, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1006", "name": "Bahasa Inggris Komputer", "credits": 2, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},

            # Semester 3
            {"code": "MKKD1020", "name": "Struktur Data & Algoritma", "credits": 3, "semester": 3, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1021", "name": "Praktikum Struktur Data", "credits": 2, "semester": 3, "course_type": "LABORATORY", "kbk": "GENERAL"},
            {"code": "MKKD1022", "name": "Sistem Operasi", "credits": 3, "semester": 3, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1023", "name": "Statistika Komputasi", "credits": 3, "semester": 3, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKB3001", "name": "Pemrograman Web Dasar", "credits": 3, "semester": 3, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKB3002", "name": "Desain Grafis & UI/UX", "credits": 3, "semester": 3, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKB3003", "name": "Elektronika Dasar IoT", "credits": 3, "semester": 3, "course_type": "LABORATORY", "kbk": "IOT"},

            # Semester 5
            {"code": "MKKD1030", "name": "Rekayasa Perangkat Lunak", "credits": 3, "semester": 5, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1031", "name": "Kecerdasan Buatan (AI)", "credits": 3, "semester": 5, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1032", "name": "Praktikum Jaringan Komputer Lanjut", "credits": 2, "semester": 5, "course_type": "LABORATORY", "kbk": "GENERAL"},
            {"code": "MKKB5001", "name": "Pemrograman Mobile Android", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKB5002", "name": "Pengembangan REST API & Backend", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKB5003", "name": "Animasi 2D & 3D Digital", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKB5004", "name": "Audio Visual Editing", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKB5005", "name": "Sistem Sensor & Aktuator", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "IOT"},
            {"code": "MKKB5006", "name": "Mikrokontroler & Embedded System", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "IOT"},

            # Semester 7
            {"code": "MKKD1040", "name": "Manajemen Proyek Perangkat Lunak", "credits": 3, "semester": 7, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1041", "name": "Etika Profesi & Cyber Law", "credits": 2, "semester": 7, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKB7001", "name": "Cloud Computing & DevOps", "credits": 3, "semester": 7, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKB7002", "name": "Game Development & AR/VR", "credits": 3, "semester": 7, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKB7003", "name": "Industrial IoT & Smart City", "credits": 3, "semester": 7, "course_type": "LABORATORY", "kbk": "IOT"},
        ]
        created_courses = {}
        for c_data in courses_data:
            c = Course(
                id=uuid.uuid4(),
                code=c_data["code"],
                name=c_data["name"],
                credits=c_data["credits"],
                semester=c_data["semester"],
                course_type=c_data["course_type"],
                kbk=c_data["kbk"]
            )
            db.add(c)
            created_courses[c_data["code"]] = c
        db.flush()

        # 6. Seed Academic Classes (Semester Ganjil 2026/2027)
        classes_data = [
            # Semester 1 - Cohort A & B
            {"course": "MKKD1001", "lecturer": "Teuku Rizky, M.Kom.", "name": "IK-1A Algoritma & Pemrograman I", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"course": "MKKD1001", "lecturer": "Hendra Syahputra, M.Kom.", "name": "IK-1B Algoritma & Pemrograman I", "sem": 1, "cohort": "B", "kbk": "GENERAL", "count": 35},
            {"course": "MKKD1002", "lecturer": "Teuku Rizky, M.Kom.", "name": "IK-1A Prak. Algoritma I", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"course": "MKKD1002", "lecturer": "Hendra Syahputra, M.Kom.", "name": "IK-1B Prak. Algoritma I", "sem": 1, "cohort": "B", "kbk": "GENERAL", "count": 35},
            {"course": "MKKD1003", "lecturer": "Cut Maysarah, M.Kom.", "name": "IK-1A Pengantar TI", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"course": "MKKD1003", "lecturer": "Cut Maysarah, M.Kom.", "name": "IK-1B Pengantar TI", "sem": 1, "cohort": "B", "kbk": "GENERAL", "count": 35},
            {"course": "MKKD1004", "lecturer": "Nurlaila, M.Si.", "name": "IK-1A Matematika Diskrit", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"course": "MKKD1004", "lecturer": "Nurlaila, M.Si.", "name": "IK-1B Matematika Diskrit", "sem": 1, "cohort": "B", "kbk": "GENERAL", "count": 35},
            {"course": "MKKD1005", "lecturer": "Dra. Nurhayati, M.Pd.", "name": "IK-1A Pancasila & Kewarganegaraan", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"course": "MKKD1005", "lecturer": "Dra. Nurhayati, M.Pd.", "name": "IK-1B Pancasila & Kewarganegaraan", "sem": 1, "cohort": "B", "kbk": "GENERAL", "count": 35},
            {"course": "MKKD1006", "lecturer": "Dra. Nurhayati, M.Pd.", "name": "IK-1A Bahasa Inggris Komputer", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"course": "MKKD1006", "lecturer": "Dra. Nurhayati, M.Pd.", "name": "IK-1B Bahasa Inggris Komputer", "sem": 1, "cohort": "B", "kbk": "GENERAL", "count": 35},

            # Semester 3 - Cohort A
            {"course": "MKKD1020", "lecturer": "Fitriani, M.T.", "name": "IK-3A Struktur Data & Algoritma", "sem": 3, "cohort": "A", "kbk": "GENERAL", "count": 32},
            {"course": "MKKD1021", "lecturer": "Fitriani, M.T.", "name": "IK-3A Prak. Struktur Data", "sem": 3, "cohort": "A", "kbk": "GENERAL", "count": 32},
            {"course": "MKKD1022", "lecturer": "Zulkifli, M.Kom.", "name": "IK-3A Sistem Operasi", "sem": 3, "cohort": "A", "kbk": "GENERAL", "count": 32},
            {"course": "MKKD1023", "lecturer": "Nurlaila, M.Si.", "name": "IK-3A Statistika Komputasi", "sem": 3, "cohort": "A", "kbk": "GENERAL", "count": 32},
            # KBK Parallel
            {"course": "MKKB3001", "lecturer": "Ahmad Fauzi, M.Cs.", "name": "IK-3A Pemrograman Web Dasar", "sem": 3, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 28},
            {"course": "MKKB3002", "lecturer": "Rini Anggraini, M.Kom.", "name": "IK-3A Desain Grafis & UI/UX", "sem": 3, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"course": "MKKB3003", "lecturer": "Munawir, M.T.", "name": "IK-3A Elektronika Dasar IoT", "sem": 3, "cohort": "A", "kbk": "IOT", "count": 20},

            # Semester 5 - Cohort A
            {"course": "MKKD1030", "lecturer": "Cut Maysarah, M.Kom.", "name": "IK-5A Rekayasa Perangkat Lunak", "sem": 5, "cohort": "A", "kbk": "GENERAL", "count": 30},
            {"course": "MKKD1031", "lecturer": "Zulkifli, M.Kom.", "name": "IK-5A Kecerdasan Buatan (AI)", "sem": 5, "cohort": "A", "kbk": "GENERAL", "count": 30},
            {"course": "MKKD1032", "lecturer": "Munawir, M.T.", "name": "IK-5A Prak. Jaringan Lanjut", "sem": 5, "cohort": "A", "kbk": "GENERAL", "count": 30},
            # KBK Parallel
            {"course": "MKKB5001", "lecturer": "Teuku Rizky, M.Kom.", "name": "IK-5A Pemrograman Mobile Android", "sem": 5, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 26},
            {"course": "MKKB5002", "lecturer": "Ahmad Fauzi, M.Cs.", "name": "IK-5A Pengembangan REST API", "sem": 5, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 26},
            {"course": "MKKB5003", "lecturer": "Rini Anggraini, M.Kom.", "name": "IK-5A Animasi 2D & 3D Digital", "sem": 5, "cohort": "A", "kbk": "MULTIMEDIA", "count": 24},
            {"course": "MKKB5004", "lecturer": "Rini Anggraini, M.Kom.", "name": "IK-5A Audio Visual Editing", "sem": 5, "cohort": "A", "kbk": "MULTIMEDIA", "count": 24},
            {"course": "MKKB5005", "lecturer": "Fitriani, M.T.", "name": "IK-5A Sistem Sensor & Aktuator", "sem": 5, "cohort": "A", "kbk": "IOT", "count": 20},
            {"course": "MKKB5006", "lecturer": "Munawir, M.T.", "name": "IK-5A Mikrokontroler & Embedded", "sem": 5, "cohort": "A", "kbk": "IOT", "count": 20},

            # Semester 7 - Cohort A
            {"course": "MKKD1040", "lecturer": "Hendra Syahputra, M.Kom.", "name": "IK-7A Manajemen Proyek PL", "sem": 7, "cohort": "A", "kbk": "GENERAL", "count": 28},
            {"course": "MKKD1041", "lecturer": "Dra. Nurhayati, M.Pd.", "name": "IK-7A Etika Profesi & Cyber Law", "sem": 7, "cohort": "A", "kbk": "GENERAL", "count": 28},
            # KBK Parallel
            {"course": "MKKB7001", "lecturer": "Ahmad Fauzi, M.Cs.", "name": "IK-7A Cloud Computing & DevOps", "sem": 7, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 25},
            {"course": "MKKB7002", "lecturer": "Rini Anggraini, M.Kom.", "name": "IK-7A Game Dev & AR/VR", "sem": 7, "cohort": "A", "kbk": "MULTIMEDIA", "count": 22},
            {"course": "MKKB7003", "lecturer": "Munawir, M.T.", "name": "IK-7A Industrial IoT & Smart City", "sem": 7, "cohort": "A", "kbk": "IOT", "count": 18},
        ]

        for cls_data in classes_data:
            course_obj = created_courses[cls_data["course"]]
            lecturer_obj = created_lecturers[cls_data["lecturer"]]
            ac = AcademicClass(
                id=uuid.uuid4(),
                course_id=course_obj.id,
                lecturer_id=lecturer_obj.id,
                class_name=cls_data["name"],
                semester=cls_data["sem"],
                cohort=cls_data["cohort"],
                kbk=cls_data["kbk"],
                student_count=cls_data["count"],
                academic_year="2026/2027",
                semester_type="ODD"
            )
            db.add(ac)

        db.commit()
        print("[SUCCESS] Seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Seeding failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
