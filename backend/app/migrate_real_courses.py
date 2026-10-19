import uuid
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.master import Course, AcademicClass, Lecturer
from app.models.schedule import Schedule

def apply_complete_curriculum():
    db: Session = SessionLocal()
    try:
        print("[INFO] Cleaning up old schedules, classes and courses...")
        db.query(Schedule).delete()
        db.query(AcademicClass).delete()
        db.query(Course).delete()
        db.commit()

        print("[INFO] Inserting complete official curriculum (General, Pemrograman, and Multimedia)...")
        all_courses_data = [
            # ================= SEMESTER I (GENERAL) =================
            {"code": "MKWU01", "name": "Pendidikan Agama Islam", "credits": 2, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKWU02", "name": "Bahasa Indonesia", "credits": 2, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKWU03", "name": "Pendidikan Pancasila", "credits": 2, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1001", "name": "Dasar Pemrograman", "credits": 3, "semester": 1, "course_type": "LABORATORY", "kbk": "GENERAL"},
            {"code": "MKKD1002", "name": "Pengantar Sistem Digital", "credits": 3, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1004", "name": "Pengantar Kalkulus", "credits": 2, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD1009", "name": "Arsitektur dan Organisasi Komputer", "credits": 3, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKL1006", "name": "Teori Peluang", "credits": 2, "semester": 1, "course_type": "THEORY", "kbk": "GENERAL"},

            # ================= SEMESTER II (GENERAL + PEMROGRAMAN) =================
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
        for c_data in all_courses_data:
            course = Course(
                id=uuid.uuid4(),
                code=c_data["code"],
                name=c_data["name"],
                credits=c_data["credits"],
                semester=c_data["semester"],
                course_type=c_data["course_type"],
                kbk=c_data["kbk"]
            )
            db.add(course)
            created_courses[c_data["code"]] = course
        db.flush()
        print(f"[SUCCESS] Inserted {len(created_courses)} official courses across Sem 1-5!")

        # Map lecturers to classes
        lecturers = db.query(Lecturer).all()
        lec_map = {l.name: l for l in lecturers}
        default_lec = lecturers[0]

        print("[INFO] Creating representative classes for General, Pemrograman, Multimedia, and IoT...")
        sample_classes = [
            # Semester 1
            {"code": "MKKD1001", "lec": "Teuku Rizky, M.Kom.", "name": "IK-1A Dasar Pemrograman", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"code": "MKKD1001", "lec": "Ahmad Fauzi, M.Cs.", "name": "IK-1B Dasar Pemrograman", "sem": 1, "cohort": "B", "kbk": "GENERAL", "count": 35},
            {"code": "MKWU01", "lec": "Teuku Rizky, M.Kom.", "name": "IK-1A Pendidikan Agama Islam", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"code": "MKWU02", "lec": "Dra. Nurhayati, M.Pd.", "name": "IK-1A Bahasa Indonesia", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"code": "MKWU03", "lec": "Dra. Nurhayati, M.Pd.", "name": "IK-1A Pendidikan Pancasila", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"code": "MKKD1002", "lec": "Munawir, M.T.", "name": "IK-1A Pengantar Sistem Digital", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"code": "MKKD1004", "lec": "Nurlaila, M.Si.", "name": "IK-1A Pengantar Kalkulus", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"code": "MKKD1009", "lec": "Fitriani, M.T.", "name": "IK-1A Arsitektur & Org. Komputer", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},
            {"code": "MKKL1006", "lec": "Nurlaila, M.Si.", "name": "IK-1A Teori Peluang", "sem": 1, "cohort": "A", "kbk": "GENERAL", "count": 35},

            # Semester 2
            {"code": "MKKL1005", "lec": "Ahmad Fauzi, M.Cs.", "name": "IK-2A Pemrograman Web", "sem": 2, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 32},
            {"code": "MKKD1008", "lec": "Zulkifli, M.Kom.", "name": "IK-2A Sistem Operasi", "sem": 2, "cohort": "A", "kbk": "GENERAL", "count": 32},
            {"code": "MKWI01", "lec": "Nurlaila, M.Si.", "name": "IK-2A Matematika Dasar", "sem": 2, "cohort": "A", "kbk": "GENERAL", "count": 32},
            {"code": "MKWI02", "lec": "Dra. Nurhayati, M.Pd.", "name": "IK-2A Bahasa Inggris", "sem": 2, "cohort": "A", "kbk": "GENERAL", "count": 32},

            # Semester 3: Wajib Umum + Multimedia (*) + Pemrograman + IoT (*)
            {"code": "MKKD511", "lec": "Nurlaila, M.Si.", "name": "IK-3A Statistika Dasar", "sem": 3, "cohort": "A", "kbk": "GENERAL", "count": 30},
            {"code": "MKKD1017", "lec": "Cut Maysarah, M.Kom.", "name": "IK-3A Etika Profesi", "sem": 3, "cohort": "A", "kbk": "GENERAL", "count": 30},
            {"code": "MKKL1034", "lec": "Fitriani, M.T.", "name": "IK-3A Teori Bahasa & Otomata", "sem": 3, "cohort": "A", "kbk": "GENERAL", "count": 30},
            {"code": "MKKD1005", "lec": "Nurlaila, M.Si.", "name": "IK-3A Matematika Diskrit", "sem": 3, "cohort": "A", "kbk": "GENERAL", "count": 30},
            # KBK Multimedia (*)
            {"code": "MKKD1022", "lec": "Rini Anggraini, M.Kom.", "name": "IK-3A Desain Grafis", "sem": 3, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1023", "lec": "Rini Anggraini, M.Kom.", "name": "IK-3A Pemrograman Game", "sem": 3, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1024", "lec": "Munawir, M.T.", "name": "IK-3A Audio Digital", "sem": 3, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1025", "lec": "Munawir, M.T.", "name": "IK-3A Augmented Reality", "sem": 3, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            # KBK IoT (*)
            {"code": "MKKD1011", "lec": "Hendra Syahputra, M.Kom.", "name": "IK-3A Komunikasi Data", "sem": 3, "cohort": "A", "kbk": "IOT", "count": 25},
            {"code": "MKKD1019", "lec": "Hendra Syahputra, M.Kom.", "name": "IK-3A Keamanan Sistem IoT", "sem": 3, "cohort": "A", "kbk": "IOT", "count": 25},
            {"code": "MKKD1020", "lec": "Munawir, M.T.", "name": "IK-3A Dasar-Dasar IoT", "sem": 3, "cohort": "A", "kbk": "IOT", "count": 25},
            {"code": "MKKD1021", "lec": "Fitriani, M.T.", "name": "IK-3A Cloud Computing", "sem": 3, "cohort": "A", "kbk": "IOT", "count": 25},
            # KBK Pemrograman (Paralel)
            {"code": "MKKD1010", "lec": "Zulkifli, M.Kom.", "name": "IK-3A Pengantar Basis Data", "sem": 3, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 28},
            {"code": "MKKD1018", "lec": "Ahmad Fauzi, M.Cs.", "name": "IK-3A Pengembangan Aplikasi AI", "sem": 3, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 28},

            # Semester 4: Wajib Umum + Multimedia (*) + Pemrograman (Paralel)
            {"code": "MKKD1003", "lec": "Nurlaila, M.Si.", "name": "IK-4A Aljabar Vektor & Matriks", "sem": 4, "cohort": "A", "kbk": "GENERAL", "count": 30},
            {"code": "MKKD1013", "lec": "Cut Maysarah, M.Kom.", "name": "IK-4A Interaksi Manusia & Komputer", "sem": 4, "cohort": "A", "kbk": "GENERAL", "count": 30},
            # KBK Multimedia (*)
            {"code": "MKKD1033", "lec": "Rini Anggraini, M.Kom.", "name": "IK-4A Manajemen Konten & Platform", "sem": 4, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1034", "lec": "Rini Anggraini, M.Kom.", "name": "IK-4A Desain Konten", "sem": 4, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1035", "lec": "Rini Anggraini, M.Kom.", "name": "IK-4A Animasi 2D", "sem": 4, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1036", "lec": "Fitriani, M.T.", "name": "IK-4A Grafika Komputer", "sem": 4, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1037", "lec": "Munawir, M.T.", "name": "IK-4A Videografi", "sem": 4, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            {"code": "MKKD1038", "lec": "Munawir, M.T.", "name": "IK-4A Fotografi", "sem": 4, "cohort": "A", "kbk": "MULTIMEDIA", "count": 25},
            # KBK Pemrograman (Paralel)
            {"code": "MKKD1006", "lec": "Fitriani, M.T.", "name": "IK-4A Struktur Data & Algoritma", "sem": 4, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 28},
            {"code": "MKKL1003", "lec": "Teuku Rizky, M.Kom.", "name": "IK-4A PBO", "sem": 4, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 28},

            # Semester 5: Wajib Umum + Multimedia (*) + Pemrograman + IoT (*)
            {"code": "MKWI05", "lec": "Cut Maysarah, M.Kom.", "name": "IK-5A Kewirausahaan", "sem": 5, "cohort": "A", "kbk": "GENERAL", "count": 28},
            {"code": "MKKL1008", "lec": "Teuku Rizky, M.Kom.", "name": "IK-5A Manajemen Proyek", "sem": 5, "cohort": "A", "kbk": "GENERAL", "count": 28},
            {"code": "MKKL1013", "lec": "Zulkifli, M.Kom.", "name": "IK-5A Metodologi Penelitian", "sem": 5, "cohort": "A", "kbk": "GENERAL", "count": 28},
            # KBK Multimedia (*)
            {"code": "MKKD1041", "lec": "Munawir, M.T.", "name": "IK-5A Editing Videografi", "sem": 5, "cohort": "A", "kbk": "MULTIMEDIA", "count": 24},
            {"code": "MKKD1042", "lec": "Munawir, M.T.", "name": "IK-5A Editing Fotografi", "sem": 5, "cohort": "A", "kbk": "MULTIMEDIA", "count": 24},
            {"code": "MKKD1043", "lec": "Rini Anggraini, M.Kom.", "name": "IK-5A Animasi 3D", "sem": 5, "cohort": "A", "kbk": "MULTIMEDIA", "count": 24},
            {"code": "MKKD1044", "lec": "Rini Anggraini, M.Kom.", "name": "IK-5A Teknologi Media Visual", "sem": 5, "cohort": "A", "kbk": "MULTIMEDIA", "count": 24},
            {"code": "MKKL1010", "lec": "Rini Anggraini, M.Kom.", "name": "IK-5A Multimedia", "sem": 5, "cohort": "A", "kbk": "MULTIMEDIA", "count": 24},
            # KBK IoT (*)
            {"code": "MKKD1045", "lec": "Hendra Syahputra, M.Kom.", "name": "IK-5A Sistem & Aplikasi IoT", "sem": 5, "cohort": "A", "kbk": "IOT", "count": 24},
            {"code": "MKKD1046", "lec": "Munawir, M.T.", "name": "IK-5A Perancangan Sistem IoT", "sem": 5, "cohort": "A", "kbk": "IOT", "count": 24},
            {"code": "MKKD1047", "lec": "Hendra Syahputra, M.Kom.", "name": "IK-5A Teknologi IoT", "sem": 5, "cohort": "A", "kbk": "IOT", "count": 24},
            {"code": "MKKD1048", "lec": "Munawir, M.T.", "name": "IK-5A Sensor IoT", "sem": 5, "cohort": "A", "kbk": "IOT", "count": 24},
            {"code": "MKKD1049", "lec": "Fitriani, M.T.", "name": "IK-5A Keamanan Jaringan", "sem": 5, "cohort": "A", "kbk": "IOT", "count": 24},
            # KBK Pemrograman (Paralel)
            {"code": "MKKL1023", "lec": "Fitriani, M.T.", "name": "IK-5A Machine Learning", "sem": 5, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 26},
            {"code": "MKKL1011", "lec": "Ahmad Fauzi, M.Cs.", "name": "IK-5A Data Mining", "sem": 5, "cohort": "A", "kbk": "PEMROGRAMAN", "count": 26},
        ]

        for cls_data in sample_classes:
            course_obj = created_courses.get(cls_data["code"])
            lecturer_obj = lec_map.get(cls_data["lec"], default_lec)
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
        print(f"[SUCCESS] Created {len(sample_classes)} academic classes across General and Multimedia tracks!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Migration failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    apply_complete_curriculum()
