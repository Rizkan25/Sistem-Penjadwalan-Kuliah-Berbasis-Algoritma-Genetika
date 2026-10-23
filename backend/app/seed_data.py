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
            # Lantai 2
            {"code": "C.II.01", "name": "Lab. CBT 01", "capacity": 40, "room_type": "LABORATORY"},
            {"code": "C.II.06", "name": "Ruang Kuliah C.II.06", "capacity": 20, "room_type": "THEORY"},
            {"code": "C.II.07", "name": "Ruang Kuliah C.II.07", "capacity": 40, "room_type": "THEORY"},
            {"code": "C.II.08", "name": "Ruang Kuliah C.II.08", "capacity": 30, "room_type": "THEORY"},
            {"code": "C.II.11", "name": "Ruang Kuliah C.II.11", "capacity": 55, "room_type": "THEORY"},
            {"code": "C.II.12", "name": "Lab. CBT 02", "capacity": 40, "room_type": "LABORATORY"},
            {"code": "D.II.01", "name": "Ruang Kuliah D.II.01", "capacity": 45, "room_type": "THEORY"},
            {"code": "D.II.02", "name": "Ruang Kuliah D.II.02", "capacity": 45, "room_type": "THEORY"},
            {"code": "D.II.03", "name": "Ruang Kuliah D.II.03", "capacity": 45, "room_type": "THEORY"},
            {"code": "D.II.04", "name": "Ruang Kuliah D.II.04", "capacity": 45, "room_type": "THEORY"},
            {"code": "D.II.05", "name": "Ruang Kuliah D.II.05", "capacity": 45, "room_type": "THEORY"},
            {"code": "D.II.06", "name": "Ruang Kuliah D.II.06", "capacity": 45, "room_type": "THEORY"},
            {"code": "D.II.07", "name": "Ruang Kuliah D.II.07", "capacity": 45, "room_type": "THEORY"},
            {"code": "D.II.09", "name": "Ruang Kuliah D.II.09", "capacity": 50, "room_type": "THEORY"},

            # Lantai 3
            {"code": "C.III.06", "name": "Ruang Kuliah C.III.06", "capacity": 30, "room_type": "THEORY"},
            {"code": "C.III.10", "name": "Lab. Komputer 02", "capacity": 30, "room_type": "LABORATORY"},
            {"code": "C.III.11", "name": "Lab. Komputer 01", "capacity": 50, "room_type": "LABORATORY"},
            {"code": "D.III.01", "name": "Ruang Kuliah D.III.01", "capacity": 45, "room_type": "THEORY"},
            {"code": "D.III.02", "name": "Ruang Kuliah D.III.02", "capacity": 45, "room_type": "THEORY"},
            {"code": "D.III.03", "name": "Ruang Kuliah D.III.03", "capacity": 45, "room_type": "THEORY"},
            {"code": "D.III.04", "name": "Ruang Kuliah D.III.04", "capacity": 45, "room_type": "THEORY"},
            {"code": "D.III.05", "name": "Ruang Kuliah D.III.05", "capacity": 45, "room_type": "THEORY"},
            {"code": "D.III.06", "name": "Ruang Kuliah D.III.06", "capacity": 45, "room_type": "THEORY"},
            {"code": "D.III.07", "name": "Ruang Kuliah D.III.07", "capacity": 45, "room_type": "THEORY"},
            {"code": "D.III.08", "name": "Ruang Kuliah D.III.08", "capacity": 55, "room_type": "THEORY"},
            {"code": "D.III.09", "name": "Ruang Kuliah D.III.09", "capacity": 50, "room_type": "THEORY"},
            {"code": "D.III.10", "name": "Ruang Kuliah D.III.10", "capacity": 50, "room_type": "THEORY"},

            # Lantai 4
            {"code": "D.IV.03", "name": "Smart Room D.IV.03", "capacity": 40, "room_type": "THEORY"},
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
        # Days 1=Senin to 6=Sabtu (Jam 1 s.d 9 sesuai dataset resmi perkuliahan UBBG)
        created_slots = []
        regular_periods = [
            (1, time(9, 0), time(9, 50)),
            (2, time(9, 50), time(10, 40)),
            (3, time(10, 40), time(11, 30)),
            (4, time(11, 30), time(12, 20)),
            (5, time(14, 0), time(14, 50)),
            (6, time(14, 50), time(15, 40)),
            (7, time(15, 40), time(16, 30)),
            (8, time(16, 30), time(17, 20)),
            (9, time(17, 20), time(18, 10)),
        ]
        friday_periods = [
            (1, time(9, 0), time(9, 45)),
            (2, time(9, 45), time(10, 30)),
            (3, time(10, 30), time(11, 15)),
            (4, time(11, 15), time(12, 0)),
            (5, time(14, 0), time(14, 50)),
            (6, time(14, 50), time(15, 40)),
            (7, time(15, 40), time(16, 30)),
            (8, time(16, 30), time(17, 20)),
            (9, time(17, 20), time(18, 10)),
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

        # 5. Seed Real Courses (Semester 1 - 5)
        courses_data = [
            # Semester I
            {"code": "MKWU01", "name": "Pendidikan Agama Islam", "credits": 2, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKWU02", "name": "Bahasa Indonesia", "credits": 2, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKWU03", "name": "Pendidikan Pancasila", "credits": 2, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1001", "name": "Dasar Pemrograman", "credits": 3, "semester": 1, "course_type": "LABORATORY", "kbk": "GENERAL"},
            {"code": "MKKD1002", "name": "Pengantar Sistem Digital", "credits": 3, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1004", "name": "Pengantar Kalkulus", "credits": 2, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1009", "name": "Arsitektur dan Organisasi Komputer", "credits": 3, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKL1006", "name": "Teori Peluang", "credits": 2, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},

            # Semester II
            {"code": "MKWI01", "name": "Matematika Dasar", "credits": 2, "semester": 2, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKWI02", "name": "Bahasa Inggris", "credits": 2, "semester": 2, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKWI03", "name": "Aqidah Akhlak", "credits": 2, "semester": 2, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKWU04", "name": "Pendidikan Kewarganegaraan", "credits": 2, "semester": 2, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKWI04", "name": "Literasi Global", "credits": 2, "semester": 2, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKL1005", "name": "Pemrograman Web", "credits": 3, "semester": 2, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKD1007", "name": "Metode Numerik", "credits": 3, "semester": 2, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1008", "name": "Sistem Operasi", "credits": 3, "semester": 2, "course_type": "THEORY", "kbk": "GENERAL"},

            # ================= SEMESTER III =================
            # MK Wajib Umum (Tanpa Bintang)
            {"code": "MKKD511", "name": "Statistika Dasar", "credits": 3, "semester": 3, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1017", "name": "Etika Profesi", "credits": 2, "semester": 3, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKL1034", "name": "Teori Bahasa dan Otomata", "credits": 3, "semester": 3, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1005", "name": "Matematika Diskrit", "credits": 3, "semester": 3, "course_type": "THEORY", "kbk": "GENERAL"},
            # MK Peminatan Multimedia (*)
            {"code": "MKKD1022", "name": "Desain Grafis", "credits": 3, "semester": 3, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKD1023", "name": "Pemrograman Game", "credits": 3, "semester": 3, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKD1024", "name": "Audio Digital", "credits": 3, "semester": 3, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKD1025", "name": "Augmented Reality", "credits": 3, "semester": 3, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            # MK Peminatan IoT (*)
            {"code": "MKKD1011", "name": "Komunikasi Data", "credits": 3, "semester": 3, "course_type": "LABORATORY", "kbk": "IOT"},
            {"code": "MKKD1019", "name": "Keamanan Sistem IoT", "credits": 3, "semester": 3, "course_type": "LABORATORY", "kbk": "IOT"},
            {"code": "MKKD1020", "name": "Dasar-Dasar IoT", "credits": 3, "semester": 3, "course_type": "LABORATORY", "kbk": "IOT"},
            {"code": "MKKD1021", "name": "Cloud Computing", "credits": 3, "semester": 3, "course_type": "LABORATORY", "kbk": "IOT"},
            # MK Peminatan Pemrograman / AI
            {"code": "MKKD1010", "name": "Pengantar Basis Data", "credits": 3, "semester": 3, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKL1001", "name": "Desain dan Analisis Algoritma", "credits": 3, "semester": 3, "course_type": "THEORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKD1012", "name": "Rekayasa Perangkat Lunak", "credits": 3, "semester": 3, "course_type": "THEORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKD1018", "name": "Pengembangan Aplikasi AI", "credits": 3, "semester": 3, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},

            # ================= SEMESTER IV =================
            # MK Wajib Umum (Tanpa Bintang)
            {"code": "MKKD1003", "name": "Aljabar Vektor dan Matriks", "credits": 3, "semester": 4, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1013", "name": "Interaksi Manusia dan Komputer", "credits": 3, "semester": 4, "course_type": "THEORY", "kbk": "GENERAL"},
            # MK Peminatan Multimedia (*)
            {"code": "MKKD1033", "name": "Manajemen Konten dan Platform Digital", "credits": 3, "semester": 4, "course_type": "THEORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKD1034", "name": "Desain Konten", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKD1035", "name": "Animasi 2D", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKD1036", "name": "Grafika Komputer", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKD1037", "name": "Videografi", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKD1038", "name": "Fotografi", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            # MK Peminatan IoT (*)
            {"code": "MKKD1015", "name": "Jaringan Komputer", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "IOT"},
            {"code": "MKKD1028", "name": "Analisis Data IoT", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "IOT"},
            {"code": "MKKD1029", "name": "Pengembangan dan Aplikasi IoT", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "IOT"},
            {"code": "MKKD1030", "name": "Komunikasi dan Fog Computing", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "IOT"},
            {"code": "MKKD1032", "name": "Kecerdasan IoT", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "IOT"},
            {"code": "MKKD1073", "name": "Manajemen dan Monitoring Jaringan", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "IOT"},
            # MK Peminatan Pemrograman
            {"code": "MKKD1006", "name": "Struktur Data dan Algoritma", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKD1016", "name": "Kecerdasan Buatan", "credits": 3, "semester": 4, "course_type": "THEORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKD1027", "name": "Natural Language Processing", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKL1002", "name": "Sistem Basis Data", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKL1003", "name": "Pemrograman Berorientasi Objek", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},

            # ================= SEMESTER V =================
            # MK Wajib Umum (Tanpa Bintang)
            {"code": "MKWI05", "name": "Kewirausahaan", "credits": 2, "semester": 5, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKL1008", "name": "Manajemen Proyek", "credits": 3, "semester": 5, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKL1013", "name": "Metodologi Penelitian", "credits": 3, "semester": 5, "course_type": "THEORY", "kbk": "GENERAL"},
            # MK Peminatan Multimedia (*)
            {"code": "MKKD1041", "name": "Editing Videografi", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKD1042", "name": "Editing Fotografi", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKD1043", "name": "Animasi 3D", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKD1044", "name": "Teknologi Media Visual", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKL1010", "name": "Multimedia", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            # MK Peminatan IoT (*)
            {"code": "MKKD1045", "name": "Sistem dan Aplikasi IoT", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "IOT"},
            {"code": "MKKD1046", "name": "Perancangan Sistem IoT", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "IOT"},
            {"code": "MKKD1047", "name": "Teknologi IoT", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "IOT"},
            {"code": "MKKD1048", "name": "Sensor IoT", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "IOT"},
            {"code": "MKKD1049", "name": "Keamanan Jaringan", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "IOT"},
            # MK Peminatan Pemrograman / AI
            {"code": "MKKD1039", "name": "Pengenalan Pola AI", "credits": 3, "semester": 5, "course_type": "THEORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKD1040", "name": "Kecerdasan Komputasional", "credits": 3, "semester": 5, "course_type": "THEORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKL1009", "name": "Jaringan Saraf Tiruan", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKL1011", "name": "Data Mining", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKL1023", "name": "Machine Learning", "credits": 3, "semester": 5, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},
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

        # 6. Seed Sample Academic Classes for Real Courses
        classes_data = [
            # Semester 1
            {"code": "MKKD1001", "lecturer": "Teuku Rizky, M.Kom.", "name": "IK-1A Dasar Pemrograman", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"code": "MKKD1001", "lecturer": "Ahmad Fauzi, M.Cs.", "name": "IK-1B Dasar Pemrograman", "sem": 1, "cohort": "B", "kbk": "GENERAL", "count": 35},
            {"code": "MKWU01", "lecturer": "Teuku Rizky, M.Kom.", "name": "IK-1A Pendidikan Agama Islam", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"code": "MKWU02", "lecturer": "Dra. Nurhayati, M.Pd.", "name": "IK-1A Bahasa Indonesia", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"code": "MKWU03", "lecturer": "Dra. Nurhayati, M.Pd.", "name": "IK-1A Pendidikan Pancasila", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"code": "MKKD1002", "lecturer": "Munawir, M.T.", "name": "IK-1A Pengantar Sistem Digital", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"code": "MKKD1004", "lecturer": "Nurlaila, M.Si.", "name": "IK-1A Pengantar Kalkulus", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"code": "MKKD1009", "lecturer": "Fitriani, M.T.", "name": "IK-1A Arsitektur & Org. Komputer", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"code": "MKKL1006", "lecturer": "Nurlaila, M.Si.", "name": "IK-1A Teori Peluang", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},

            # Semester 2
            {"code": "MKKL1005", "lecturer": "Ahmad Fauzi, M.Cs.", "name": "IK-2A Pemrograman Web", "sem": 2, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 32},
            {"code": "MKKD1008", "lecturer": "Zulkifli, M.Kom.", "name": "IK-2A Sistem Operasi", "sem": 2, "cohort": "A", "kbk": "GENERAL", "count": 32},
            {"code": "MKWI01", "lecturer": "Nurlaila, M.Si.", "name": "IK-2A Matematika Dasar", "sem": 2, "cohort": "A", "kbk": "GENERAL", "count": 32},
            {"code": "MKWI02", "lecturer": "Dra. Nurhayati, M.Pd.", "name": "IK-2A Bahasa Inggris", "sem": 2, "cohort": "A", "kbk": "GENERAL", "count": 32},

            # Semester 3: Wajib Umum + Multimedia (*) + Pemrograman + IoT (*)
            {"code": "MKKD511", "lecturer": "Nurlaila, M.Si.", "name": "IK-3A Statistika Dasar", "sem": 3, "cohort": "A", "kbk": "GENERAL", "count": 30},
            {"code": "MKKD1017", "lecturer": "Cut Maysarah, M.Kom.", "name": "IK-3A Etika Profesi", "sem": 3, "cohort": "A", "kbk": "GENERAL", "count": 30},
            {"code": "MKKL1034", "lecturer": "Fitriani, M.T.", "name": "IK-3A Teori Bahasa & Otomata", "sem": 3, "cohort": "A", "kbk": "GENERAL", "count": 30},
            {"code": "MKKD1005", "lecturer": "Nurlaila, M.Si.", "name": "IK-3A Matematika Diskrit", "sem": 3, "cohort": "A", "kbk": "GENERAL", "count": 30},
            # KBK Multimedia (*)
            {"code": "MKKD1022", "lecturer": "Rini Anggraini, M.Kom.", "name": "IK-3A Desain Grafis", "sem": 3, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1023", "lecturer": "Rini Anggraini, M.Kom.", "name": "IK-3A Pemrograman Game", "sem": 3, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1024", "lecturer": "Munawir, M.T.", "name": "IK-3A Audio Digital", "sem": 3, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1025", "lecturer": "Munawir, M.T.", "name": "IK-3A Augmented Reality", "sem": 3, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            # KBK IoT (*)
            {"code": "MKKD1011", "lecturer": "Hendra Syahputra, M.Kom.", "name": "IK-3A Komunikasi Data", "sem": 3, "cohort": "A", "kbk": "IOT", "count": 25},
            {"code": "MKKD1019", "lecturer": "Hendra Syahputra, M.Kom.", "name": "IK-3A Keamanan Sistem IoT", "sem": 3, "cohort": "A", "kbk": "IOT", "count": 25},
            {"code": "MKKD1020", "lecturer": "Munawir, M.T.", "name": "IK-3A Dasar-Dasar IoT", "sem": 3, "cohort": "A", "kbk": "IOT", "count": 25},
            {"code": "MKKD1021", "lecturer": "Fitriani, M.T.", "name": "IK-3A Cloud Computing", "sem": 3, "cohort": "A", "kbk": "IOT", "count": 25},
            # KBK Pemrograman (Paralel)
            {"code": "MKKD1010", "lecturer": "Zulkifli, M.Kom.", "name": "IK-3A Pengantar Basis Data", "sem": 3, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 28},
            {"code": "MKKD1018", "lecturer": "Ahmad Fauzi, M.Cs.", "name": "IK-3A Pengembangan Aplikasi AI", "sem": 3, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 28},

            # Semester 4: Wajib Umum + Multimedia (*) + Pemrograman (Paralel)
            {"code": "MKKD1003", "lecturer": "Nurlaila, M.Si.", "name": "IK-4A Aljabar Vektor & Matriks", "sem": 4, "cohort": "A", "kbk": "GENERAL", "count": 30},
            {"code": "MKKD1013", "lecturer": "Cut Maysarah, M.Kom.", "name": "IK-4A Interaksi Manusia & Komputer", "sem": 4, "cohort": "A", "kbk": "GENERAL", "count": 30},
            # KBK Multimedia (*)
            {"code": "MKKD1033", "lecturer": "Rini Anggraini, M.Kom.", "name": "IK-4A Manajemen Konten & Platform", "sem": 4, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1034", "lecturer": "Rini Anggraini, M.Kom.", "name": "IK-4A Desain Konten", "sem": 4, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1035", "lecturer": "Rini Anggraini, M.Kom.", "name": "IK-4A Animasi 2D", "sem": 4, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1036", "lecturer": "Fitriani, M.T.", "name": "IK-4A Grafika Komputer", "sem": 4, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1037", "lecturer": "Munawir, M.T.", "name": "IK-4A Videografi", "sem": 4, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1038", "lecturer": "Munawir, M.T.", "name": "IK-4A Fotografi", "sem": 4, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            # KBK Pemrograman (Paralel)
            {"code": "MKKD1006", "lecturer": "Fitriani, M.T.", "name": "IK-4A Struktur Data & Algoritma", "sem": 4, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 28},
            {"code": "MKKL1003", "lecturer": "Teuku Rizky, M.Kom.", "name": "IK-4A PBO", "sem": 4, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 28},

            # Semester 5: Wajib Umum + Multimedia (*) + Pemrograman + IoT (*)
            {"code": "MKWI05", "lecturer": "Cut Maysarah, M.Kom.", "name": "IK-5A Kewirausahaan", "sem": 5, "cohort": "A", "kbk": "GENERAL", "count": 28},
            {"code": "MKKL1008", "lecturer": "Teuku Rizky, M.Kom.", "name": "IK-5A Manajemen Proyek", "sem": 5, "cohort": "A", "kbk": "GENERAL", "count": 28},
            {"code": "MKKL1013", "lecturer": "Zulkifli, M.Kom.", "name": "IK-5A Metodologi Penelitian", "sem": 5, "cohort": "A", "kbk": "GENERAL", "count": 28},
            # KBK Multimedia (*)
            {"code": "MKKD1041", "lecturer": "Munawir, M.T.", "name": "IK-5A Editing Videografi", "sem": 5, "cohort": "A", "kbk": "MULTIMEDIA", "count": 24},
            {"code": "MKKD1042", "lecturer": "Munawir, M.T.", "name": "IK-5A Editing Fotografi", "sem": 5, "cohort": "A", "kbk": "MULTIMEDIA", "count": 24},
            {"code": "MKKD1043", "lecturer": "Rini Anggraini, M.Kom.", "name": "IK-5A Animasi 3D", "sem": 5, "cohort": "A", "kbk": "MULTIMEDIA", "count": 24},
            {"code": "MKKD1044", "lecturer": "Rini Anggraini, M.Kom.", "name": "IK-5A Teknologi Media Visual", "sem": 5, "cohort": "A", "kbk": "MULTIMEDIA", "count": 24},
            {"code": "MKKL1010", "lecturer": "Rini Anggraini, M.Kom.", "name": "IK-5A Multimedia", "sem": 5, "cohort": "A", "kbk": "MULTIMEDIA", "count": 24},
            # KBK IoT (*)
            {"code": "MKKD1045", "lecturer": "Hendra Syahputra, M.Kom.", "name": "IK-5A Sistem & Aplikasi IoT", "sem": 5, "cohort": "A", "kbk": "IOT", "count": 24},
            {"code": "MKKD1046", "lecturer": "Munawir, M.T.", "name": "IK-5A Perancangan Sistem IoT", "sem": 5, "cohort": "A", "kbk": "IOT", "count": 24},
            {"code": "MKKD1047", "lecturer": "Hendra Syahputra, M.Kom.", "name": "IK-5A Teknologi IoT", "sem": 5, "cohort": "A", "kbk": "IOT", "count": 24},
            {"code": "MKKD1048", "lecturer": "Munawir, M.T.", "name": "IK-5A Sensor IoT", "sem": 5, "cohort": "A", "kbk": "IOT", "count": 24},
            {"code": "MKKD1049", "lecturer": "Fitriani, M.T.", "name": "IK-5A Keamanan Jaringan", "sem": 5, "cohort": "A", "kbk": "IOT", "count": 24},
            # KBK Pemrograman (Paralel)
            {"code": "MKKL1023", "lecturer": "Fitriani, M.T.", "name": "IK-5A Machine Learning", "sem": 5, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 26},
            {"code": "MKKL1011", "lecturer": "Ahmad Fauzi, M.Cs.", "name": "IK-5A Data Mining", "sem": 5, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 26},
        ]

        for cls_data in classes_data:
            course_obj = created_courses.get(cls_data["code"])
            lecturer_obj = created_lecturers.get(cls_data["lecturer"])
            if course_obj and lecturer_obj:
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
                    semester_type="ODD" if cls_data["sem"] % 2 != 0 else "EVEN"
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
