import uuid
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.master import Course

def seed_even_semester_courses():
    db: Session = SessionLocal()
    try:
        even_courses_data = [
            # Semester 2
            {"code": "MKKD2001", "name": "Algoritma & Pemrograman II", "credits": 3, "semester": 2, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD2002", "name": "Praktikum Algoritma & Pemrograman II", "credits": 2, "semester": 2, "course_type": "LABORATORY", "kbk": "GENERAL"},
            {"code": "MKKD2003", "name": "Arsitektur & Organisasi Komputer", "credits": 3, "semester": 2, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD2004", "name": "Kalkulus Komputasi", "credits": 3, "semester": 2, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD2005", "name": "Pendidikan Agama Islam", "credits": 2, "semester": 2, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD2006", "name": "Bahasa Indonesia Akademik", "credits": 2, "semester": 2, "course_type": "THEORY", "kbk": "GENERAL"},

            # Semester 4
            {"code": "MKKD2020", "name": "Pemrograman Berorientasi Objek (PBO)", "credits": 3, "semester": 4, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD2021", "name": "Praktikum Pemrograman Berorientasi Objek", "credits": 2, "semester": 4, "course_type": "LABORATORY", "kbk": "GENERAL"},
            {"code": "MKKD2022", "name": "Sistem Basis Data Lanjut", "credits": 3, "semester": 4, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD2023", "name": "Jaringan Komputer Dasar", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "GENERAL"},
            {"code": "MKKB4001", "name": "Framework Web Modern", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKB4002", "name": "Desain Animasi & Vektor", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKB4003", "name": "Jaringan Sensor Nirkabel (WSN)", "credits": 3, "semester": 4, "course_type": "LABORATORY", "kbk": "IOT"},

            # Semester 6
            {"code": "MKKD2030", "name": "Keamanan Jaringan & Kriptografi", "credits": 3, "semester": 6, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD2031", "name": "Data Mining & Analisis Data", "credits": 3, "semester": 6, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD2032", "name": "Metodologi Penelitian Ilkom", "credits": 2, "semester": 6, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKB6001", "name": "Pengembangan Mobile Lanjut (Cross-Platform)", "credits": 3, "semester": 6, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKB6002", "name": "Visual Effect & Motion Graphic Lanjut", "credits": 3, "semester": 6, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKB6003", "name": "Embedded Linux & Edge AI", "credits": 3, "semester": 6, "course_type": "LABORATORY", "kbk": "IOT"},

            # Semester 8
            {"code": "MKKD2040", "name": "Skripsi / Tugas Akhir", "credits": 6, "semester": 8, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKD2041", "name": "Seminar Hasil Riset Komputasi", "credits": 2, "semester": 8, "course_type": "THEORY", "kbk": "GENERAL"},
            {"code": "MKKB8001", "name": "Software Architecture & Microservices", "credits": 3, "semester": 8, "course_type": "LABORATORY", "kbk": "PEMROGRAMAN"},
            {"code": "MKKB8002", "name": "Produksi Media Interaktif & VR", "credits": 3, "semester": 8, "course_type": "LABORATORY", "kbk": "MULTIMEDIA"},
            {"code": "MKKB8003", "name": "IoT Cloud Platform & Telemetri", "credits": 3, "semester": 8, "course_type": "LABORATORY", "kbk": "IOT"},
        ]

        added_count = 0
        for c_data in even_courses_data:
            existing = db.query(Course).filter(Course.code == c_data["code"]).first()
            if not existing:
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
                added_count += 1
        db.commit()
        print(f"[SUCCESS] Added {added_count} even semester courses (Sem 2, 4, 6, 8) to database!")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to seed even courses: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_even_semester_courses()
