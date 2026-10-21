"""
Sync SIMKA Courses Script
Menyinkronkan kurikulum mata kuliah lengkap Program Studi S1 Ilmu Komputer UBBG
berdasarkan dataset portal resmi OpenSIMKA (https://opensimka.bbg.ac.id/portal/mata-kuliah-saya).

Mendukung opsi CLI:
  --dry-run : Menampilkan rencana penambahan/pembaruan data tanpa mengubah basis data
  --file    : Menggunakan file dataset json eksternal (default: app/seeds/opensimka_courses.json)
"""

import sys
import os
import json
import uuid
import argparse
from typing import List, Dict, Any, Tuple

# Konfigurasi terminal Windows agar aman UTF-8
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Pastikan path root backend tersedia
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.database import engine, SessionLocal
from app.models.master import Course


def ensure_course_schema():
    """
    Memastikan kolom 'jenis_mk' dan 'prerequisites' tersedia di tabel 'courses'.
    Kompatibel untuk SQLite maupun PostgreSQL (AlloyDB).
    """
    dialect_name = engine.dialect.name
    with engine.connect() as conn:
        if dialect_name == "sqlite":
            cursor = conn.connection.cursor()
            cursor.execute("PRAGMA table_info(courses)")
            cols = {r[1] for r in cursor.fetchall()}
            if "jenis_mk" not in cols:
                print("[MIGRATION] Menambahkan kolom 'jenis_mk' ke tabel courses...")
                conn.execute(text("ALTER TABLE courses ADD COLUMN jenis_mk VARCHAR(20) DEFAULT 'Wajib'"))
                conn.commit()
            if "prerequisites" not in cols:
                print("[MIGRATION] Menambahkan kolom 'prerequisites' ke tabel courses...")
                conn.execute(text("ALTER TABLE courses ADD COLUMN prerequisites VARCHAR(255)"))
                conn.commit()
        else:
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS jenis_mk VARCHAR(20) DEFAULT 'Wajib'"))
            conn.execute(text("ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites VARCHAR(255)"))
            conn.commit()


def load_dataset(filepath: str) -> List[Dict[str, Any]]:
    """
    Memuat dataset mata kuliah dari file JSON.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"File dataset tidak ditemukan di: {filepath}")
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def sync_courses(dataset: List[Dict[str, Any]], dry_run: bool = False) -> Dict[str, Any]:
    """
    Menyinkronkan daftar mata kuliah ke tabel basis data.
    """
    ensure_course_schema()
    db = SessionLocal()

    try:
        existing_courses = {c.code: c for c in db.query(Course).all()}
        print(f"[INFO] Ditemukan {len(existing_courses)} mata kuliah yang sudah ada di database.")
        print(f"[INFO] Memproses {len(dataset)} mata kuliah dari dataset OpenSIMKA...")

        stats = {
            "total_input": len(dataset),
            "updated": 0,
            "inserted": 0,
            "unchanged": 0,
            "semester_dist": {},
            "kbk_dist": {},
        }

        changes_summary = []

        for item in dataset:
            code = item["code"]
            name = item["name"]
            credits = item["credits"]
            semester = item["semester"]
            course_type = item["course_type"]
            kbk = item["kbk"]
            jenis_mk = item.get("jenis_mk", "Wajib")
            prerequisites = item.get("prerequisites")

            stats["semester_dist"][semester] = stats["semester_dist"].get(semester, 0) + 1
            stats["kbk_dist"][kbk] = stats["kbk_dist"].get(kbk, 0) + 1

            if code in existing_courses:
                c = existing_courses[code]
                has_diff = (
                    c.name != name or
                    c.credits != credits or
                    c.semester != semester or
                    c.course_type != course_type or
                    c.kbk != kbk or
                    getattr(c, "jenis_mk", None) != jenis_mk or
                    getattr(c, "prerequisites", None) != prerequisites
                )

                if has_diff:
                    stats["updated"] += 1
                    changes_summary.append({
                        "action": "UPDATE",
                        "code": code,
                        "name": name,
                        "sem": semester,
                        "sks": credits,
                        "kbk": kbk,
                        "type": course_type,
                        "jenis": jenis_mk,
                    })
                    if not dry_run:
                        c.name = name
                        c.credits = credits
                        c.semester = semester
                        c.course_type = course_type
                        c.kbk = kbk
                        c.jenis_mk = jenis_mk
                        c.prerequisites = prerequisites
                else:
                    stats["unchanged"] += 1
            else:
                stats["inserted"] += 1
                changes_summary.append({
                    "action": "INSERT",
                    "code": code,
                    "name": name,
                    "sem": semester,
                    "sks": credits,
                    "kbk": kbk,
                    "type": course_type,
                    "jenis": jenis_mk,
                })
                if not dry_run:
                    new_course = Course(
                        id=uuid.uuid4(),
                        code=code,
                        name=name,
                        credits=credits,
                        semester=semester,
                        course_type=course_type,
                        kbk=kbk,
                        jenis_mk=jenis_mk,
                        prerequisites=prerequisites
                    )
                    db.add(new_course)

        if not dry_run:
            db.commit()
            print(f"[SUCCESS] Transaksi database berhasil disimpan!")
        else:
            print("[INFO] DRY-RUN MODE: Perubahan tidak disimpan ke database.")

        return stats, changes_summary

    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Sinkronisasi mata kuliah resmi S1 Ilmu Komputer dari OpenSIMKA.")
    parser.add_argument("--dry-run", action="store_true", help="Uji coba tanpa commit ke basis data")
    parser.add_argument("--file", type=str, default=os.path.join(os.path.dirname(__file__), "seeds", "opensimka_courses.json"), help="Lokasi file JSON dataset mata kuliah")

    args = parser.parse_args()

    print("=" * 70)
    print(" SINKRONISASI MATA KULIAH PRODI ILMU KOMPUTER UBBG (OpenSIMKA)")
    print("=" * 70)
    print(f"File Dataset : {args.file}")
    print(f"Mode         : {'DRY-RUN (Simulasi)' if args.dry_run else 'EKSEKUSI REAL (Persist ke DB)'}")
    print("-" * 70)

    dataset = load_dataset(args.file)
    stats, changes = sync_courses(dataset, dry_run=args.dry_run)

    print("\n" + "=" * 70)
    print(" RINGKASAN HASIL SINKRONISASI")
    print("=" * 70)
    print(f"Total Mata Kuliah Input  : {stats['total_input']}")
    print(f"Mata Kuliah Baru (INSERT): {stats['inserted']}")
    print(f"Mata Kuliah Update       : {stats['updated']}")
    print(f"Mata Kuliah Tetap        : {stats['unchanged']}")
    print("-" * 70)
    print("Distribusi per Semester:")
    for sem in sorted(stats["semester_dist"].keys()):
        print(f"  - Semester {sem}: {stats['semester_dist'][sem]} MK")
    print("-" * 70)
    print("Distribusi per Kelompok Bidang Keahlian (KBK):")
    for kbk, count in sorted(stats["kbk_dist"].items()):
        print(f"  - {kbk:<14}: {count} MK")
    print("=" * 70)

    if changes:
        print(f"\nDetail Perubahan ({len(changes)} Item):")
        for ch in changes:
            print(f"[{ch['action']}] Sem {ch['sem']} | {ch['code']} - {ch['name']} ({ch['sks']} SKS) | {ch['kbk']} | {ch['type']} | {ch['jenis']}")


if __name__ == "__main__":
    main()
